import { Badge, Group, Paper, Stack, Text } from '@mantine/core'
import type { NearbyPlace } from '../../../api/nearby'
import classes from './DealResult.module.css'
import { formatDistance, formatPlaceType, getPlaceConsequence } from './nearbyPlaceUtils'

type NearbyBadPointsListProps = {
	places: NearbyPlace[]
}

function BadPointItem({ place }: { place: NearbyPlace }) {
	const typeLabel = formatPlaceType(place)
	const name = place.name?.trim() || 'Без названия'
	const distance = formatDistance(place.distance_meters)

	return (
		<Paper withBorder radius='md' p='md' className={classes.riskItem}>
			<Stack gap='xs'>
				<Group justify='space-between' align='flex-start' wrap='wrap' gap='xs'>
					<Stack gap={2} maw='75%'>
						<Text size='xs' c='dimmed'>
							Окружение · {distance} от объекта
						</Text>
						<Text fw={600} size='sm'>
							{typeLabel}: {name}
						</Text>
					</Stack>
				</Group>
				<Text size='sm' className={classes.consultationText}>
					{getPlaceConsequence(place)}
				</Text>
			</Stack>
		</Paper>
	)
}

export function NearbyBadPointsList({ places }: NearbyBadPointsListProps) {
	if (places.length === 0) return null

	return (
		<Stack gap='sm'>
			<Text size='sm' fw={500}>
				Негативные факторы окружения:
			</Text>
			{places.map((place, index) => (
				<BadPointItem key={`${place.lat}-${place.lon}-${place.name}-${index}`} place={place} />
			))}
		</Stack>
	)
}
