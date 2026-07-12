const SESSION_ID_KEY = 'dealSessionId'
const PROPERTY_PREVIEW_KEY = 'dealPropertyPreview'
const PROPERTY_URL_KEY = 'dealPropertyUrl'

export function getDealSessionId(): string | null {
  return sessionStorage.getItem(SESSION_ID_KEY)
}

export function setDealSessionId(sessionId: string): void {
  sessionStorage.setItem(SESSION_ID_KEY, sessionId)
}

export function clearDealSession(): void {
  sessionStorage.removeItem(SESSION_ID_KEY)
  sessionStorage.removeItem(PROPERTY_PREVIEW_KEY)
  sessionStorage.removeItem(PROPERTY_URL_KEY)
}

export function saveDealPropertyPreview<T>(property: T, url: string): void {
  sessionStorage.setItem(PROPERTY_PREVIEW_KEY, JSON.stringify(property))
  sessionStorage.setItem(PROPERTY_URL_KEY, url)
}

export function getDealPropertyUrl(): string | null {
  return sessionStorage.getItem(PROPERTY_URL_KEY)
}

export function getDealPropertyPreview<T>(): T | null {
  const raw = sessionStorage.getItem(PROPERTY_PREVIEW_KEY)
  if (!raw) {
    return null
  }

  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}
