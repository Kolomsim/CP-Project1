import { useParams, Link } from 'react-router'
import { useEffect, useState } from 'react'
import { Anchor, Container, Group, Loader, Paper, Stack, Text } from '@mantine/core'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { fetchArticleById, type ArticleDetail } from '../../api/articles'
import { useAuth } from '../../context/AuthContext'
import ArticleViewHeader from './ArticleViewHeader'
import classes from './Markdown.module.css'

export default function ArticleViewPage() {
	const { articleId } = useParams<{ articleId: string }>()
	const { user } = useAuth()
	const [article, setArticle] = useState<ArticleDetail | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	const isAuthor = user?.role === 'author' || user?.role === 'admin'

	useEffect(() => {
		if (!articleId) return

		setLoading(true)
		setError(null)

		fetchArticleById(articleId)
			.then(data => {
				setArticle(data)
			})
			.catch(err => {
				setError(err instanceof Error ? err.message : 'Не удалось загрузить статью')
			})
			.finally(() => {
				setLoading(false)
			})
	}, [articleId])

	if (loading) {
		return (
			<Container size='md' py='xl'>
				<Group justify='center'>
					<Loader />
				</Group>
			</Container>
		)
	}

	if (error || !article) {
		return (
			<Container size='md' py='xl'>
				<Stack align='center' gap='sm'>
					<Text c='red'>{error ?? 'Статья не найдена'}</Text>
					<Anchor component={Link} to='/kb'>
						Вернуться в базу знаний
					</Anchor>
				</Stack>
			</Container>
		)
	}

	return (
		<Container size='md' py='lg'>
			<Stack gap='lg'>
				<ArticleViewHeader article={article} articleId={articleId!} isAuthor={isAuthor} />

				{/* Markdown content */}
				<Paper withBorder p='xl' radius='md' style={{ background: 'white' }}>
					<article className={classes['markdown-content']}>
						<ReactMarkdown remarkPlugins={[remarkGfm]}>{article.content}</ReactMarkdown>
					</article>
				</Paper>
			</Stack>
		</Container>
	)
}
