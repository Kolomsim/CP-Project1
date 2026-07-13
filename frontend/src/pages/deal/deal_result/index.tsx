import { useEffect, useState } from 'react'
import { Alert, Button, Loader, Paper, Stack, Text, Title, Tooltip } from '@mantine/core'
import { IconAlertCircle, IconHeart, IconHeartFilled } from '@tabler/icons-react'
import { fetchDealCheckResult, savePropertyToFavorites } from '../../../api/deal'
import { getDealPropertyPreview } from '../../../lib/dealSession'
import { PropertyPreviewCard } from '../deal_object/PropertyPreviewCard'
import type { PropertyPreview } from '../deal_object/types'
import { RiskSummary } from './RiskSummary'
import type { DealCheckResult } from './types'
import { useAuth } from '../../../context/AuthContext'
import classes from './DealResult.module.css'

const AUTH_SAVE_HINT =
	'чтобы сохранить в избранное или сравнивать объекты недвижимости между собой - войдите в аккаунт'

export default function DealResultPage() {
	const { isAuthenticated } = useAuth()
	const [result, setResult] = useState<DealCheckResult | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [saving, setSaving] = useState(false)
	const [saved, setSaved] = useState(false)
	const [saveError, setSaveError] = useState<string | null>(null)
	const [authHintOpened, setAuthHintOpened] = useState(false)

	useEffect(() => {
		const loadResult = async () => {
			setLoading(true)
			setError(null)

			try {
				const property = getDealPropertyPreview<PropertyPreview>()
				const data = await fetchDealCheckResult(undefined, property)
				setResult(data)
			} catch (err) {
				setError(err instanceof Error ? err.message : 'Не удалось загрузить результат проверки.')
			} finally {
				setLoading(false)
			}
		}

		void loadResult()
	}, [])

	const handleSave = async () => {
		if (!isAuthenticated) {
			setAuthHintOpened(true)
			return
		}

		if (!result) return

		setSaving(true)
		setSaveError(null)
		try {
			const ratingLabel =
				result.overallRating === 'Не рекомендуется' || result.overallRating === 'Обратите внимание'
					? 'Высокий риск'
					: result.overallRating === 'Требуется проверка'
						? 'Средний риск'
						: 'Низкий риск'
			const ratingLevel = ratingLabel === 'Высокий риск' ? 'high' : ratingLabel === 'Средний риск' ? 'medium' : 'low'

			const dataToSave = {
				...result,
				rating: {
					score: result.criticalCount > 0 ? 30 : result.riskCount > 0 ? 60 : 90,
					level: ratingLevel,
					label: ratingLabel,
				},
			}

			await savePropertyToFavorites(result.property.title, dataToSave as unknown as Record<string, unknown>)
			setSaved(true)
		} catch (err) {
			setSaveError(err instanceof Error ? err.message : 'Не удалось сохранить в избранное.')
		} finally {
			setSaving(false)
		}
	}

	const saveButton = (
		<Button
			fullWidth
			size='md'
			variant={saved ? 'filled' : 'outline'}
			color={saved ? 'pink' : 'gray'}
			loading={saving}
			disabled={saved}
			onClick={() => void handleSave()}
			onMouseEnter={() => {
				if (!isAuthenticated) setAuthHintOpened(true)
			}}
			onMouseLeave={() => {
				if (!isAuthenticated) setAuthHintOpened(false)
			}}
			leftSection={saved ? <IconHeartFilled size={18} /> : <IconHeart size={18} />}
		>
			{saved ? 'Сохранено в избранном' : 'Сохранить в избранное'}
		</Button>
	)

	return (
		<Stack gap='xl' className={classes.page} maw={760} mx='auto'>
			<div>
				<Title order={2} mb='sm'>
					Результат проверки
				</Title>
				<Text c='dimmed' mb='xl'>
					Итоговый рейтинг сделки и найденные риски по выбранному объекту недвижимости.
				</Text>
				<Text c='dimmed'>
					Важно! Представленный отчёт о рисках сформирован автоматически и предназначен для предварительного
					ориентирования пользователя. Отчёт не является юридическим заключением, не учитывает всех особенностей Вашей
					ситуации и не может рассматриваться как основание для однозначного вывода о законности или недействительности
					сделки. Для принятия окончательного решения рекомендуем обратиться к специалисту.
				</Text>
			</div>

			{loading && (
				<Paper withBorder radius='md' p='xl'>
					<Stack align='center' gap='sm'>
						<Loader color='violet' size='md' />
						<Text size='sm' c='dimmed'>
							Проверяем риски сделки...
						</Text>
					</Stack>
				</Paper>
			)}

			{error && !loading && (
				<Alert icon={<IconAlertCircle size={16} />} color='red' variant='light' title='Ошибка'>
					{error}
				</Alert>
			)}

			{result && !loading && (
				<Stack gap='lg'>
					<RiskSummary result={result} />
					<PropertyPreviewCard property={result.property} />

					{saveError && (
						<Alert icon={<IconAlertCircle size={16} />} color='red' variant='light' title='Ошибка'>
							{saveError}
						</Alert>
					)}

					{isAuthenticated ? (
						saveButton
					) : (
						<Tooltip
							label={AUTH_SAVE_HINT}
							opened={authHintOpened}
							multiline
							w={300}
							withArrow
							position='top'
							events={{ hover: false, focus: false, touch: false }}
						>
							{saveButton}
						</Tooltip>
					)}
				</Stack>
			)}
		</Stack>
	)
}
