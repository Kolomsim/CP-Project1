import { useEffect, useState } from 'react'
import { SimpleGrid, Stack } from '@mantine/core'
import { IconShieldCheck, IconBooks } from '@tabler/icons-react'
import { NavCard } from './NavCard'
import { NewsFeed } from './NewsFeed'
import { fetchArticles, type ArticleItem } from '../../api/articles'
import type { NewsItem } from './NewsCard'

const navCards = [
	{
		title: 'Сопровождение сделки',
		to: '/deal',
		description:
			'В этом разделе собраны статьи, чек-листы, существенные условия договоров и ответы на частые вопросы по сделкам с недвижимостью.',
		icon: IconShieldCheck,
	},
	{
		title: 'База знаний',
		to: '/kb',
		description:
			'Содержит актуальную информацию по правовым вопросам недвижимости. Здесь вы найдете пошаговые инструкции, статьи, интересные разборы и комментарии экспертов по спорным ситуациям.',
		icon: IconBooks,
	},
]

function mapArticleToNewsItem(article: ArticleItem): NewsItem {
	return {
		id: article.id,
		title: article.title,
		preview: article.preview ?? '',
		author: article.author?.name ?? null,
		createdAt: article.created_at,
		slug: article.id,
	}
}

export default function HomePage() {
	const [articles, setArticles] = useState<ArticleItem[]>([])
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		fetchArticles(10, 0)
			.then(data => {
				// Сортируем по дате, сначала новые
				const sorted = [...data].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
				setArticles(sorted)
			})
			.catch(() => {
				// Если API недоступен, показываем пустой список
			})
			.finally(() => setLoading(false))
	}, [])

	const newsItems: NewsItem[] = articles.map(mapArticleToNewsItem)

	return (
		<Stack gap='xl'>
			<SimpleGrid cols={{ base: 1, sm: 2 }} spacing='xl'>
				{navCards.map(({ title, to, description, icon }) => (
					<NavCard key={title} title={title} to={to} description={description} icon={icon} />
				))}
			</SimpleGrid>

			<NewsFeed items={newsItems} pageSize={5} loading={loading} />
		</Stack>
	)
}
