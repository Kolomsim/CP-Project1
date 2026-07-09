/**
 * API-сервис для аутентификации.
 */

import { apiRequest, setTokens, clearTokens } from './api'

export interface User {
	id: string
	email: string
	name: string
	created_at: string
}

export interface TokenResponse {
	access_token: string
	refresh_token: string
	token_type: string
	user: User
}

export async function registerUser(email: string, password: string, name: string): Promise<TokenResponse> {
	const data = await apiRequest<TokenResponse>('/auth/register', {
		method: 'POST',
		body: JSON.stringify({ email, password, name }),
		skipAuth: true,
	})

	setTokens(data.access_token, data.refresh_token)
	return data
}

export async function loginUser(email: string, password: string): Promise<TokenResponse> {
	const data = await apiRequest<TokenResponse>('/auth/login', {
		method: 'POST',
		body: JSON.stringify({ email, password }),
		skipAuth: true,
	})

	setTokens(data.access_token, data.refresh_token)
	return data
}

export async function getCurrentUser(): Promise<User> {
	return apiRequest<User>('/auth/me')
}

export async function logoutUser(): Promise<void> {
	try {
		await apiRequest('/auth/logout', { method: 'POST' })
	} catch {
		// Игнорируем ошибки при выходе
	}
	clearTokens()
}
