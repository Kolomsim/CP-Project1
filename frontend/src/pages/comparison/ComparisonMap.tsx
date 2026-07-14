import { Box, Paper, SimpleGrid, Text, Title } from '@mantine/core'
import { TwoGisMap } from '../../components/TwoGisMap'
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
					<Box key={p.id}>
						<Text size='sm' fw={600} mb='xs'>
							{p.title}
						</Text>
						<Box
							style={{
								width: '100%',
								height: 250,
								borderRadius: 'var(--mantine-radius-md)',
								overflow: 'hidden',
							}}
						>
							<TwoGisMap
								lat={p.location.lat}
								lon={p.location.lon}
								address={p.location.address}
								title={p.title}
								height={250}
							/>
						</Box>
						<Text size='xs' c='dimmed' mt={4}>
							{p.location.address ?? `${p.location.lat}, ${p.location.lon}`}
						</Text>
					</Box>
				))}
			</SimpleGrid>
		</Paper>
	)
}
