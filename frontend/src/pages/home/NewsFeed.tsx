import { useState } from 'react'
import { Button, Card, Group, Loader, Stack, Text, Title } from '@mantine/core'
import { NewsCard, type NewsItem } from './NewsCard'

export interface NewsFeedProps {
	items: NewsItem[]
	title?: string
	pageSize?: number
	loading?: boolean
}

export function NewsFeed({ items, title = 'Недавние статьи', pageSize = 5, loading = false }: NewsFeedProps) {
	const [page, setPage] = useState(1)
	const totalPages = Math.ceil(items.length / pageSize)
	const paginatedItems = items.slice(0, page * pageSize)

	return (
		<Stack gap='md'>
			<Title order={2}>{title}</Title>

			<Card withBorder padding='lg'>
				<Stack gap='lg'>
					{loading ? (
						<Group justify='center' py='lg'>
							<Loader />
						</Group>
					) : paginatedItems.length > 0 ? (
						paginatedItems.map(item => <NewsCard key={item.id} item={item} />)
					) : (
						<Text c='dimmed' ta='center' py='xl'>
							Новостей пока нет
						</Text>
					)}
				</Stack>
			</Card>

			{totalPages > 1 && page < totalPages && (
				<Group justify='center'>
					<Button variant='subtle' onClick={() => setPage(p => p + 1)}>
						Показать ещё
					</Button>
				</Group>
			)}
		</Stack>
	)
}
