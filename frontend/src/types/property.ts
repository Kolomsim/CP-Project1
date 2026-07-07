export type RiskLevel = 'low' | 'medium' | 'high'

export interface PropertyLocation {
	lat: number
	lon: number
	address?: string
}

export interface PropertySeller {
	name: string
	phone?: string
	inn?: string
}

export interface PropertyPreview {
	id: string
	platform: string
	url: string
	title: string
	address: string
	price: number
	total_area: number
	living_area?: number
	kitchen_area?: number
	floor: number
	total_floors: number
	rooms: number
	property_type: string
	deal_type?: string
	seller: PropertySeller
	location: PropertyLocation
	description?: string
	is_verified: boolean
	images?: string[]
}

export interface DealRating {
	score: number
	level: RiskLevel
	label: string
}
