import { Alert, Anchor, Center, Paper, Text } from '@mantine/core'
import { useToggle } from '@mantine/hooks'
import { useNavigate } from 'react-router'
import { IconInfoCircle } from '@tabler/icons-react'
import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { suggestUsername } from '../../api/auth'
import LoginForm from './LoginForm'
import RegisterForm from './RegisterForm'

export default function AuthPage() {
	const [type, toggle] = useToggle(['login', 'register'])
	const [error, setError] = useState<string | null>(null)
	const [generatedUsername, setGeneratedUsername] = useState<string | null>(null)
	const [loadingUsername, setLoadingUsername] = useState(false)
	const [loading, setLoading] = useState(false)
	const navigate = useNavigate()
	const { login, register, isAuthenticated, user } = useAuth()
	const [redirectAfterLogin, setRedirectAfterLogin] = useState(false)

	useEffect(() => {
		if (redirectAfterLogin && user) {
			if (user.role === 'author') {
				navigate('/kb')
			} else {
				navigate('/home')
			}
		}
	}, [redirectAfterLogin, user, navigate])

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
		navigate('/home')
		return null
	}

	const handleLogin = async (values: { username: string; password: string }) => {
		setError(null)
		setLoading(true)
		try {
			await login(values.username, values.password)
			// Устанавливаем флаг для перенаправления после входа
			setRedirectAfterLogin(true)
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Произошла ошибка')
		} finally {
			setLoading(false)
		}
	}

	const handleRegister = async (password: string) => {
		if (!generatedUsername) {
			setError('Логин ещё не сгенерирован')
			return
		}
		setError(null)
		setLoading(true)
		try {
			await register(generatedUsername, password)
			navigate('/home')
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Произошла ошибка')
		} finally {
			setLoading(false)
		}
	}

	const switchMode = () => {
		toggle()
		setError(null)
		if (type === 'login') {
			setGeneratedUsername(null)
		}
	}

	return (
		<Center style={{ minHeight: '100%' }}>
			<Paper
				radius='md'
				p='lg'
				withBorder
				maw={480}
				w='100%'
				style={{
					borderColor: 'var(--sc-border-strong)',
					background: 'var(--sc-surface)',
					boxShadow: 'var(--sc-shadow)',
				}}
			>
				<Text size='lg' fw={700} mb='md' c='var(--sc-ink)'>
					{type === 'register' ? 'Регистрация' : 'Вход в аккаунт'}
				</Text>

				{error && (
					<Alert icon={<IconInfoCircle size={16} />} color='red' variant='light' mb='md'>
						{error}
					</Alert>
				)}

				{type === 'login' ? (
					<LoginForm loading={loading} onSubmit={handleLogin} />
				) : (
					<RegisterForm
						generatedUsername={generatedUsername}
						loadingUsername={loadingUsername}
						loading={loading}
						disabled={!generatedUsername}
						onSubmit={handleRegister}
					/>
				)}

				<Anchor component='button' type='button' c='brand.7' opacity={0.9} onClick={switchMode} size='xs' mt='md'>
					{type === 'register' ? 'Уже есть аккаунт? Войти' : 'Нет аккаунта? Зарегистрироваться'}
				</Anchor>
			</Paper>
		</Center>
	)
}
