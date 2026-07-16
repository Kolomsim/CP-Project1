import { useState } from 'react'
import { Alert, Anchor, Badge, Button, Group, Paper, Stack, Text, Title, Tooltip } from '@mantine/core'
import { IconAlertCircle, IconExternalLink, IconHeart, IconHeartFilled, IconQuestionMark } from '@tabler/icons-react'
import { Link } from 'react-router'
import classes from '../pages/deal/deal_result/DealResult.module.css'
import { PropertyPreviewCard } from '../pages/deal/deal_object/PropertyPreviewCard'
import { savePropertyToFavorites } from '../api/deal'
import { useAuth } from '../context/AuthContext'
import { getRiskLevelLabel } from '../utils/format'
import type { DealCheckResult, DealRisk } from '../pages/deal/deal_result/types'
import type { ChecklistFinding, ChecklistReport } from '../pages/deal/deal_checklist/types'
import { severityColor } from '../pages/deal/deal_checklist/utils'
import { NearbyPlacesMap } from '../pages/deal/deal_result/NearbyPlacesMap'

type DealReportProps = {
	result: DealCheckResult
	checklistReport?: ChecklistReport | null
	title?: string
	showSaveButton?: boolean
}

const AUTH_SAVE_HINT = 'чтобы сохранить в избранное или сравнивать объекты недвижимости между собой — войдите в аккаунт'

function getSeverityColor(severity: DealRisk['severity']) {
	if (severity === 'высокий') return 'red'
	if (severity === 'средний') return 'orange'
	return 'blue'
}

function getOverallColor(result: DealCheckResult, checklistReport?: ChecklistReport | null): string {
	if (checklistReport && checklistReport.verdict === 'critical') return 'red'
	if (checklistReport && checklistReport.verdict === 'attention') return 'yellow'

	const rating = result.overallRating
	if (rating === 'Не рекомендуется' || rating === 'Обратите внимание') return 'red'
	if (rating === 'Требуется проверка') return 'yellow'

	return 'brand'
}

function getOverallLabel(result: DealCheckResult, checklistReport?: ChecklistReport | null): string {
	if (checklistReport && checklistReport.verdict === 'critical') return 'Обнаружены риски'
	if (checklistReport && checklistReport.verdict === 'attention') return 'Требуется внимание'
	if (checklistReport && checklistReport.verdict === 'ok') return 'Нет критичных рисков'

	const rating = result.overallRating
	if (rating === 'Не рекомендуется' || rating === 'Обратите внимание') return 'Обнаружены риски'
	if (rating === 'Требуется проверка') return 'Требуется внимание'
	return 'Нет критичных рисков'
}

function getOverallTitle(result: DealCheckResult, checklistReport?: ChecklistReport | null): string {
	if (checklistReport && checklistReport.verdict === 'critical') return 'Критичные риски'
	if (checklistReport && checklistReport.verdict === 'attention') return 'Есть замечания'
	if (checklistReport && checklistReport.verdict === 'ok') return 'Серьёзных рисков нет'

	if (result.overallRating === 'Не рекомендуется' || result.overallRating === 'Обратите внимание') {
		return 'Критичные риски'
	}
	if (result.overallRating === 'Требуется проверка') return 'Есть замечания'

	return 'Серьёзных рисков нет'
}

function getOverallMessage(result: DealCheckResult, checklistReport?: ChecklistReport | null): string {
	if (checklistReport && checklistReport.verdict !== 'incomplete') {
		return checklistReport.message
	}

	if (result.problems.length > 0) {
		return 'По результатам автоматической проверки обнаружены особенности, требующие внимания.'
	}

	return 'По результатам проверки серьёзных рисков не обнаружено.'
}

function getRedCount(result: DealCheckResult, checklistReport?: ChecklistReport | null): number {
	let count = 0
	if (checklistReport) count += checklistReport.redCount
	count += result.criticalCount ?? 0
	return count
}

function getYellowCount(result: DealCheckResult, checklistReport?: ChecklistReport | null): number {
	let count = 0
	if (checklistReport) count += checklistReport.yellowCount
	count += (result.riskCount ?? 0) - (result.criticalCount ?? 0)
	return Math.max(0, count)
}

function RiskItem({ risk }: { risk: DealRisk }) {
	return (
		<Paper withBorder radius='md' p='md' className={classes.riskItem}>
			<Stack gap='xs'>
				<Group justify='space-between' align='flex-start' wrap='wrap' gap='xs'>
					<Text fw={600}>{risk.title}</Text>
					<Badge color={getSeverityColor(risk.severity)} variant='light'>
						{getRiskLevelLabel(risk.severity)}
					</Badge>
				</Group>

				<Text size='sm'>{risk.description}</Text>

				{risk.recommendation && (
					<Text size='sm'>
						{risk.articleLink ? (
							<Anchor component={Link} to={risk.articleLink} size='sm'>
								{risk.recommendation}
							</Anchor>
						) : (
							risk.recommendation
						)}
					</Text>
				)}

				{risk.details && (
					<Text size='xs' c='dimmed'>
						{risk.details}
					</Text>
				)}

				{risk.autoCheck && risk.checkUrl && (
					<Button
						component='a'
						href={risk.checkUrl}
						target='_blank'
						rel='noopener noreferrer'
						variant='outline'
						color='gray'
						size='xs'
						leftSection={<IconExternalLink size={14} />}
						mt='xs'
					>
						Перепроверить на pb.nalog.ru
					</Button>
				)}
			</Stack>
		</Paper>
	)
}

