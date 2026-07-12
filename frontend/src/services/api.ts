/**
 * Базовый API-клиент для взаимодействия с бэкендом.
 *
 * Перенесён в api/client.ts. Этот файл оставлен для обратной совместимости.
 */

export { apiRequest, getAccessToken, getRefreshToken, setTokens, clearTokens, ApiError } from '../api/client'
export type { ApiError as ApiErrorType } from '../api/client'
