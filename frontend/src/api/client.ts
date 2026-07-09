const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

type ApiErrorBody = {
  detail?: string
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
    if (body.detail) {
      return body.detail
    }
  } catch {
    // ignore JSON parse errors
  }

  return `Ошибка запроса (${response.status})`
}

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
    ...init,
  })

  if (!response.ok) {
    throw new ApiError(await parseError(response), response.status)
  }

  return (await response.json()) as T
}
