import { apiRequest } from './client'

export type NearbyPlace = {
	name: string
	address: string
	category: string
	type: string
	distance_meters: number
	lat: number
	lon: number
}

export type NearbyResponse = {
	good: NearbyPlace[]
	bad: NearbyPlace[]
	total_good: number
	total_bad: number
	radius_used: number
	cached: boolean
}

export async function fetchNearbyPlaces(lat: number, lon: number, radius = 2000): Promise<NearbyResponse> {
	const params = new URLSearchParams({
		lat: String(lat),
		lon: String(lon),
		radius: String(radius),
	})

	return apiRequest<NearbyResponse>(`/nearby/?${params.toString()}`, { skipAuth: true })
}
