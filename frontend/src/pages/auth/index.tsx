import {
	Anchor,
	Button,
	Group,
	Paper,
	type PaperProps,
	PasswordInput,
	Stack,
	Text,
	TextInput,
	Alert,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { upperFirst, useToggle } from '@mantine/hooks'
import { useNavigate } from 'react-router'
import { IconInfoCircle } from '@tabler/icons-react'
import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'

export function AuthPage(props: PaperProps) {
	const [type, toggle] = useToggle(['login', 'register'])
	const [error, setError] = useState<string | null>(null)
	const [loading, setLoading] = useState(false)
	const navigate = useNavigate()
	const { login, register, isAuthenticated } = useAuth()

	const form = useForm({
		initialValues: {
			email: '',
			name: '',
			password: '',
			terms: true,
		},

		validate: {
			email: val => (/^\S+@\S+$/.test(val) ? null : 'Неверный формат email'),
			password: val => (val.length < 6 ? 'Пароль должен содержать не менее 6 символов' : null),
			name: (val, _values, path) => {
				if (path === 'register' && !val.trim()) {
					return 'Имя обязательно'
				}
				return null
			},
		},
	})

	// Если уже авторизован — перенаправляем на главную
	if (isAuthenticated) {
		navigate('/')
		return null
	}

	const handleSubmit = async (values: typeof form.values) => {
		setError(null)
		setLoading(true)

		try {
			if (type === 'register') {
				await register(values.email, values.password, values.name)
			} else {
				await login(values.email, values.password)
			}
			navigate('/')
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Произошла ошибка')
		} finally {
			setLoading(false)
		}
	}

	return (
		<Paper radius='md' p='lg' withBorder maw={480} mx='auto' {...props}>
			<Text size='lg' fw={500} c='bright' mb='md'>
				{type === 'register' ? 'Регистрация' : 'Вход в аккаунт'}
			</Text>

			{error && (
				<Alert icon={<IconInfoCircle size={16} />} color='red' variant='light' mb='md'>
					{error}
				</Alert>
			)}

			<form onSubmit={form.onSubmit(handleSubmit)}>
				<Stack>
					{type === 'register' && (
						<TextInput
							label='Имя'
							placeholder='Ваше имя'
							value={form.values.name}
							onChange={event => form.setFieldValue('name', event.currentTarget.value)}
							error={form.errors.name && 'Имя обязательно'}
							radius='md'
							required
						/>
					)}

					<TextInput
						required
						label='Email'
						placeholder='email@example.com'
						value={form.values.email}
						onChange={event => form.setFieldValue('email', event.currentTarget.value)}
						error={form.errors.email && 'Неверный формат email'}
						radius='md'
					/>

					<PasswordInput
						required
						label='Пароль'
						placeholder='Пароль'
						value={form.values.password}
						onChange={event => form.setFieldValue('password', event.currentTarget.value)}
						error={form.errors.password && 'Пароль должен содержать не менее 6 символов'}
						radius='md'
					/>
				</Stack>

				<Group justify='space-between' mt='xl'>
					<Anchor
						component='button'
						type='button'
						c='bright'
						opacity={0.85}
						onClick={() => {
							toggle()
							setError(null)
						}}
						size='xs'
					>
						{type === 'register' ? 'Уже есть аккаунт? Войти' : 'Нет аккаунта? Зарегистрироваться'}
					</Anchor>
					<Button type='submit' radius='xl' loading={loading}>
						{upperFirst(type === 'register' ? 'Регистрация' : 'Войти')}
					</Button>
				</Group>
			</form>
		</Paper>
	)
}
