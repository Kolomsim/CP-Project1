const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'

type ApiErrorBody = {
	detail?: string | Array<{ msg?: string; loc?: Array<string | number> }>
}

export class ApiError extends Error {
	status: number

	constructor(message: string, status: number) {
		super(message)
		this.name = 'ApiError'
		this.status = status
	}
}

async function parseError(response: Response): Promise<string> {
	try {
		const body = (await response.json()) as ApiErrorBody
		if (Array.isArray(body.detail)) {
			const message = body.detail
				.map(item => item.msg)
				.filter(Boolean)
				.join('. ')
			if (message) {
				return message
			}
		}
		if (typeof body.detail === 'string' && body.detail) {
			return body.detail
		}
	} catch {
		// ignore JSON parse errors
	}

	return `Ошибка запроса (${response.status})`
}

// ─── Token management ────────────────────────────────────────────────

function getAccessToken(): string | null {
	return localStorage.getItem('access_token')
}

function getRefreshToken(): string | null {
	return localStorage.getItem('refresh_token')
}

function setTokens(access: string, refresh: string): void {
	localStorage.setItem('access_token', access)
	localStorage.setItem('refresh_token', refresh)
}

function clearTokens(): void {
	localStorage.removeItem('access_token')
	localStorage.removeItem('refresh_token')
}

async function refreshTokens(): Promise<boolean> {
	const refreshToken = getRefreshToken()
	if (!refreshToken) return false

	try {
		const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ refresh_token: refreshToken }),
		})

		if (!res.ok) {
			clearTokens()
			return false
		}

		const data = await res.json()
		setTokens(data.access_token, data.refresh_token)
		return true
	} catch {
		clearTokens()
		return false
	}
}

// ─── Main request function ───────────────────────────────────────────

export async function apiRequest<T>(path: string, init?: RequestInit & { skipAuth?: boolean }): Promise<T> {
	const { skipAuth = false, ...fetchOptions } = init ?? {}

	const headers: Record<string, string> = {
		'Content-Type': 'application/json',
		...(fetchOptions.headers as Record<string, string>),
	}

	if (!skipAuth) {
		const token = getAccessToken()
		if (token) {
			headers['Authorization'] = `Bearer ${token}`
		}
	}

	let res = await fetch(`${API_BASE_URL}${path}`, {
		...fetchOptions,
		headers,
	})

	// Если 401 — пробуем обновить токен
	if (res.status === 401 && !skipAuth) {
		const refreshed = await refreshTokens()
		if (refreshed) {
			const newToken = getAccessToken()
			headers['Authorization'] = `Bearer ${newToken}`
			res = await fetch(`${API_BASE_URL}${path}`, {
				...fetchOptions,
				headers,
			})
		}
	}

	if (!res.ok) {
		throw new ApiError(await parseError(res), res.status)
	}

	// Handle 204 No Content
	if (res.status === 204) {
		return undefined as T
	}

	return (await res.json()) as T
}

export { getAccessToken, getRefreshToken, setTokens, clearTokens }
