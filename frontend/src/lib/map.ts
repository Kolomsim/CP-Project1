export function isValidCoordinates(lat: number, lon: number): boolean {
	return (
		Number.isFinite(lat) &&
		Number.isFinite(lon) &&
		(lat !== 0 || lon !== 0) &&
		Math.abs(lat) <= 90 &&
		Math.abs(lon) <= 180
	)
}

export function buildYandexMapEmbedUrl(options: {
	lat?: number
	lon?: number
	address: string
}): string {
	const { lat, lon, address } = options

	if (lat !== undefined && lon !== undefined && isValidCoordinates(lat, lon)) {
		return `https://yandex.ru/map-widget/v1/?ll=${lon},${lat}&z=16&pt=${lon},${lat},pm2rdm`
	}

	return `https://yandex.ru/map-widget/v1/?text=${encodeURIComponent(address)}&z=16`
}

export function buildOsmMapEmbedUrl(options: {
	lat: number
	lon: number
	address?: string
}): string {
	const { lat, lon, address } = options

	if (!isValidCoordinates(lat, lon)) {
		const query = address?.trim() || `${lat}, ${lon}`
		return buildYandexMapEmbedUrl({ address: query })
	}

	const delta = 0.01
	const bbox = [lon - delta, lat - delta, lon + delta, lat + delta].join(',')
	return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lon}`
}
