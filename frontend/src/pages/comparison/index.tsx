import { useState } from 'react'
import { Stack, Text, Title, TextInput, SimpleGrid } from '@mantine/core'
import { IconSearch } from '@tabler/icons-react'
import { AppLayout } from '../../components/AppLayout'
import { PropertyMiniCard } from './PropertyMiniCard'
import { ComparisonCard } from './ComparisonCard'
import { ComparisonMap } from './ComparisonMap'
import { buildComparisons } from '../../utils/comparison'
import { mockProperties } from '../../mock/properties'

export default function ComparisonPage() {
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
	const [searchQuery, setSearchQuery] = useState('')

	const filteredProperties = mockProperties.filter(
		p =>
			p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
			p.address.toLowerCase().includes(searchQuery.toLowerCase()),
	)

	const selectedProperties = mockProperties.filter(p => selectedIds.has(p.id))

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
	const comparisons =
		leftProperty && rightProperty
			? buildComparisons(leftProperty, rightProperty)
			: []

	return (
		<AppLayout>
			<Stack gap='lg'>
				<Title order={1}>Сравнение</Title>
				<Text c='dimmed'>
					Выберите два объекта недвижимости из избранного для сравнения их
					характеристик.
				</Text>

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
						<SimpleGrid cols={{ base: 1, md: 2 }} spacing='lg'>
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
			</Stack>
		</AppLayout>
	)
}
