import {
	Anchor,
	Checkbox,
	Button,
	Group,
	Paper,
	type PaperProps,
	PasswordInput,
	Stack,
	Text,
	TextInput,
	UnstyledButton,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { upperFirst, useToggle } from '@mantine/hooks'
import { useState } from 'react'
import { AppLayout } from '../../components/AppLayout'
import classes from './CheckboxCard.module.css'

export function AuthPage(props: PaperProps) {
	const [type, toggle] = useToggle(['login', 'register'])
	const form = useForm({
		initialValues: {
			email: '',
			name: '',
			password: '',
			terms: true,
		},

		validate: {
			email: val => (/^\S+@\S+$/.test(val) ? null : 'Invalid email'),
			password: val =>
				val.length <= 6
					? 'Password should include at least 6 characters'
					: null,
		},
	})

	const [value, onChange] = useState(false)

	return (
		<AppLayout>
			<Paper radius='md' p='lg' withBorder {...props}>
				<Text size='lg' fw={500} c='bright'>
					{type === 'register' ? 'Регистрация' : 'Вход в аккаунт'}
				</Text>

				<form onSubmit={form.onSubmit(() => {})}>
					<Stack>
						{type === 'register' && (
							<TextInput
								label='Name'
								placeholder='Your name'
								value={form.values.name}
								onChange={event =>
									form.setFieldValue('name', event.currentTarget.value)
								}
								radius='md'
							/>
						)}

						<TextInput
							required
							label='Email'
							placeholder='email@example.com'
							value={form.values.email}
							onChange={event =>
								form.setFieldValue('email', event.currentTarget.value)
							}
							error={form.errors.email && 'Неверный формат email'}
							radius='md'
						/>

						<PasswordInput
							required
							label='Password'
							placeholder='Пароль'
							value={form.values.password}
							onChange={event =>
								form.setFieldValue('password', event.currentTarget.value)
							}
							error={
								form.errors.password &&
								'Пароль должен содержать не менее 6 символов'
							}
							radius='md'
						/>

						{type === 'register' && (
							<Checkbox
								label='Я согласен с условиями использования'
								checked={form.values.terms}
								onChange={event =>
									form.setFieldValue('terms', event.currentTarget.checked)
								}
							/>
						)}
					</Stack>

					<Group justify='space-between' mt='xl'>
						<Anchor
							component='button'
							type='button'
							c='bright'
							opacity={0.85}
							onClick={() => toggle()}
							size='xs'
						>
							{type === 'register'
								? 'Already have an account? Login'
								: "Don't have an account? Register"}
						</Anchor>
						{
							<Button type='submit' radius='xl'>
								{upperFirst(type)}
							</Button>
						}
						<UnstyledButton component='label' className={classes.button}>
							<Checkbox
								checked={value}
								onChange={event => onChange(event.currentTarget.checked)}
								size='md'
								mr='xl'
								styles={{ input: { cursor: 'pointer' } }}
							/>

							<div>
								<Text size='xs' c='dimmed' ta='center'>
									Нажимая на кнопку, вы даете согласие на обработку ваших{' '}
									<Anchor
										href='/privacy'
										target='_blank'
										inherit
										underline='always'
									>
										персональных данных
									</Anchor>
								</Text>
							</div>
						</UnstyledButton>
					</Group>
				</form>
			</Paper>
		</AppLayout>
	)
}
