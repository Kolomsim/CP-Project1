import type { PropertyPreview, DealRating } from '../../types/property'
import type { PropertyPreview as DealPropertyPreview } from '../deal/deal_object/types'

export type SavedData = {
	property: DealPropertyPreview
	overallRating: string
	rating?: DealRating
	riskCount: number
	criticalCount: number
	checkDate: string
}

export type FavoriteItem = {
	id: string
	title: string
	property: PropertyPreview
	rating: DealRating
	createdAt: string
}

function mapToPropertyPreview(src: DealPropertyPreview): PropertyPreview {
	return {
		id: src.id,
		platform: src.platform,
		url: src.url,
		title: src.title,
		address: src.address,
		price: src.price,
		total_area: src.totalArea,
		living_area: src.livingArea,
		kitchen_area: src.kitchenArea,
		floor: src.floor,
		total_floors: src.totalFloors,
		rooms: src.rooms,
		property_type: src.propertyType,
		deal_type: src.dealType,
		description: src.description,
		seller: src.seller,
		location: {
			lat: src.location.lat,
			lon: src.location.lon,
			address: src.address,
		},
		is_verified: false,
	}
}

export function extractPropertyAndRating(data: Record<string, unknown>): {
	property: PropertyPreview | null
	rating: DealRating
} {
	const saved = data as unknown as SavedData | undefined

	if (!saved?.property) {
		return { property: null, rating: { score: 0, level: 'low', label: 'Нет данных' } }
	}

	if (saved.rating) {
		return {
			property: mapToPropertyPreview(saved.property),
			rating: saved.rating,
		}
	}

	const ratingLabel =
		saved.overallRating === 'Не рекомендуется' || saved.overallRating === 'Обратите внимание'
			? 'Высокий риск'
			: saved.overallRating === 'Требуется проверка'
				? 'Средний риск'
				: 'Низкий риск'
	const ratingLevel = ratingLabel === 'Высокий риск' ? 'high' : ratingLabel === 'Средний риск' ? 'medium' : 'low'

	return {
		property: mapToPropertyPreview(saved.property),
		rating: {
			score: saved.criticalCount > 0 ? 30 : saved.riskCount > 0 ? 60 : 90,
			level: ratingLevel,
			label: ratingLabel,
		},
	}
}

export function mapFavoriteItem(
	id: string,
	title: string,
	createdAt: string,
	data: Record<string, unknown>,
): FavoriteItem | null {
	const { property, rating } = extractPropertyAndRating(data)
	if (!property) return null
	return { id, title, property, rating, createdAt }
}
