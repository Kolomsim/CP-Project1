import { useMemo } from 'react'
import { Alert, Box, Group, Loader, Paper, Stack, Text, Title } from '@mantine/core'
import { IconAlertCircle } from '@tabler/icons-react'
import type { NearbyResponse } from '../../../api/nearby'
import { buildTwoGisMapWithPointsSrcDoc, isValidCoordinates } from '../../../lib/map'
import { buildPlaceMarker } from './nearbyPlaceUtils'
import { NearbyBadPointsList } from './NearbyBadPointsList'

type NearbyPlacesMapProps = {
	lat: number
	lon: number
	address?: string
	height?: number
	nearbyData?: NearbyResponse | null
	loading?: boolean
	error?: string | null
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

export function NearbyPlacesMap({
	lat,
	lon,
	address,
	height = 400,
	nearbyData = null,
	loading = false,
	error = null,
}: NearbyPlacesMapProps) {
	const hasValidCoords = isValidCoordinates(lat, lon)
	const resolvedError = !hasValidCoords ? 'Координаты объекта неизвестны' : error

	const goodCount = nearbyData?.total_good ?? 0
	const badCount = nearbyData?.total_bad ?? 0
	const goodPoints = useMemo(() => nearbyData?.good.map(buildPlaceMarker) ?? [], [nearbyData?.good])
	const badPoints = useMemo(() => nearbyData?.bad.map(buildPlaceMarker) ?? [], [nearbyData?.bad])

	const srcDoc = useMemo(() => {
		if (loading || resolvedError || !nearbyData) return null
		return buildTwoGisMapWithPointsSrcDoc({
			lat,
			lon,
			address,
			goodPoints,
			badPoints,
		})
	}, [lat, lon, address, goodPoints, badPoints, loading, resolvedError, nearbyData])

	return (
		<Paper withBorder radius='md' p='md'>
			<Stack gap='sm'>
				<div>
					<Title order={4}>Окружение на карте</Title>
					<Text size='sm' c='dimmed'>
						Зелёные точки — всё, что делает жизнь удобной и повышает ликвидность жилья. Красные точки — возможен
						дискомфорт: шум, запахи или загрязнение. Рекомендуется обратить внимание. Наведитесь на точку — увидите тип
						объекта, нажмите — подробности.
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

				{resolvedError && !loading && (
					<Alert icon={<IconAlertCircle size={16} />} color='red' variant='light' title='Карта недоступна'>
						{resolvedError}
					</Alert>
				)}

				{!loading && !resolvedError && srcDoc && (
					<>
						<Group gap='md'>
							<LegendItem color='#1c7ed6' label={`Объект (${address ?? 'выбранный'})`} />
							<LegendItem color='#2f9e66' label={`Хорошее окружение (${goodCount})`} />
							<LegendItem color='#e03131' label={`Негативные факторы (${badCount})`} />
						</Group>

						<Box
							style={{
								width: '100%',
								height: height,
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

						{nearbyData?.bad && nearbyData.bad.length > 0 && <NearbyBadPointsList places={nearbyData.bad} />}
					</>
				)}
			</Stack>
		</Paper>
	)
}
