import { useState } from 'react'
import { Button, Card, Group, Stack, Text, Title } from '@mantine/core'
import { NewsCard, type NewsItem } from './NewsCard'

export interface NewsFeedProps {
	items: NewsItem[]
	title?: string
	pageSize?: number
}

export function NewsFeed({ items, title = 'Недавние статьи', pageSize = 5 }: NewsFeedProps) {
	const [page, setPage] = useState(1)
	const totalPages = Math.ceil(items.length / pageSize)
	const paginatedItems = items.slice(0, page * pageSize)

	return (
		<Stack gap='md'>
			<Title order={2}>{title}</Title>

			<Card withBorder padding='lg'>
				<Stack gap='lg'>
					{paginatedItems.length > 0 ? (
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
