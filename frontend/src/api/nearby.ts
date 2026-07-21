import { apiRequest } from './client'

export type NearbyPlace = {
	name: string
	address: string
	category: string
	type: string
	distance_meters: number
	lat: number
	lon: number
	consequence?: string | null
}

export type NearbyResponse = {
	good: NearbyPlace[]
	bad: NearbyPlace[]
	total_good: number
	total_bad: number
	radius_used: number
	cached: boolean
}

const CACHE_PREFIX = 'nearby:'
/** 7 дней — переживает закрытие браузера (localStorage) */
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000

type CacheEntry = {
	data: NearbyResponse
	expiresAt: number
}

const memoryCache = new Map<string, CacheEntry>()
const inflightRequests = new Map<string, Promise<NearbyResponse>>()

function buildCacheKey(lat: number, lon: number, radius: number): string {
	return `${lat.toFixed(3)}:${lon.toFixed(3)}:${radius}`
}

function isValidEntry(entry: CacheEntry | undefined): entry is CacheEntry {
	return !!entry && Date.now() <= entry.expiresAt
}

function readPersistentCache(key: string): CacheEntry | null {
	try {
		const raw = localStorage.getItem(`${CACHE_PREFIX}${key}`)
		if (!raw) return null

		const entry = JSON.parse(raw) as CacheEntry
		if (!isValidEntry(entry)) {
			localStorage.removeItem(`${CACHE_PREFIX}${key}`)
			return null
		}

		return entry
	} catch {
		return null
	}
}

function writePersistentCache(key: string, data: NearbyResponse): void {
	try {
		const entry: CacheEntry = {
			data,
			expiresAt: Date.now() + CACHE_TTL_MS,
		}
		localStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(entry))
	} catch {
		// localStorage недоступен или переполнен — игнорируем
	}
}

function readCache(key: string): NearbyResponse | null {
	const fromMemory = memoryCache.get(key)
	if (isValidEntry(fromMemory)) {
		return { ...fromMemory.data, cached: true }
	}

	if (fromMemory) {
		memoryCache.delete(key)
	}

	const fromPersistent = readPersistentCache(key)
	if (fromPersistent) {
		memoryCache.set(key, fromPersistent)
		return { ...fromPersistent.data, cached: true }
	}

	return null
}

function writeCache(key: string, data: NearbyResponse): void {
	const entry: CacheEntry = {
		data,
		expiresAt: Date.now() + CACHE_TTL_MS,
	}
	memoryCache.set(key, entry)
	writePersistentCache(key, data)
}

type FetchNearbyOptions = {
	nocache?: boolean
}

export async function fetchNearbyPlaces(
	lat: number,
	lon: number,
	radius = 2000,
	options: FetchNearbyOptions = {},
): Promise<NearbyResponse> {
	const cacheKey = buildCacheKey(lat, lon, radius)

	if (!options.nocache) {
		const cached = readCache(cacheKey)
		if (cached) return cached

		const pending = inflightRequests.get(cacheKey)
		if (pending) return pending
	}

	const params = new URLSearchParams({
		lat: String(lat),
		lon: String(lon),
		radius: String(radius),
	})

	const request = apiRequest<NearbyResponse>(`/nearby/?${params.toString()}`, { skipAuth: true })
		.then(data => {
			writeCache(cacheKey, data)
			return data
		})
		.finally(() => {
			inflightRequests.delete(cacheKey)
		})

	if (!options.nocache) {
		inflightRequests.set(cacheKey, request)
	}

	return request
}
