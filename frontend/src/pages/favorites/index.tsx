import { Stack, Text, Title, SimpleGrid } from '@mantine/core'
import { AppLayout } from '../../components/AppLayout'
import { PropertyCard } from './PropertyCard'
import { mockProperties } from '../../mock/properties'

export default function FavoritesPage() {
	return (
		<AppLayout>
			<Stack gap='lg'>
				<Title order={1}>Избранное</Title>
				<Text c='dimmed'>
					Избранные объекты недвижимости. Здесь отображаются карточки, которые
					вы добавили в избранное.
				</Text>

				{mockProperties.length === 0 ? (
					<Text c='dimmed' ta='center' py='xl'>
						Список избранного пуст. Добавьте объекты недвижимости в избранное.
					</Text>
				) : (
					<SimpleGrid cols={{ base: 1 }} spacing='md'>
						{mockProperties.map(property => (
							<PropertyCard
								key={property.id}
								property={property}
								rating={property.rating}
								isFavorite
								onToggleFavorite={id => console.log('Toggle favorite:', id)}
								onToggleCompare={id => console.log('Toggle compare:', id)}
								onShowMap={p => console.log('Show map:', p.title)}
							/>
						))}
					</SimpleGrid>
				)}
			</Stack>
		</AppLayout>
	)
}
