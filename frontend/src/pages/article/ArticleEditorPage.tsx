import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router'
import { Anchor, Container, Group, Loader, Stack, Text, Title } from '@mantine/core'
import { IconArrowLeft } from '@tabler/icons-react'
import { fetchArticleById, createArticle, updateArticle, type ArticleDetail } from '../../api/articles'
import { useAuth } from '../../context/AuthContext'
import ArticleForm from './ArticleForm.tsx'

export default function ArticleEditorPage() {
	const { articleId } = useParams<{ articleId?: string }>()
	const navigate = useNavigate()
	const { user } = useAuth()
	const isEditMode = !!articleId

	const [initialValues, setInitialValues] = useState<{
		title: string
		content: string
		preview: string
		category: string
	} | null>(null)
	const [loading, setLoading] = useState(isEditMode)
	const [saving, setSaving] = useState(false)
	const [error, setError] = useState<string | null>(null)

	// Загрузка существующей статьи для редактирования
	useEffect(() => {
		if (!articleId) return

		setLoading(true)
		fetchArticleById(articleId)
			.then((data: ArticleDetail) => {
				setInitialValues({
					title: data.title,
					content: data.content,
					preview: data.preview ?? '',
					category: data.category ?? '',
				})
			})
			.catch((err: Error) => {
				setError(err instanceof Error ? err.message : 'Не удалось загрузить статью')
			})
			.finally(() => setLoading(false))
	}, [articleId])

	const handleSave = async (values: { title: string; content: string; preview: string; category: string }) => {
		if (!values.title.trim()) {
			setError('Заголовок обязателен')
			return
		}
		if (!values.content.trim()) {
			setError('Содержимое статьи обязательно')
			return
		}

		setSaving(true)
		setError(null)

		try {
			const payload = {
				title: values.title.trim(),
				content: values.content.trim(),
				...(values.preview.trim() ? { preview: values.preview.trim() } : {}),
				...(values.category.trim() ? { category: values.category.trim() } : {}),
			}

			if (isEditMode) {
				await updateArticle(articleId!, payload)
			} else {
				const created = await createArticle(payload)
				navigate(`/kb/${created.id}`, { replace: true })
				return
			}

			navigate(`/kb/${articleId}`, { replace: true })
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Ошибка при сохранении')
		} finally {
			setSaving(false)
		}
	}

	if (loading) {
		return (
			<Container size='md' py='xl'>
				<Group justify='center'>
					<Loader />
				</Group>
			</Container>
		)
	}

	if (user?.role !== 'author') {
		return (
			<Container size='md' py='xl'>
				<Stack align='center' gap='sm'>
					<Text c='red'>У вас нет прав на создание и редактирование статей</Text>
					<Anchor component={Link} to='/kb'>
						Вернуться в базу знаний
					</Anchor>
				</Stack>
			</Container>
		)
	}

	return (
		<Container size='xl' py='lg'>
			<Stack gap='lg'>
				<Anchor component={Link} to='/kb' c='dimmed' size='sm'>
					<Group gap={4}>
						<IconArrowLeft size={16} />
						<Text component='span'>Назад к списку</Text>
					</Group>
				</Anchor>

				<Title order={1}>{isEditMode ? 'Редактировать статью' : 'Новая статья'}</Title>

				<ArticleForm
					initialValues={initialValues ?? undefined}
					isEditMode={isEditMode}
					saving={saving}
					error={error}
					onSave={handleSave}
				/>
			</Stack>
		</Container>
	)
}
