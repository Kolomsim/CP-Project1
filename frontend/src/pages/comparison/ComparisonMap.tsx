import { Box, Paper, SimpleGrid, Text, Title } from '@mantine/core'
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
							<iframe
								title={`Карта - ${p.title}`}
								width='100%'
								height='100%'
								loading='lazy'
								referrerPolicy='no-referrer-when-downgrade'
								src={`https://www.openstreetmap.org/export/embed.html?bbox=${p.location.lon - 0.01},${p.location.lat - 0.01},${p.location.lon + 0.01},${p.location.lat + 0.01}&layer=mapnik&marker=${p.location.lat},${p.location.lon}`}
								style={{ border: 'none' }}
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
