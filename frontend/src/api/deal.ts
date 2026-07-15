import { apiRequest } from './client'
import { getDealSessionId } from '../lib/dealSession'
import { mapApiPropertyToPreview, type ApiPropertyPreview } from '../lib/propertyMapper'
import type { PropertyPreview } from '../pages/deal/deal_object/types'
import type { DealCheckResult, DealRisk } from '../pages/deal/deal_result/types'

type BuyerInfoPayload = {
	citizenship: string
	purchase_method: string
}

type BuyerInfoResponse = {
	session_id: string
}

type PropertyInfoPayload = {
	session_id: string
	url: string
}

type ApiRisk = {
	type: string
	severity: string
	title: string
	description: string
	recommendation: string
	article_link?: string | null
	details?: string | null
}

type CheckRisksResponse = {
	problems: ApiRisk[]
	overall_rating: string
	property_details: Record<string, unknown>
	risk_count: number
	critical_count: number
	check_date: string
}

const CITIZENSHIP_MAP: Record<string, string> = {
	russian: 'Россия',
	foreign: 'Украина',
	none: 'Беларусь',
}

const PURCHASE_METHOD_MAP: Record<string, string> = {
	full_payment: 'Сразу',
	mortgage: 'Ипотека',
	installment: 'Кредит',
	mat_capital: 'Материнский капитал',
	state_support: 'Государственная поддержка',
	other: 'Другое',
}

function mapRisk(risk: ApiRisk): DealRisk {
	return {
		type: risk.type,
		severity: risk.severity as DealRisk['severity'],
		title: risk.title,
		description: risk.description,
		recommendation: risk.recommendation,
		articleLink: risk.article_link ?? undefined,
		details: risk.details ?? undefined,
	}
}

export async function saveBuyerInfo(form: {
	citizenship: string
	purchaseMethod: string
}): Promise<string> {
	const payload: BuyerInfoPayload = {
		citizenship: CITIZENSHIP_MAP[form.citizenship] ?? 'Россия',
		purchase_method: PURCHASE_METHOD_MAP[form.purchaseMethod] ?? 'Сразу',
	}

	const response = await apiRequest<BuyerInfoResponse>('/deal/buyer-info', {
		method: 'POST',
		body: JSON.stringify(payload),
	})

	return response.session_id
}

export async function fetchPropertyPreview(url: string, sessionId?: string): Promise<PropertyPreview> {
	const resolvedSessionId = sessionId ?? getDealSessionId()
	if (!resolvedSessionId) {
		throw new Error('Сессия не найдена. Сначала заполните анкету покупателя.')
	}

	const normalizedUrl = url.trim().match(/^https?:\/\//i) ? url.trim() : `https://${url.trim()}`

	const payload: PropertyInfoPayload = {
		session_id: resolvedSessionId,
		url: normalizedUrl,
	}

	const response = await apiRequest<ApiPropertyPreview>('/deal/property-info', {
		method: 'POST',
		body: JSON.stringify(payload),
	})

	return mapApiPropertyToPreview(response)
}

export async function fetchDealCheckResult(
	sessionId?: string,
	property?: PropertyPreview | null,
): Promise<DealCheckResult> {
	const resolvedSessionId = sessionId ?? getDealSessionId()
	if (!resolvedSessionId) {
		throw new Error('Сессия не найдена. Пройдите шаги сделки с начала.')
	}

	const response = await apiRequest<CheckRisksResponse>(
		`/deal/check-risks?session_id=${encodeURIComponent(resolvedSessionId)}`,
		{
			method: 'POST',
		},
	)

	if (!property) {
		throw new Error('Данные объекта не найдены. Вернитесь к шагу 2 и укажите ссылку.')
	}

	return {
		overallRating: response.overall_rating,
		problems: response.problems.map(mapRisk),
		property,
		riskCount: response.risk_count,
		criticalCount: response.critical_count,
		checkDate: response.check_date,
	}
}

type PropertyItemResponse = {
	id: string
	title: string
	property_data: Record<string, unknown>
	created_at: string
}

type PropertyListResponse = {
	properties: PropertyItemResponse[]
}

export async function savePropertyToFavorites(
	title: string,
	propertyData: Record<string, unknown>,
): Promise<PropertyItemResponse> {
	return apiRequest<PropertyItemResponse>('/properties/', {
		method: 'POST',
		body: JSON.stringify({ title, property_data: propertyData }),
	})
}

export async function fetchFavoriteProperties(): Promise<PropertyItemResponse[]> {
	const response = await apiRequest<PropertyListResponse>('/properties/', {
		method: 'GET',
	})
	return response.properties
}

export async function deleteFavoriteProperty(propertyId: string): Promise<void> {
	await apiRequest<void>(`/properties/${propertyId}`, {
		method: 'DELETE',
	})
}
