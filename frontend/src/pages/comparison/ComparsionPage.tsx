import { useEffect, useState } from 'react'
import { Alert, Loader, Stack, Text, Title, TextInput, SimpleGrid } from '@mantine/core'
import { IconAlertCircle, IconSearch } from '@tabler/icons-react'
import { PropertyMiniCard } from './PropertyMiniCard'
import { ComparisonCard } from './ComparisonCard'
import { ComparisonMap } from './ComparisonMap'
import { buildComparisons } from '../../utils/comparison'
import { fetchFavoriteProperties } from '../../api/deal'
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

type PropertyWithRating = PropertyPreview & { rating: DealRating }

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
		seller: { name: '' },
		location: {
			lat: src.location.lat,
			lon: src.location.lon,
			address: src.address,
		},
		is_verified: false,
	}
}

function extractPropertyWithRating(data: Record<string, unknown>): PropertyWithRating | null {
	const saved = data as unknown as SavedData | undefined
	if (!saved?.property) return null

	const property = mapToPropertyPreview(saved.property)

	let rating: DealRating
	if (saved.rating) {
		rating = saved.rating
	} else {
		const ratingLabel =
			saved.overallRating === 'Не рекомендуется' || saved.overallRating === 'Обратите внимание'
				? 'Высокий риск'
				: saved.overallRating === 'Требуется проверка'
					? 'Средний риск'
					: 'Низкий риск'
		const ratingLevel = ratingLabel === 'Высокий риск' ? 'high' : ratingLabel === 'Средний риск' ? 'medium' : 'low'
		rating = {
			score: saved.criticalCount > 0 ? 30 : saved.riskCount > 0 ? 60 : 90,
			level: ratingLevel,
			label: ratingLabel,
		}
	}

	return { ...property, rating }
}

export default function ComparisonPage() {
	const [allProperties, setAllProperties] = useState<PropertyWithRating[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
	const [searchQuery, setSearchQuery] = useState('')

	useEffect(() => {
		const load = async () => {
			setLoading(true)
			setError(null)
			try {
				const items = await fetchFavoriteProperties()
				const mapped = items
					.map(item => extractPropertyWithRating(item.property_data))
					.filter((p): p is PropertyWithRating => p !== null)
				setAllProperties(mapped)
			} catch (err) {
				setError(err instanceof Error ? err.message : 'Не удалось загрузить избранное.')
			} finally {
				setLoading(false)
			}
		}
		void load()
	}, [])

	const filteredProperties = allProperties.filter(
		p =>
			p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
			p.address.toLowerCase().includes(searchQuery.toLowerCase()),
	)

	const selectedProperties = allProperties.filter(p => selectedIds.has(p.id))

	const handleToggle = (id: string) => {
		setSelectedIds(prev => {
			const next = new Set(prev)
			if (next.has(id)) {
				next.delete(id)
			} else {
				if (next.size >= 2) {
					const first = next.values().next().value
					if (first) next.delete(first)
				}
				next.add(id)
			}
			return next
		})
	}

	const leftProperty = selectedProperties[0]
	const rightProperty = selectedProperties[1]
	const showComparison = leftProperty && rightProperty
	const comparisons = leftProperty && rightProperty ? buildComparisons(leftProperty, rightProperty) : []

	return (
		<Stack gap='lg'>
			<Title order={1}>Сравнение</Title>
			<Text c='dimmed'>Выберите два объекта недвижимости из избранного для сравнения их характеристик.</Text>

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

			{!loading && !error && allProperties.length === 0 && (
				<Text c='dimmed' ta='center' py='xl'>
					Список избранного пуст. Добавьте объекты недвижимости в избранное на странице результата проверки.
				</Text>
			)}

			{!loading && allProperties.length > 0 && (
				<>
					<TextInput
						placeholder='Поиск по избранным объектам...'
						leftSection={<IconSearch size={16} stroke={1.5} />}
						value={searchQuery}
						onChange={e => setSearchQuery(e.currentTarget.value)}
					/>

					<Stack gap='xs'>
						<Text fw={600} size='sm' c='dimmed'>
							Выбрано: {selectedIds.size}/2
						</Text>

						<Stack gap='xs'>
							{filteredProperties.map(property => (
								<PropertyMiniCard
									key={property.id}
									property={property}
									selected={selectedIds.has(property.id)}
									onToggle={handleToggle}
								/>
							))}
						</Stack>
					</Stack>

					{showComparison && (
						<>
							<SimpleGrid cols={{ base: 1, md: 2 }} spacing='lg' style={{ alignItems: 'stretch' }}>
								<ComparisonCard
									property={leftProperty}
									rating={leftProperty.rating}
									side='left'
									comparisons={comparisons}
								/>
								<ComparisonCard
									property={rightProperty}
									rating={rightProperty.rating}
									side='right'
									comparisons={comparisons}
								/>
							</SimpleGrid>

							<ComparisonMap properties={selectedProperties} />
						</>
					)}
				</>
			)}
		</Stack>
	)
}
