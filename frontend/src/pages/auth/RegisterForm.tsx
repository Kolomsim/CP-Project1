import { ActionIcon, Box, Button, CopyButton, Group, Input, PasswordInput, Text, Tooltip } from '@mantine/core'
import { IconCheck, IconCopy } from '@tabler/icons-react'

type RegisterFormProps = {
	generatedUsername: string | null
	loadingUsername: boolean
	loading: boolean
	disabled: boolean
	onSubmit: (password: string) => void
}

export default function RegisterForm({
	generatedUsername,
	loadingUsername,
	loading,
	disabled,
	onSubmit,
}: RegisterFormProps) {
	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault()
		const formData = new FormData(e.currentTarget as HTMLFormElement)
		const password = formData.get('password') as string
		onSubmit(password)
	}

	return (
		<form onSubmit={handleSubmit}>
			<Input.Wrapper
				label='Логин'
				description='Создаётся автоматически и не может быть изменён. Сохраните его, чтобы позже войти в аккаунт.'
				mt='md'
			>
				<Box
					px='sm'
					h={36}
					mt={4}
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

			<PasswordInput required label='Пароль' placeholder='Пароль' name='password' radius='md' mt='md' />

			<Group justify='flex-end' mt='xl'>
				<Button type='submit' radius='xl' loading={loading || loadingUsername} disabled={disabled}>
					Регистрация
				</Button>
			</Group>
		</form>
	)
}
