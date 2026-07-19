import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { Badge, Button, SimpleGrid, Stack, Text, Title } from '@mantine/core'
import { IconBooks, IconShieldCheck } from '@tabler/icons-react'
import { NewsFeed } from './NewsFeed'
import { fetchArticles, type ArticleItem } from '../../api/articles'
import type { NewsItem } from './NewsCard'
import classes from './HomePage.module.css'

const heroActions = [
	{
		title: 'Сопровождение сделки',
		to: '/deal',
		description:
			'В этом разделе собраны статьи, чек-листы, существенные условия договоров и ответы на частые вопросы по сделкам с недвижимостью.',
		icon: IconShieldCheck,
		variant: 'primary' as const,
	},
	{
		title: 'База знаний',
		to: '/kb',
		description:
			'Содержит актуальную информацию по правовым вопросам недвижимости. Здесь вы найдете пошаговые инструкции, статьи, интересные разборы и комментарии экспертов по спорным ситуациям.',
		icon: IconBooks,
		variant: 'secondary' as const,
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
			<section className={classes.hero} aria-label='СмартЧек'>
				<Stack align='center' gap='lg' className={classes.content}>
					<Badge className={classes.badge} variant='white' size='lg' radius='xl'>
						Проверка перед покупкой квартиры
					</Badge>

					<Stack align='center' gap='sm' className={classes.copy}>
						<Title order={1} className={classes.brand}>
							СмартЧек
						</Title>
						<Text className={classes.lead}>
							Поможем выявить особенности недвижимости и укажем, на что стоит обратить внимание при покупке,
							аргументируя статьями наших юристов.
						</Text>
					</Stack>

					<SimpleGrid cols={{ base: 1, sm: 2 }} spacing='xl' className={classes.actions}>
						{heroActions.map(({ title, to, description, icon: Icon, variant }) => (
							<Stack key={to} gap='sm' align='center' className={classes.actionItem}>
								<Button
									component={Link}
									to={to}
									size='lg'
									radius='md'
									fullWidth
									className={variant === 'primary' ? classes.primaryCta : classes.secondaryCta}
									leftSection={<Icon size={20} stroke={1.8} />}
								>
									{title}
								</Button>
								<Text className={classes.actionDescription}>{description}</Text>
							</Stack>
						))}
					</SimpleGrid>
				</Stack>
			</section>

			<NewsFeed items={newsItems} pageSize={5} loading={loading} />
		</Stack>
	)
}
