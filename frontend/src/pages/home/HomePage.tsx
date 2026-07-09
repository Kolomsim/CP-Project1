import { SimpleGrid, Stack } from '@mantine/core'
import { NavCard } from './NavCard'
import { NewsFeed } from './NewsFeed'
import type { NewsItem } from './NewsCard'

const navCards = [
	{
		title: 'Сопровождение сделки',
		to: '/deal',
		description: 'Описание сопровождения сделки',
	},
	{
		title: 'База знаний',
		to: '/kb',
		description: 'Описание базы знаний',
	},
]

const legalChanges: NewsItem[] = [
	{ id: 1, title: 'Закон 1', description: 'Описание ...' },
	{ id: 2, title: 'Закон 2', description: 'Описание ...' },
	{ id: 3, title: 'Закон 3', description: 'Описание ...' },
	{ id: 4, title: 'Закон 4', description: 'Описание ...' },
	{ id: 5, title: 'Закон 5', description: 'Описание ...' },
	{ id: 6, title: 'Закон 1', description: 'Описание ...' },
	{ id: 7, title: 'Закон 2', description: 'Описание ...' },
	{ id: 8, title: 'Закон 3', description: 'Описание ...' },
	{ id: 9, title: 'Закон 4', description: 'Описание ...' },
	{ id: 10, title: 'Закон 5', description: 'Описание ...' },
]

export default function HomePage() {
	return (
		<Stack gap='xl'>
			<SimpleGrid cols={{ base: 1, sm: 2 }} spacing='xl' maw={920} mx='auto' w='100%'>
				{navCards.map(({ title, to, description }) => (
					<NavCard key={title} title={title} to={to} description={description} />
				))}
			</SimpleGrid>

			<NewsFeed items={legalChanges} pageSize={5} />
		</Stack>
	)
}
