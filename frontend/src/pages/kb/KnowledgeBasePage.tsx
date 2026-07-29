import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router'
import { Button, Group, Loader, Pagination, SimpleGrid, Stack, Text, TextInput, Title } from '@mantine/core'
import { IconPlus, IconSearch } from '@tabler/icons-react'
import { fetchArticles, type ArticleItem } from '../../api/articles'
import { useAuth } from '../../context/AuthContext'
import ArticleCard from '../article/ArticleCard'

const PAGE_SIZE = 10

export default function KbPage() {
	const { user } = useAuth()
	const [query, setQuery] = useState('')
	const [articles, setArticles] = useState<ArticleItem[]>([])
	const [loading, setLoading] = useState(true)
	const [page, setPage] = useState(1)

	const loadArticles = useCallback(async (searchQuery?: string) => {
		setLoading(true)
		setPage(1)
		try {
			const batchSize = 50
			let offset = 0
			const all: ArticleItem[] = []
			while (true) {
				const batch = await fetchArticles(batchSize, offset, searchQuery || undefined)
				all.push(...batch)
				if (batch.length < batchSize) break
				offset += batchSize
			}
			setArticles(all)
		} catch {
			// Если API недоступен, показываем пустой список
			setArticles([])
		} finally {
			setLoading(false)
		}
	}, [])

	useEffect(() => {
		loadArticles()
	}, [loadArticles])

	const handleSearch = () => {
		loadArticles(query.trim() || undefined)
	}

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter') {
			handleSearch()
		}
	}

	const isAuthor = user?.role === 'author'
	const totalPages = Math.max(1, Math.ceil(articles.length / PAGE_SIZE))
	const pageArticles = articles.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

	return (
		<Stack gap='xl'>
			<Group align='flex-end' wrap='nowrap'>
				<TextInput
					flex={1}
					size='md'
					placeholder='Поиск по статьям...'
					value={query}
					onChange={event => setQuery(event.currentTarget.value)}
					onKeyDown={handleKeyDown}
					leftSection={<IconSearch size={18} stroke={1.5} />}
				/>
				<Button size='md' onClick={handleSearch}>
					Найти
				</Button>
				{isAuthor && (
					<Button component={Link} to='/kb/new' variant='filled' size='md' leftSection={<IconPlus size={18} />}>
						Создать статью
					</Button>
				)}
			</Group>

			{/* Статьи из БД */}
			<Stack gap='md'>
				<Title order={2}>Статьи</Title>
				{loading ? (
					<Group justify='center' py='lg'>
						<Loader />
					</Group>
				) : articles.length > 0 ? (
					<>
						<SimpleGrid cols={{ base: 1, sm: 2 }} style={{ alignItems: 'start' }}>
							{pageArticles.map(article => (
								<ArticleCard key={article.id} article={article} />
							))}
						</SimpleGrid>
						{totalPages > 1 && (
							<Group justify='center' mt='md'>
								<Pagination total={totalPages} value={page} onChange={setPage} />
							</Group>
						)}
					</>
				) : (
					<Text c='dimmed' size='sm'>
						{query ? 'Ничего не найдено. Попробуйте изменить запрос.' : 'Статьи пока не добавлены'}
					</Text>
				)}
			</Stack>
		</Stack>
	)
}
