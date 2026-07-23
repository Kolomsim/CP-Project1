import { Link } from 'react-router'
import { Anchor, Badge, Button, Group, Stack, Text, Modal, ActionIcon, Alert } from '@mantine/core'
import { IconEdit, IconArrowLeft, IconTrash, IconX } from '@tabler/icons-react'
import type { ArticleDetail } from '../../api/articles'
import { useState } from 'react'
import { deleteArticle } from '../../api/articles'
import { useNavigate } from 'react-router'

type ArticleViewHeaderProps = {
	article: ArticleDetail
	articleId: string
	isAuthor: boolean
}

export default function ArticleViewHeader({ article, articleId, isAuthor }: ArticleViewHeaderProps) {
	const [opened, setOpened] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const navigate = useNavigate()

	return (
		<Stack gap='xs'>
			<Anchor component={Link} to='/kb' c='dimmed' size='sm'>
				<Group gap={4}>
					<IconArrowLeft size={16} />
					<Text component='span'>Назад к списку</Text>
				</Group>
			</Anchor>

			<Group justify='space-between' align='flex-start' wrap='nowrap'>
				<Stack gap='xs' style={{ flex: 1, minWidth: 0 }}>
					<Text fw={700} size='xl' component='h1'>
						{article.title}
					</Text>

					<Group gap='xs'>
						{article.category && (
							<Badge variant='light' color='brand' size='sm'>
								{article.category}
							</Badge>
						)}
						{article.author && (
							<Text size='sm' c='dimmed'>
								Автор: {article.author.name}
							</Text>
						)}
						<Text size='sm' c='dimmed'>
							{new Date(article.created_at).toLocaleDateString('ru-RU')}
						</Text>
						{article.updated_at !== article.created_at && (
							<Text size='sm' c='dimmed'>
								(ред. {new Date(article.updated_at).toLocaleDateString('ru-RU')})
							</Text>
						)}
					</Group>
				</Stack>

				<Group gap='xs'>
					{isAuthor && (
						<Button
							component={Link}
							to={`/kb/${articleId}/edit`}
							variant='outline'
							size='sm'
							leftSection={<IconEdit size={16} />}
							style={{ flexShrink: 0 }}
						>
							Редактировать
						</Button>
					)}
					{isAuthor && (
						<ActionIcon
							variant='outline'
							color='red'
							size='sm'
							onClick={() => setOpened(true)}
							aria-label='Удалить статью'
						>
							<IconTrash size={16} />
						</ActionIcon>
					)}
				</Group>
			</Group>

			<Modal opened={opened} onClose={() => setOpened(false)} title='Подтверждение удаления'>
				<Text>Вы уверены, что хотите удалить эту статью?</Text>
				{error && (
					<Alert mt='md' color='red' title='Ошибка' icon={<IconX size={16} />}>
						{error}
					</Alert>
				)}
				<Group mt='md'>
					<Button variant='outline' onClick={() => setOpened(false)}>
						Отмена
					</Button>
					<Button
						color='red'
						onClick={async () => {
							try {
								await deleteArticle(articleId)
								navigate('/kb')
							} catch (err) {
								setError('Не удалось удалить статью')
							}
						}}
					>
						Удалить
					</Button>
				</Group>
			</Modal>
		</Stack>
	)
}
