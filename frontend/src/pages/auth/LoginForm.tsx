import { Button, Group, PasswordInput, TextInput } from '@mantine/core'
import { useForm } from '@mantine/form'

type LoginFormProps = {
	loading: boolean
	onSubmit: (values: { username: string; password: string }) => void
}

export default function LoginForm({ loading, onSubmit }: LoginFormProps) {
	const form = useForm({
		initialValues: {
			username: '',
			password: '',
		},
		validate: {
			username: val => (!val.trim() ? 'Логин обязателен' : null),
			password: val => (val.length < 6 ? 'Пароль должен содержать не менее 6 символов' : null),
		},
	})

	return (
		<form onSubmit={form.onSubmit(onSubmit)}>
			<TextInput
				required
				label='Логин'
				placeholder='user_abc12345'
				value={form.values.username}
				onChange={event => form.setFieldValue('username', event.currentTarget.value)}
				error={form.errors.username}
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
				mt='md'
			/>

			<Group justify='flex-end' mt='xl'>
				<Button type='submit' radius='xl' loading={loading}>
					Войти
				</Button>
			</Group>
		</form>
	)
}
