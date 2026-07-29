import { useEffect, useState } from 'react'
import { fetchNearbyPlaces, type NearbyResponse } from '../../../api/nearby'
import { isValidCoordinates } from '../../../lib/map'

type UseNearbyPlacesResult = {
	loading: boolean
	error: string | null
	data: NearbyResponse | null
}

export function useNearbyPlaces(lat: number, lon: number): UseNearbyPlacesResult {
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [data, setData] = useState<NearbyResponse | null>(null)

	useEffect(() => {
		if (!isValidCoordinates(lat, lon)) {
			setLoading(false)
			setError('Координаты объекта неизвестны')
			setData(null)
			return
		}

		const load = async () => {
			setLoading(true)
			setError(null)
			try {
				const response = await fetchNearbyPlaces(lat, lon)
				setData(response)
			} catch (err) {
				setError(err instanceof Error ? err.message : 'Не удалось загрузить окружение объекта.')
				setData(null)
			} finally {
				setLoading(false)
			}
		}

		void load()
	}, [lat, lon])

	return { loading, error, data }
}
