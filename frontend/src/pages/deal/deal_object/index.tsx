import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { Alert, Button, Loader, Paper, Stack, Text, TextInput, Title } from '@mantine/core'
import { useDebouncedValue } from '@mantine/hooks'
import { IconAlertCircle, IconLink } from '@tabler/icons-react'
import { fetchPropertyPreview } from '../../../api/deal'
import {
	getDealPropertyPreview,
	getDealPropertyUrl,
	getDealSessionId,
	saveDealPropertyPreview,
} from '../../../lib/dealSession'
import { PropertyPreviewCard } from './PropertyPreviewCard'
import { isSupportedPropertyUrl } from './mockPropertyParser'
import type { PropertyPreview } from './types'
import classes from './DealObject.module.css'

const containedInputStyles = {
	root: {
		position: 'relative' as const,
	},
	input: {
		height: 54,
		paddingTop: 18,
	},
	label: {
		position: 'absolute' as const,
		pointerEvents: 'none' as const,
		fontSize: 11,
		paddingLeft: 12,
		paddingTop: 6,
		zIndex: 1,
	},
}

function normalizeUrl(url: string): string {
	const trimmed = url.trim()
	return trimmed.match(/^https?:\/\//i) ? trimmed : `https://${trimmed}`
}

export default function DealObjectPage() {
	const savedUrl = getDealPropertyUrl() ?? ''
	const savedProperty = getDealPropertyPreview<PropertyPreview>()
	const [url, setUrl] = useState(savedUrl)
	const [debouncedUrl] = useDebouncedValue(url, 600)
	const [property, setProperty] = useState<PropertyPreview | null>(savedProperty)
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const lastFetchedUrlRef = useRef(savedUrl ? normalizeUrl(savedUrl) : '')

	const loadPreview = async (value: string, force = false) => {
		const trimmed = value.trim()

		if (!trimmed) {
			setProperty(null)
			setError(null)
			lastFetchedUrlRef.current = ''
			return
		}

		const normalizedUrl = normalizeUrl(trimmed)

		if (!force && normalizedUrl === lastFetchedUrlRef.current && property) {
			return
		}

		if (!getDealSessionId()) {
			setProperty(null)
			setError('Сначала заполните анкету покупателя на предыдущем шаге.')
			return
		}

		if (!isSupportedPropertyUrl(trimmed)) {
			setProperty(null)
			setError('Укажите ссылку с поддерживаемого сервиса: ЦИАН, Авито, Домклик или SmartCheck.')
			return
		}

		setLoading(true)
		setError(null)

		try {
			const preview = await fetchPropertyPreview(trimmed)
			saveDealPropertyPreview(preview, normalizedUrl)
			lastFetchedUrlRef.current = normalizedUrl
			setProperty(preview)
		} catch (err) {
			setProperty(null)
			setError(err instanceof Error ? err.message : 'Не удалось загрузить предпросмотр.')
		} finally {
			setLoading(false)
		}
	}

	const handleUrlChange = (value: string) => {
		setUrl(value)
		if (!value.trim()) {
			setProperty(null)
			setError(null)
			lastFetchedUrlRef.current = ''
		}
	}

	useEffect(() => {
		if (!debouncedUrl.trim()) {
			return
		}

		void loadPreview(debouncedUrl)
	}, [debouncedUrl])

	return (
		<Stack gap='xl' className={classes.page} maw={760} mx='auto'>
			<div>
				<Title order={2} mb='sm'>
					Шаг 2. Укажите интересующий объект
				</Title>
				<Text c='dimmed'>
					Укажите ссылку на интересующий объект недвижимости (поддерживаются следующие сервисы: ЦИАН)
				</Text>
			</div>

			<Paper withBorder radius='md' p='lg' className={classes.urlPaper}>
				<TextInput
					label='Ссылка на объект'
					placeholder='https://www.cian.ru/sale/flat/123456789/'
					value={url}
					onChange={event => handleUrlChange(event.currentTarget.value)}
					leftSection={<IconLink size={16} stroke={1.5} />}
					styles={containedInputStyles}
				/>
			</Paper>

			{loading && (
				<Paper withBorder radius='md' p='xl'>
					<Stack align='center' gap='sm'>
						<Loader color='violet' size='md' />
						<Text size='sm' c='dimmed'>
							Загружаем данные объекта с ЦИАН... Это может занять до минуты.
						</Text>
					</Stack>
				</Paper>
			)}

			{error && !loading && (
				<Alert icon={<IconAlertCircle size={16} />} color='red' variant='light' title='Ошибка'>
					{error}
				</Alert>
			)}

			{property && !loading && (
				<Stack gap='sm'>
					<div>
						<Title order={4}>Предпросмотр</Title>
						<Text size='sm' c='dimmed'>
							Убедитесь, что данные интересующей недвижимости совпадают с предпросмотром.
						</Text>
					</div>

					<PropertyPreviewCard property={property} />

					<Button component={Link} to='/deal/deal_result' size='md' mt='md'>
						Продолжить
					</Button>
				</Stack>
			)}
		</Stack>
	)
}
