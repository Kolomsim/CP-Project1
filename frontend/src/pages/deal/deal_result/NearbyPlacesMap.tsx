import { useEffect, useMemo, useState } from 'react'
import { Alert, Box, Group, Loader, Paper, Stack, Text, Title } from '@mantine/core'
import { IconAlertCircle } from '@tabler/icons-react'
import { fetchNearbyPlaces, type NearbyPlace } from '../../../api/nearby'
import { buildTwoGisMapWithPointsSrcDoc, isValidCoordinates } from '../../../lib/map'

type NearbyPlacesMapProps = {
	lat: number
	lon: number
	address?: string
	height?: number
}

function formatDistance(meters: number): string {
	if (meters < 1000) return `${Math.round(meters)} м`
	return `${(meters / 1000).toFixed(1)} км`
}

const TYPE_LABELS: Record<string, string> = {
	Школа: 'Школа',
	Гимназия: 'Гимназия',
	Лицей: 'Лицей',
	'Детский сад': 'Детский сад',
	Парк: 'Парк',
	Сквер: 'Сквер',
	Набережная: 'Набережная',
	'Детская площадка': 'Детская площадка',
	'Детские площадки': 'Детская площадка',
	Спорт: 'Спорт / фитнес',
	Фитнес: 'Спорт / фитнес',
	Бассейн: 'Бассейн',
	Поликлиника: 'Поликлиника',
	Больницы: 'Больница',
	Больница: 'Больница',
	Аптека: 'Аптека',
	Супермаркет: 'Супермаркет',
	Метро: 'Метро',
	Остановка: 'Остановка транспорта',
	Завод: 'Промышленный объект',
	Фабрика: 'Промышленный объект',
	Комбинат: 'Промышленный объект',
	Тэц: 'ТЭЦ / котельная',
	Котельная: 'ТЭЦ / котельная',
	Свалка: 'Свалка / мусор',
	Полигон: 'Свалка / полигон',
	Бар: 'Бар / ночной клуб',
	'Ночной клуб': 'Бар / ночной клуб',
	Кладбище: 'Кладбище',
	Аэропорт: 'Аэропорт',
	'Железнодорожная станция': 'Железная дорога',
	Депо: 'Железная дорога',
}

function escapeHtml(value: string): string {
	return value
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
}

function formatPlaceType(place: NearbyPlace): string {
	const direct = TYPE_LABELS[place.type]
	if (direct) return direct

	const lower = place.type.toLowerCase()
	for (const [key, label] of Object.entries(TYPE_LABELS)) {
		if (lower.includes(key.toLowerCase())) return label
	}

	if (place.category === 'bad') return 'Негативный фактор'
	return place.type || 'Инфраструктура'
}

function buildPlaceMarker(place: NearbyPlace) {
	const typeLabel = formatPlaceType(place)
	const name = place.name?.trim() || 'Без названия'
	const distance = formatDistance(place.distance_meters)

	return {
		lat: place.lat,
		lon: place.lon,
		tooltip: typeLabel,
		popup: `<div class="map-popup"><div class="map-popup-type">${escapeHtml(typeLabel)}</div><div class="map-popup-name">${escapeHtml(name)}</div><div class="map-popup-distance">${distance} от объекта</div></div>`,
	}
}

function LegendItem({ color, label }: { color: string; label: string }) {
	return (
		<Group gap={6}>
			<Box
				style={{
					width: 10,
					height: 10,
					borderRadius: '50%',
					background: color,
					flexShrink: 0,
				}}
			/>
			<Text size='xs' c='dimmed'>
				{label}
			</Text>
		</Group>
	)
}

export function NearbyPlacesMap({ lat, lon, address, height = 320 }: NearbyPlacesMapProps) {
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [goodCount, setGoodCount] = useState(0)
	const [badCount, setBadCount] = useState(0)
	const [goodPoints, setGoodPoints] = useState<{ lat: number; lon: number; tooltip: string; popup: string }[]>([])
	const [badPoints, setBadPoints] = useState<{ lat: number; lon: number; tooltip: string; popup: string }[]>([])

	useEffect(() => {
		if (!isValidCoordinates(lat, lon)) {
			setLoading(false)
			setError('Координаты объекта неизвестны')
			return
		}

		const load = async () => {
			setLoading(true)
			setError(null)
			try {
				const data = await fetchNearbyPlaces(lat, lon)
				setGoodCount(data.total_good)
				setBadCount(data.total_bad)
				setGoodPoints(data.good.map(buildPlaceMarker))
				setBadPoints(data.bad.map(buildPlaceMarker))
			} catch (err) {
				setError(err instanceof Error ? err.message : 'Не удалось загрузить окружение объекта.')
			} finally {
				setLoading(false)
			}
		}

		void load()
	}, [lat, lon])

	const srcDoc = useMemo(() => {
		if (loading || error) return null
		return buildTwoGisMapWithPointsSrcDoc({
			lat,
			lon,
			address,
			goodPoints,
			badPoints,
		})
	}, [lat, lon, address, goodPoints, badPoints, loading, error])

	return (
		<Paper withBorder radius='md' p='md'>
			<Stack gap='sm'>
				<div>
					<Title order={4}>Окружение на карте</Title>
					<Text size='sm' c='dimmed'>
						Зелёные точки — всё, что делает жизнь удобной и повышает ликвидность жилья. Красные точки — Возможен дискомфорт: шум, запахи или загрязнение. Рекомендуется обратить внимание.
						Наведитесь на точку — увидите тип объекта, нажмите — подробности.
					</Text>
				</div>

				{loading && (
					<Stack align='center' py='lg' gap='xs'>
						<Loader color='brand' size='sm' />
						<Text size='sm' c='dimmed'>
							Анализируем окружение... Это может занять до минуты.
						</Text>
					</Stack>
				)}

				{error && !loading && (
					<Alert icon={<IconAlertCircle size={16} />} color='red' variant='light' title='Карта недоступна'>
						{error}
					</Alert>
				)}

				{!loading && !error && srcDoc && (
					<>
						<Group gap='md'>
							<LegendItem color='#1c7ed6' label={`Объект (${address ?? 'выбранный'})`} />
							<LegendItem color='#2f9e66' label={`Хорошее окружение (${goodCount})`} />
							<LegendItem color='#e03131' label={`Негативные факторы (${badCount})`} />
						</Group>

						<Box
							style={{
								width: '100%',
								height,
								borderRadius: 'var(--mantine-radius-md)',
								overflow: 'hidden',
								border: '1px solid var(--sc-border)',
							}}
						>
							<iframe
								title='Карта окружения объекта'
								srcDoc={srcDoc}
								loading='lazy'
								referrerPolicy='no-referrer-when-downgrade'
								style={{ width: '100%', height: '100%', border: 0, display: 'block', background: '#e8eef3' }}
							/>
						</Box>
					</>
				)}
			</Stack>
		</Paper>
	)
}
