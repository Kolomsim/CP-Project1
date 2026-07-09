/**
 * Контекст аутентификации для всего приложения.
 * Предоставляет состояние пользователя и методы входа/выхода.
 */

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import type { User } from '../services/auth'
import { loginUser, registerUser, getCurrentUser, logoutUser as logoutApi } from '../services/auth'
import { getAccessToken, clearTokens } from '../services/api'

interface AuthContextValue {
	user: User | null
	isLoading: boolean
	isAuthenticated: boolean
	login: (email: string, password: string) => Promise<void>
	register: (email: string, password: string, name: string) => Promise<void>
	logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
	const [user, setUser] = useState<User | null>(null)
	const [isLoading, setIsLoading] = useState(true)

	// Проверяем, есть ли уже токен при загрузке
	useEffect(() => {
		const initAuth = async () => {
			const token = getAccessToken()
			if (!token) {
				setIsLoading(false)
				return
			}

			try {
				const currentUser = await getCurrentUser()
				setUser(currentUser)
			} catch {
				// Токен недействителен — очищаем
				clearTokens()
			} finally {
				setIsLoading(false)
			}
		}

		initAuth()
	}, [])

	const login = useCallback(async (email: string, password: string) => {
		const response = await loginUser(email, password)
		setUser(response.user)
	}, [])

	const register = useCallback(async (email: string, password: string, name: string) => {
		const response = await registerUser(email, password, name)
		setUser(response.user)
	}, [])

	const logout = useCallback(async () => {
		await logoutApi()
		setUser(null)
	}, [])

	return (
		<AuthContext.Provider
			value={{
				user,
				isLoading,
				isAuthenticated: !!user,
				login,
				register,
				logout,
			}}
		>
			{children}
		</AuthContext.Provider>
	)
}

export function useAuth(): AuthContextValue {
	const context = useContext(AuthContext)
	if (!context) {
		throw new Error('useAuth must be used within an AuthProvider')
	}
	return context
}
