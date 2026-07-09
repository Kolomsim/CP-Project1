import { useEffect, useState } from 'react'
import { Alert, Loader, Stack, Text, Title, SimpleGrid } from '@mantine/core'
import { IconAlertCircle } from '@tabler/icons-react'
import { PropertyCard } from './PropertyCard'
import { fetchFavoriteProperties, deleteFavoriteProperty } from '../../api/deal'
import type { PropertyPreview, DealRating } from '../../types/property'
import type { PropertyPreview as DealPropertyPreview } from '../deal/deal_object/types'

type SavedData = {
	property: DealPropertyPreview
	overallRating: string
	rating?: DealRating
	problems: unknown[]
	riskCount: number
	criticalCount: number
	checkDate: string
}

type FavoriteItem = {
	id: string
	title: string
	property: PropertyPreview
	rating: DealRating
	createdAt: string
}

function mapToPropertyPreview(src: DealPropertyPreview): PropertyPreview {
	return {
		id: src.id,
		platform: src.platform,
		url: src.url,
		title: src.title,
		address: src.address,
		price: src.price,
		total_area: src.totalArea,
		living_area: src.livingArea,
		kitchen_area: src.kitchenArea,
		floor: src.floor,
		total_floors: src.totalFloors,
		rooms: src.rooms,
		property_type: src.propertyType,
		deal_type: src.dealType,
		description: src.description,
		seller: src.seller,
		location: {
			lat: src.location.lat,
			lon: src.location.lon,
			address: src.address,
		},
		is_verified: false,
	}
}

function extractPropertyAndRating(data: Record<string, unknown>): {
	property: PropertyPreview | null
	rating: DealRating
} {
	const saved = data as unknown as SavedData | undefined

	if (!saved?.property) {
		return { property: null, rating: { score: 0, level: 'low', label: 'Нет данных' } }
	}

	// Используем сохранённый rating, если он есть
	if (saved.rating) {
		return {
			property: mapToPropertyPreview(saved.property),
			rating: saved.rating,
		}
	}

	// Fallback: вычисляем из overallRating
	const ratingLabel =
		saved.overallRating === 'Не рекомендуется' || saved.overallRating === 'Обратите внимание'
			? 'Высокий риск'
			: saved.overallRating === 'Требуется проверка'
				? 'Средний риск'
				: 'Низкий риск'
	const ratingLevel = ratingLabel === 'Высокий риск' ? 'high' : ratingLabel === 'Средний риск' ? 'medium' : 'low'

	return {
		property: mapToPropertyPreview(saved.property),
		rating: {
			score: saved.criticalCount > 0 ? 30 : saved.riskCount > 0 ? 60 : 90,
			level: ratingLevel,
			label: ratingLabel,
		},
	}
}

export default function FavoritesPage() {
	const [items, setItems] = useState<FavoriteItem[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	const loadFavorites = async () => {
		setLoading(true)
		setError(null)
		try {
			const properties = await fetchFavoriteProperties()
			const mapped: FavoriteItem[] = properties
				.map(p => {
					const { property, rating } = extractPropertyAndRating(p.property_data)
					if (!property) return null
					return {
						id: p.id,
						title: p.title,
						property,
						rating,
						createdAt: p.created_at,
					}
				})
				.filter((item): item is FavoriteItem => item !== null)
			setItems(mapped)
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Не удалось загрузить избранное.')
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		void loadFavorites()
	}, [])

	const handleToggleFavorite = async (propertyId: string) => {
		try {
			await deleteFavoriteProperty(propertyId)
			setItems(prev => prev.filter(item => item.id !== propertyId))
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Не удалось удалить из избранного.')
		}
	}

	return (
		<Stack gap='lg'>
			<Title order={1}>Избранное</Title>
			<Text c='dimmed'>
				Избранные объекты недвижимости. Здесь отображаются карточки, которые вы добавили в избранное.
			</Text>

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
						<PropertyCard
							key={item.id}
							property={item.property}
							rating={item.rating}
							isFavorite
							onToggleFavorite={() => handleToggleFavorite(item.id)}
							onToggleCompare={id => console.log('Toggle compare:', id)}
							onShowMap={p => console.log('Show map:', p.title)}
						/>
					))}
				</SimpleGrid>
			)}
		</Stack>
	)
}
