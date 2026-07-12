import { Box, Paper, SimpleGrid, Text, Title } from '@mantine/core'
import { buildOsmMapEmbedUrl } from '../../lib/map'
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
				{properties.map(p => {
					const coords = `${p.location.lon},${p.location.lat}`
					const mapSrc = `https://yandex.ru/map-widget/v1/?ll=${encodeURIComponent(coords)}&z=16&pt=${encodeURIComponent(`${coords},pm2rdm`)}&text=${encodeURIComponent(p.location.address ?? p.title)}`

					return (
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
									src={mapSrc}
									loading='lazy'
									referrerPolicy='no-referrer-when-downgrade'
									style={{ border: 'none' }}
								/>
							</Box>
							<Text size='xs' c='dimmed' mt={4}>
								{p.location.address ?? `${p.location.lat}, ${p.location.lon}`}
							</Text>
						</Box>
					)
				})}
			</SimpleGrid>
		</Paper>
	)
}
