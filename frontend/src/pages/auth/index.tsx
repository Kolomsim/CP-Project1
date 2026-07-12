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
	CopyButton,
	ActionIcon,
	Tooltip,
	Input,
	Box,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { upperFirst, useToggle } from '@mantine/hooks'
import { useNavigate } from 'react-router'
import { IconInfoCircle, IconCheck, IconCopy } from '@tabler/icons-react'
import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { suggestUsername } from '../../services/auth'

export function AuthPage(props: PaperProps) {
	const [type, toggle] = useToggle(['login', 'register'])
	const [error, setError] = useState<string | null>(null)
	const [generatedUsername, setGeneratedUsername] = useState<string | null>(null)
	const [loadingUsername, setLoadingUsername] = useState(false)
	const [loading, setLoading] = useState(false)
	const navigate = useNavigate()
	const { login, register, isAuthenticated } = useAuth()

	const form = useForm({
		initialValues: {
			username: '',
			password: '',
		},

		validate: {
			username: val => (type === 'login' && !val.trim() ? 'Логин обязателен' : null),
			password: val => (val.length < 6 ? 'Пароль должен содержать не менее 6 символов' : null),
		},
	})

	const loadSuggestedUsername = useCallback(async () => {
		setLoadingUsername(true)
		setError(null)
		try {
			const username = await suggestUsername()
			setGeneratedUsername(username)
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Не удалось сгенерировать логин')
		} finally {
			setLoadingUsername(false)
		}
	}, [])

	useEffect(() => {
		if (type === 'register') {
			loadSuggestedUsername()
		}
	}, [type, loadSuggestedUsername])

	if (isAuthenticated) {
		navigate('/')
		return null
	}

	const handleSubmit = async (values: typeof form.values) => {
		setError(null)
		setLoading(true)

		try {
			if (type === 'register') {
				if (!generatedUsername) {
					setError('Логин ещё не сгенерирован')
					return
				}
				await register(generatedUsername, values.password)
			} else {
				await login(values.username, values.password)
			}
			navigate('/')
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Произошла ошибка')
		} finally {
			setLoading(false)
		}
	}

	const switchMode = () => {
		toggle()
		setError(null)
		form.reset()
		if (type === 'login') {
			setGeneratedUsername(null)
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
					{type === 'register' ? (
						<Input.Wrapper
							label='Логин'
							description='Создаётся автоматически и не может быть изменён'
						>
							<Box
								px='sm'
								h={36}
								style={{
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'space-between',
									border: '1px solid var(--mantine-color-default-border)',
									borderRadius: 'var(--mantine-radius-md)',
									backgroundColor: 'var(--mantine-color-default-hover)',
									userSelect: 'all',
								}}
							>
								<Text ff='monospace' fw={500} size='sm' c={loadingUsername ? 'dimmed' : undefined}>
									{loadingUsername ? 'Генерация логина...' : generatedUsername}
								</Text>
								{generatedUsername && (
									<CopyButton value={generatedUsername} timeout={2000}>
										{({ copied, copy }) => (
											<Tooltip label={copied ? 'Скопировано' : 'Скопировать логин'} withArrow>
												<ActionIcon
													variant='subtle'
													color={copied ? 'teal' : 'gray'}
													onClick={copy}
													aria-label='Скопировать логин'
												>
													{copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
												</ActionIcon>
											</Tooltip>
										)}
									</CopyButton>
								)}
							</Box>
						</Input.Wrapper>
					) : (
						<TextInput
							required
							label='Логин'
							placeholder='user_abc12345'
							value={form.values.username}
							onChange={event => form.setFieldValue('username', event.currentTarget.value)}
							error={form.errors.username}
							radius='md'
						/>
					)}

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
						onClick={switchMode}
						size='xs'
					>
						{type === 'register' ? 'Уже есть аккаунт? Войти' : 'Нет аккаунта? Зарегистрироваться'}
					</Anchor>
					<Button
						type='submit'
						radius='xl'
						loading={loading || (type === 'register' && loadingUsername)}
						disabled={type === 'register' && !generatedUsername}
					>
						{upperFirst(type === 'register' ? 'Регистрация' : 'Войти')}
					</Button>
				</Group>
			</form>
		</Paper>
	)
}
