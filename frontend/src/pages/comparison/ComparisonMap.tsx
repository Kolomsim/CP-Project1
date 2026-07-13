import { Paper, SimpleGrid, Title } from '@mantine/core'
import { PropertyMap } from '../../components/PropertyMap'
import type { PropertyPreview } from '../../types/property'

export interface ComparisonMapProps {
	properties: PropertyPreview[]
}

export function ComparisonMap({ properties }: ComparisonMapProps) {
	return (
		<Paper withBorder p='md' radius='md'>
			<Title order={3} mb='md'>
				Расположение на карте
			</Title>
			<SimpleGrid cols={{ base: 1, md: 2 }} spacing='md'>
				{properties.map(p => (
					<PropertyMap
						key={p.id}
						lat={p.location.lat}
						lon={p.location.lon}
						address={p.location.address ?? p.title}
						title={p.title}
						height={250}
					/>
				))}
			</SimpleGrid>
		</Paper>
	)
}
