import { useMemo } from 'react'
import { Alert, Box, Group, Loader, Paper, SimpleGrid, Stack, Text, Title } from '@mantine/core'
import { IconAlertCircle } from '@tabler/icons-react'
import type { PropertyPreview } from '../../types/property'
import type { NearbyResponse } from '../../api/nearby'
import { fetchNearbyPlaces } from '../../api/nearby'
import { buildTwoGisMapWithPointsSrcDoc, isValidCoordinates } from '../../lib/map'
import { buildPlaceMarker } from '../deal/deal_result/nearbyPlaceUtils'
import { NearbyBadPointsList } from '../deal/deal_result/NearbyBadPointsList'
import { useAsyncData } from '../../lib/useAsyncData'

export interface ComparisonMapProps {
	properties: PropertyPreview[]
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

function useNearbyForProperty(lat: number, lon: number) {
	return useAsyncData(
		[lat, lon],
		async () => {
			if (!isValidCoordinates(lat, lon)) return null
			return fetchNearbyPlaces(lat, lon)
		},
		null,
	)
}

function PropertyMapCard({
	property,
	nearbyData,
	loading,
	error,
}: {
	property: PropertyPreview
	nearbyData: NearbyResponse | null
	loading: boolean
	error: string | null
}) {
	const { lat, lon } = property.location
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
			address: property.address,
			goodPoints,
			badPoints,
		})
	}, [lat, lon, property.address, goodPoints, badPoints, loading, resolvedError, nearbyData])

	return (
		<Paper withBorder radius='md' p='md'>
			<Stack gap='sm'>
				<Text fw={600} size='sm'>
					{property.title}
				</Text>
				<Text size='xs' c='dimmed'>
					{property.location.address ?? `${lat}, ${lon}`}
				</Text>

				{loading && (
					<Stack align='center' py='lg' gap='xs'>
						<Loader color='brand' size='sm' />
						<Text size='sm' c='dimmed'>
							Анализируем окружение...
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
							<LegendItem color='#1c7ed6' label='Объект' />
							<LegendItem color='#2f9e66' label={`Хорошее окружение (${goodCount})`} />
							<LegendItem color='#e03131' label={`Негативные факторы (${badCount})`} />
						</Group>

						<Box
							style={{
								width: '100%',
								height: 250,
								borderRadius: 'var(--mantine-radius-md)',
								overflow: 'hidden',
								border: '1px solid var(--sc-border)',
							}}
						>
							<iframe
								title={`Карта окружения: ${property.title}`}
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

export function ComparisonMap({ properties }: ComparisonMapProps) {
	const prop1 = properties[0]
	const prop2 = properties[1]

	const nearby1 = useNearbyForProperty(prop1?.location.lat ?? 0, prop1?.location.lon ?? 0)
	const nearby2 = useNearbyForProperty(prop2?.location.lat ?? 0, prop2?.location.lon ?? 0)

	return (
		<Paper withBorder radius='md' p='lg'>
			<Stack gap='md'>
				<div>
					<Title order={4}>Окружение на карте</Title>
					<Text size='sm' c='dimmed'>
						Зелёные точки — всё, что делает жизнь удобной и повышает ликвидность жилья. Красные точки — возможен
						дискомфорт: шум, запахи или загрязнение. Рекомендуется обратить внимание.
					</Text>
				</div>

				<SimpleGrid cols={{ base: 1, md: 2 }} spacing='lg' style={{ alignItems: 'stretch' }}>
					{prop1 && (
						<PropertyMapCard
							property={prop1}
							nearbyData={nearby1.data}
							loading={nearby1.loading}
							error={nearby1.error}
						/>
					)}
					{prop2 && (
						<PropertyMapCard
							property={prop2}
							nearbyData={nearby2.data}
							loading={nearby2.loading}
							error={nearby2.error}
						/>
					)}
				</SimpleGrid>
			</Stack>
		</Paper>
	)
}
