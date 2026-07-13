import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { Alert, Box, Drawer, Loader, Stack, Text, Title, SimpleGrid } from '@mantine/core'
import { IconAlertCircle } from '@tabler/icons-react'
import { PropertyCard } from './PropertyCard'
import { PropertyMap } from '../../components/PropertyMap'
import { fetchFavoriteProperties, deleteFavoriteProperty } from '../../api/deal'
import { mapFavoriteItem, type FavoriteItem } from './helpers'
import type { PropertyPreview } from '../../types/property'

export default function FavoritesPage() {
	const navigate = useNavigate()
	const [items, setItems] = useState<FavoriteItem[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [mapOpened, setMapOpened] = useState(false)
	const [mapProperty, setMapProperty] = useState<PropertyPreview | null>(null)

	useEffect(() => {
		const load = async () => {
			setLoading(true)
			setError(null)
			try {
				const properties = await fetchFavoriteProperties()
				const mapped = properties
					.map(p => mapFavoriteItem(p.id, p.title, p.created_at, p.property_data))
					.filter((item): item is FavoriteItem => item !== null)
				setItems(mapped)
			} catch (err) {
				setError(err instanceof Error ? err.message : 'Не удалось загрузить избранное.')
			} finally {
				setLoading(false)
			}
		}
		void load()
	}, [])

	const handleToggleFavorite = async (propertyId: string) => {
		try {
			await deleteFavoriteProperty(propertyId)
			setItems(prev => prev.filter(item => item.id !== propertyId))
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Не удалось удалить из избранного.')
		}
	}

	const handleShowMap = (property: PropertyPreview) => {
		setMapProperty(property)
		setMapOpened(true)
	}

	return (
		<>
			<Stack gap='lg'>
				<Title order={1}>Избранное</Title>
				<Text c='dimmed'>Избранные объекты недвижимости. Нажмите на карточку, чтобы открыть полный отчёт.</Text>

				{loading && (
					<Stack align='center' py='xl'>
						<Loader color='violet' size='md' />
						<Text size='sm' c='dimmed'>
							Загрузка избранного...
						</Text>
					</Stack>
				)}

				{error && !loading && (
					<Alert icon={<IconAlertCircle size={16} />} color='red' variant='light' title='Ошибка'>
						{error}
					</Alert>
				)}

				{!loading && !error && items.length === 0 && (
					<Text c='dimmed' ta='center' py='xl'>
						Список избранного пуст. Добавьте объекты недвижимости в избранное.
					</Text>
				)}

				{!loading && items.length > 0 && (
					<SimpleGrid cols={{ base: 1 }} spacing='md'>
						{items.map(item => (
							<Box key={item.id} onClick={() => navigate(`/favorites/${item.id}`)} style={{ cursor: 'pointer' }}>
								<PropertyCard
									property={item.property}
									rating={item.rating}
									isFavorite
									onToggleFavorite={() => handleToggleFavorite(item.id)}
									onShowMap={handleShowMap}
								/>
							</Box>
						))}
					</SimpleGrid>
				)}
			</Stack>

			<Drawer
				opened={mapOpened}
				onClose={() => setMapOpened(false)}
				title={mapProperty?.title ?? 'Карта'}
				position='right'
				size='50%'
			>
				{mapProperty && (
					<PropertyMap
						lat={mapProperty.location.lat}
						lon={mapProperty.location.lon}
						address={mapProperty.location.address ?? mapProperty.address}
						height='calc(100vh - 120px)'
					/>
				)}
			</Drawer>
		</>
	)
}
