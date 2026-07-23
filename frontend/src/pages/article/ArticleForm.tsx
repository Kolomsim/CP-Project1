import { useState } from 'react'
import { Button, Group, Stack, Text, TextInput, Textarea } from '@mantine/core'
import { IconDeviceFloppy } from '@tabler/icons-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import classes from './Markdown.module.css'

type ArticleFormValues = {
	title: string
	content: string
	preview: string
	category: string
}

type ArticleFormProps = {
	initialValues?: Partial<ArticleFormValues>
	isEditMode: boolean
	saving: boolean
	error: string | null
	onSave: (values: ArticleFormValues) => void
}

export default function ArticleForm({ initialValues, isEditMode, saving, error, onSave }: ArticleFormProps) {
	const [title, setTitle] = useState(initialValues?.title ?? '')
	const [content, setContent] = useState(initialValues?.content ?? '')
	const [preview, setPreview] = useState(initialValues?.preview ?? '')
	const [category, setCategory] = useState(initialValues?.category ?? '')

	const handleSave = () => {
		onSave({ title, content, preview, category })
	}

	return (
		<Stack gap='lg'>
			{error && (
				<Text c='red' size='sm'>
					{error}
				</Text>
			)}

			<TextInput
				label='Заголовок'
				placeholder='Введите заголовок статьи'
				value={title}
				onChange={e => setTitle(e.currentTarget.value)}
				required
			/>

			<TextInput
				label='Категория'
				placeholder='Например: Недвижимость, Право, Налоги...'
				value={category}
				onChange={e => setCategory(e.currentTarget.value)}
			/>

			<Textarea
				label='Краткое описание (превью)'
				placeholder='Краткое описание статьи для списка'
				value={preview}
				onChange={e => setPreview(e.currentTarget.value)}
				minRows={2}
				maxRows={4}
			/>

			{/* Редактор с live-preview */}
			<Group align='stretch' grow wrap='nowrap' style={{ alignItems: 'stretch' }}>
				{/* Панель ввода Markdown */}
				<Stack gap='xs' style={{ flex: 1, minWidth: 0 }}>
					<Text size='sm' fw={500}>
						Markdown
					</Text>
					<Text size='sm' c='dimmed'>
						Инструкция по Markdown: https://github.com/adam-p/markdown-here/wiki/Markdown-Cheatsheet
					</Text>
					<Textarea
						placeholder='Введите текст в формате Markdown...'
						value={content}
						onChange={e => setContent(e.currentTarget.value)}
						minRows={20}
						maxRows={40}
						autosize
						styles={{
							input: {
								fontFamily: 'monospace',
								fontSize: '0.9rem',
								lineHeight: 1.6,
							},
						}}
					/>
				</Stack>

				{/* Панель предпросмотра */}
				<Stack gap='xs' style={{ flex: 1, minWidth: 0 }}>
					<Text size='sm' fw={500}>
						Предпросмотр
					</Text>
					<Stack
						p='md'
						style={{
							border: '1px solid var(--mantine-color-gray-3)',
							borderRadius: 'var(--mantine-radius-sm)',
							background: 'var(--mantine-color-body)',
							minHeight: 400,
							overflowY: 'auto',
						}}
					>
						{content.trim() ? (
							<div className={classes['markdown-content']}>
								<ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
							</div>
						) : (
							<Text c='dimmed' size='sm'>
								Начните вводить Markdown слева, чтобы увидеть предпросмотр
							</Text>
						)}
					</Stack>
				</Stack>
			</Group>

			<Group justify='flex-end'>
				<Button variant='filled' leftSection={<IconDeviceFloppy size={18} />} onClick={handleSave} loading={saving}>
					{isEditMode ? 'Сохранить изменения' : 'Опубликовать статью'}
				</Button>
			</Group>
		</Stack>
	)
}
