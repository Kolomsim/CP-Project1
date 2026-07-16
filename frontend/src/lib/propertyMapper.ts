import type { PropertyPreview } from '../pages/deal/deal_object/types'

type ApiSeller = {
	name: string
	phone?: string | null
	inn?: string | null
	type?: string | null
	company_name?: string | null
}

type ApiLocation = {
	lat: number
	lon: number
	address?: string | null
}

export type ApiPropertyPreview = {
	id: string
	platform: string
	url: string
	title: string
	address: string
	price: number
	total_area: number
	living_area?: number | null
	kitchen_area?: number | null
	floor: number
	total_floors: number
	rooms: number
	property_type: string
	market_category?: string | null
	property_old?: string | null
	deal_type?: string | null
	seller: ApiSeller
	location: ApiLocation
	description?: string | null
}

const PROPERTY_TYPE_LABELS: Record<string, string> = {
	flat: 'квартира',
	apartment: 'апартаменты',
	house: 'дом',
	room: 'комната',
	land: 'участок',
	дом: 'дом',
	апартаменты: 'апартаменты',
	новостройка: 'новостройка',
	вторичка: 'вторичка',
}

const MARKET_CATEGORY_LABELS: Record<string, string> = {
	primary: 'новостройка',
	secondary: 'вторичка',
	новостройка: 'новостройка',
	вторичка: 'вторичка',
}

const DEAL_TYPE_LABELS: Record<string, string> = {
	free_sale: 'свободная продажа',
	alternative: 'альтернатива',
	mortgage: 'ипотека',
	Ипотека: 'ипотека',
	Сразу: 'свободная продажа',
	Кредит: 'кредит',
}

function mapPropertyType(value: string): string {
	const lower = value.trim().toLowerCase()
	if (lower.includes('апартамент') || lower === 'apartment') {
		return 'апартаменты'
	}
	return PROPERTY_TYPE_LABELS[value] ?? PROPERTY_TYPE_LABELS[lower] ?? value
}

function mapDealType(value?: string | null): string {
	if (!value) {
		return 'не указан'
	}

	return DEAL_TYPE_LABELS[value] ?? value
}

function mapMarketCategory(value?: string | null): string {
	if (!value) {
		return ''
	}

	const normalized = value
		.trim()
		.toLowerCase()
		.replace(/\u00a0/g, ' ')
	if (/[мm][²2]|₽|руб|%/.test(normalized)) {
		return ''
	}
	if (/\d/.test(normalized) && !/новостр|втор|первич/.test(normalized)) {
		return ''
	}
	if (normalized.includes('новостр') || normalized.includes('первич')) {
		return 'новостройка'
	}
	if (normalized.includes('втор')) {
		return 'вторичка'
	}

	return MARKET_CATEGORY_LABELS[value] ?? MARKET_CATEGORY_LABELS[normalized] ?? ''
}

export function mapApiPropertyToPreview(data: ApiPropertyPreview): PropertyPreview {
	return {
		id: data.id,
		platform: data.platform,
		url: data.url,
		title: data.title,
		address: data.address,
		price: data.price,
		totalArea: data.total_area,
		livingArea: data.living_area ?? 0,
		kitchenArea: data.kitchen_area ?? 0,
		floor: data.floor,
		totalFloors: data.total_floors,
		rooms: data.rooms,
		propertyType: mapPropertyType(data.property_type),
		marketCategory: mapMarketCategory(data.market_category ?? data.property_old),
		dealType: mapDealType(data.deal_type),
		description: data.description ?? '',
		seller: {
			name: data.seller.name,
			phone: data.seller.phone ?? undefined,
			type: data.seller.type ?? undefined,
			company_name: data.seller.company_name ?? undefined,
		},
		location: {
			lat: data.location.lat,
			lon: data.location.lon,
			address: data.location.address ?? undefined,
		},
	}
}
