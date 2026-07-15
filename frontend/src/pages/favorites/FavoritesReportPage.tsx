import { useParams, Link, useNavigate } from 'react-router'
import { useEffect, useState } from 'react'
import { Alert, Anchor, Button, Container, Group, Loader, Stack, Text } from '@mantine/core'
import { IconAlertCircle, IconArrowLeft, IconTrash } from '@tabler/icons-react'
import { fetchFavoriteProperties, deleteFavoriteProperty } from '../../api/deal'
import DealReport from '../../components/DealReport'
import type { DealCheckResult, DealRisk } from '../deal/deal_result/types'
import type { PropertyPreview as DealPropertyPreview } from '../deal/deal_object/types'
import type { ChecklistReport } from '../deal/deal_checklist/types'

type SavedData = {
	property: DealPropertyPreview
	overallRating: string
	problems: DealRisk[]
	riskCount: number
	criticalCount: number
	checkDate: string
	checklistReport?: ChecklistReport
}

export default function FavoritesReportPage() {
	const { favoriteId } = useParams<{ favoriteId: string }>()
	const navigate = useNavigate()
	const [result, setResult] = useState<DealCheckResult | null>(null)
	const [checklistReport, setChecklistReport] = useState<ChecklistReport | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [deleting, setDeleting] = useState(false)

	useEffect(() => {
		if (!favoriteId) return

		const load = async () => {
			setLoading(true)
			setError(null)
			try {
				const items = await fetchFavoriteProperties()
				const item = items.find(p => p.id === favoriteId)
				if (!item) {
					setError('Объект не найден в избранном')
					return
				}

				const saved = item.property_data as unknown as SavedData | undefined
				if (!saved?.property) {
					setError('Данные объекта повреждены или недоступны')
					return
				}

				setResult({
					overallRating: saved.overallRating,
					problems: saved.problems ?? [],
					property: saved.property,
					riskCount: saved.riskCount ?? 0,
					criticalCount: saved.criticalCount ?? 0,
					checkDate: saved.checkDate,
				})
				setChecklistReport(saved.checklistReport ?? null)
			} catch (err) {
				setError(err instanceof Error ? err.message : 'Не удалось загрузить отчёт')
			} finally {
				setLoading(false)
			}
		}

		void load()
	}, [favoriteId])

	const handleDelete = async () => {
		if (!favoriteId) return
		setDeleting(true)
		try {
			await deleteFavoriteProperty(favoriteId)
			navigate('/favorites', { replace: true })
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Не удалось удалить объект')
		} finally {
			setDeleting(false)
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

	if (error || !result) {
		return (
			<Container size='md' py='xl'>
				<Stack align='center' gap='sm'>
					<Alert icon={<IconAlertCircle size={16} />} color='red' variant='light' title='Ошибка'>
						{error ?? 'Отчёт не найден'}
					</Alert>
					<Anchor component={Link} to='/favorites'>
						Вернуться в избранное
					</Anchor>
				</Stack>
			</Container>
		)
	}

	return (
		<Container size='md' py='lg'>
			<Stack gap='lg'>
				<Group justify='space-between'>
					<Anchor component={Link} to='/favorites' c='dimmed' size='sm'>
						<Group gap={4}>
							<IconArrowLeft size={16} />
							<Text component='span'>Назад к избранному</Text>
						</Group>
					</Anchor>
					<Button
						variant='outline'
						color='red'
						size='sm'
						loading={deleting}
						onClick={handleDelete}
						leftSection={<IconTrash size={16} />}
					>
						Удалить из избранного
					</Button>
				</Group>

				<DealReport
					result={result}
					checklistReport={checklistReport}
					title='Полный отчёт по объекту'
					showSaveButton={false}
				/>
			</Stack>
		</Container>
	)
}
