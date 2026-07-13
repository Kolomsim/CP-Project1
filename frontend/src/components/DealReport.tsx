import { useState } from 'react'
import { Alert, Button, Stack, Text, Title, Tooltip } from '@mantine/core'
import { IconAlertCircle, IconHeart, IconHeartFilled } from '@tabler/icons-react'
import { RiskSummary } from '../pages/deal/deal_result/RiskSummary'
import { PropertyPreviewCard } from '../pages/deal/deal_object/PropertyPreviewCard'
import { savePropertyToFavorites } from '../api/deal'
import { useAuth } from '../context/AuthContext'
import { getRiskLevelLabel } from '../utils/format'
import type { DealCheckResult } from '../pages/deal/deal_result/types'

type DealReportProps = {
	result: DealCheckResult
	title?: string
	showSaveButton?: boolean
}

const AUTH_SAVE_HINT = 'чтобы сохранить в избранное или сравнивать объекты недвижимости между собой — войдите в аккаунт'

export default function DealReport({ result, title = 'Результат проверки', showSaveButton = true }: DealReportProps) {
	const { isAuthenticated } = useAuth()
	const [saving, setSaving] = useState(false)
	const [saved, setSaved] = useState(false)
	const [saveError, setSaveError] = useState<string | null>(null)

	const handleSave = async () => {
		setSaving(true)
		setSaveError(null)
		try {
			const ratingLevel =
				result.overallRating === 'Не рекомендуется' || result.overallRating === 'Обратите внимание'
					? 'high'
					: result.overallRating === 'Требуется проверка'
						? 'medium'
						: 'low'

			const dataToSave = {
				...result,
				rating: {
					score: result.criticalCount > 0 ? 30 : result.riskCount > 0 ? 60 : 90,
					level: ratingLevel,
					label: getRiskLevelLabel(ratingLevel),
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

	return (
		<Stack gap='lg'>
			<div>
				<Title order={2} mb='sm'>
					{title}
				</Title>
				<Text c='dimmed' mb='xl'>
					Итоговый рейтинг сделки и найденные риски по выбранному объекту недвижимости.
				</Text>
				<Text c='dimmed' size='sm'>
					Важно! Представленный отчёт о рисках сформирован автоматически и предназначен для предварительного
					ориентирования пользователя. Отчёт не является юридическим заключением, не учитывает всех особенностей Вашей
					ситуации и не может рассматриваться как основание для однозначного вывода о законности или недействительности
					сделки. Для принятия окончательного решения рекомендуем обратиться к специалисту.
				</Text>
			</div>

			<RiskSummary result={result} />
			<PropertyPreviewCard property={result.property} />

			{showSaveButton && (
				<>
					{saveError && (
						<Alert icon={<IconAlertCircle size={16} />} color='red' variant='light' title='Ошибка'>
							{saveError}
						</Alert>
					)}

					{isAuthenticated ? (
						<Button
							fullWidth
							size='md'
							variant={saved ? 'filled' : 'outline'}
							color={saved ? 'pink' : 'gray'}
							loading={saving}
							disabled={saved}
							onClick={handleSave}
							leftSection={saved ? <IconHeartFilled size={18} /> : <IconHeart size={18} />}
						>
							{saved ? 'Сохранено в избранном' : 'Сохранить в избранное'}
						</Button>
					) : (
						<Tooltip label={AUTH_SAVE_HINT} multiline w={300} withArrow position='top'>
							<Button fullWidth size='md' variant='outline' color='gray' disabled leftSection={<IconHeart size={18} />}>
								Сохранить в избранное
							</Button>
						</Tooltip>
					)}
				</>
			)}
		</Stack>
	)
}