function FindingItem({ finding }: { finding: ChecklistFinding }) {
	return (
		<Paper withBorder radius='md' p='md' className={classes.riskItem}>
			<Stack gap='xs'>
				<Group justify='space-between' align='flex-start' wrap='wrap' gap='xs'>
					<Stack gap={2} maw='75%'>
						<Text size='xs' c='dimmed'>
							{finding.source}
						</Text>
						<Text fw={600} size='sm'>
							{finding.label}
						</Text>
					</Stack>
					<Badge color={severityColor(finding.severity)} variant='light'>
						{finding.severity === 'red' ? 'Красный флаг' : 'Жёлтый флаг'}
					</Badge>
				</Group>
				<Text size='sm' className={classes.consultationText}>
					{finding.consultation}
				</Text>
			</Stack>
		</Paper>
	)
}

export default function DealReport({
	result,
	checklistReport = null,
	title = 'Результат проверки',
	showSaveButton = true,
}: DealReportProps) {
	const { isAuthenticated } = useAuth()
	const [saving, setSaving] = useState(false)
	const [saved, setSaved] = useState(false)
	const [saveError, setSaveError] = useState<string | null>(null)

	const overallColor = getOverallColor(result, checklistReport)
	const overallLabel = getOverallLabel(result, checklistReport)
	const overallTitle = getOverallTitle(result, checklistReport)
	const overallMessage = getOverallMessage(result, checklistReport)
	const redCount = getRedCount(result, checklistReport)
	const yellowCount = getYellowCount(result, checklistReport)

	const allFindings: { type: 'risk' | 'finding'; risk?: DealRisk; finding?: ChecklistFinding }[] = [
		...result.problems.map(risk => ({ type: 'risk' as const, risk })),
		...(checklistReport?.findings.map(finding => ({ type: 'finding' as const, finding })) ?? []),
	]

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
				checklistReport: checklistReport ?? undefined,
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
					Обратите внимание на выявленные особенности объекта недвижимости.
				</Text>
				<Text c='dimmed' size='sm'>
					Важно! Представленный отчёт об особенностях объекта недвижимости сформирован автоматически и предназначен для
					предварительного ориентирования пользователя. Отчёт не является юридическим заключением, не учитывает всех
					особенностей Вашей ситуации и не может рассматриваться как основание для однозначного вывода о законности или
					недействительности сделки. Для принятия окончательного решения рекомендуем обратиться к специалисту.
				</Text>
			</div>

			{/* Единый итоговый блок */}
			<Paper withBorder radius='md' p='lg' className={classes.riskSection}>
				<Stack gap='md'>
					<Group justify='space-between' align='center' wrap='wrap' gap='sm'>
						<Title order={4} fw={600}>
							Итог проверки
						</Title>
						<Badge size='lg' color={overallColor} variant='filled'>
							{overallLabel}
						</Badge>
					</Group>

					<Alert icon={<IconAlertCircle size={18} />} color={overallColor} variant='light' title={overallTitle}>
						{overallMessage}
					</Alert>

					{(redCount > 0 || yellowCount > 0) && (
						<Group gap='md'>
							<Tooltip
								label='Красный – обнаружены серьёзные недостатки. Требуется консультация со специалистом.'
								multiline
								maw={280}
								withArrow
								openDelay={200}
							>
								<Text size='sm' c='red' style={{ cursor: 'help' }}>
									Красных флагов: {redCount}
									<IconQuestionMark size={12} style={{ marginLeft: 4, verticalAlign: 'middle' }} />
								</Text>
							</Tooltip>
							<Tooltip
								label='Жёлтый – выявлены незначительные особенности, требующие внимания.'
								multiline
								maw={280}
								withArrow
								openDelay={200}
							>
								<Text size='sm' c='yellow.7' style={{ cursor: 'help' }}>
									Жёлтых флагов: {yellowCount}
									<IconQuestionMark size={12} style={{ marginLeft: 4, verticalAlign: 'middle' }} />
								</Text>
							</Tooltip>
						</Group>
					)}

					{/* Все обнаруженные особенности в одном списке */}
					{allFindings.length > 0 && (
						<Stack gap='sm'>
							<Text size='sm' fw={500}>
								Обнаруженные особенности:
							</Text>
							{allFindings.map((item, index) =>
								item.type === 'risk' && item.risk ? (
									<RiskItem key={`risk-${item.risk.type}-${index}`} risk={item.risk} />
								) : item.finding ? (
									<FindingItem key={`finding-${item.finding.id}`} finding={item.finding} />
								) : null,
							)}
						</Stack>
					)}

					{allFindings.length === 0 && (
						<Text size='sm' c='dimmed'>
							Критических особенностей не обнаружено.
						</Text>
					)}
				</Stack>
			</Paper>

			<PropertyPreviewCard property={result.property} />
			<NearbyPlacesMap
				lat={result.property.location.lat}
				lon={result.property.location.lon}
				address={result.property.address}
			/>

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
