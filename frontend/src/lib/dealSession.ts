const SESSION_ID_KEY = 'dealSessionId'
const PROPERTY_PREVIEW_KEY = 'dealPropertyPreview'
const PROPERTY_URL_KEY = 'dealPropertyUrl'
const CHECKLIST_ANSWERS_KEY = 'dealChecklistAnswers'
const BUYER_CITIZENSHIP_KEY = 'dealBuyerCitizenship'

export function getDealSessionId(): string | null {
  return sessionStorage.getItem(SESSION_ID_KEY)
}

export function setDealSessionId(sessionId: string): void {
  sessionStorage.setItem(SESSION_ID_KEY, sessionId)
}

export function saveDealBuyerCitizenship(citizenship: string): void {
  sessionStorage.setItem(BUYER_CITIZENSHIP_KEY, citizenship)
}

export function getDealBuyerCitizenship(): string | null {
  return sessionStorage.getItem(BUYER_CITIZENSHIP_KEY)
}

export function clearDealSession(): void {
  sessionStorage.removeItem(SESSION_ID_KEY)
  sessionStorage.removeItem(PROPERTY_PREVIEW_KEY)
  sessionStorage.removeItem(PROPERTY_URL_KEY)
  sessionStorage.removeItem(CHECKLIST_ANSWERS_KEY)
  sessionStorage.removeItem(BUYER_CITIZENSHIP_KEY)
}

export function saveDealPropertyPreview<T>(property: T, url: string): void {
  sessionStorage.setItem(PROPERTY_PREVIEW_KEY, JSON.stringify(property))
  sessionStorage.setItem(PROPERTY_URL_KEY, url)
  sessionStorage.removeItem(CHECKLIST_ANSWERS_KEY)
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

export function saveDealChecklistAnswers<T>(answers: T): void {
  sessionStorage.setItem(CHECKLIST_ANSWERS_KEY, JSON.stringify(answers))
}

export function getDealChecklistAnswers<T>(): T | null {
  const raw = sessionStorage.getItem(CHECKLIST_ANSWERS_KEY)
  if (!raw) {
    return null
  }

  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}
