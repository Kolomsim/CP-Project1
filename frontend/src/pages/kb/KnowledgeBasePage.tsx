import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router'
import { Button, Group, Loader, SimpleGrid, Stack, Text, TextInput, Title } from '@mantine/core'
import { IconPlus, IconSearch } from '@tabler/icons-react'
import { fetchArticles, type ArticleItem } from '../../api/articles'
import { useAuth } from '../../context/AuthContext'
import ArticleCard from '../article/ArticleCard'

export default function KbPage() {
	const { user } = useAuth()
	const [query, setQuery] = useState('')
	const [articles, setArticles] = useState<ArticleItem[]>([])
	const [loading, setLoading] = useState(true)

	const loadArticles = useCallback((searchQuery?: string) => {
		setLoading(true)
		fetchArticles(10, 0, searchQuery || undefined)
			.then(data => setArticles(data))
			.catch(() => {
				// Если API недоступен, показываем пустой список
			})
			.finally(() => setLoading(false))
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
					<SimpleGrid cols={{ base: 1, sm: 2 }}>
						{articles.map(article => (
							<ArticleCard key={article.id} article={article} />
						))}
					</SimpleGrid>
				) : (
					<Text c='dimmed' size='sm'>
						{query ? 'Ничего не найдено. Попробуйте изменить запрос.' : 'Статьи пока не добавлены'}
					</Text>
				)}
			</Stack>
		</Stack>
	)
}
