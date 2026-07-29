import { useEffect, useMemo, useState } from 'react'
import { Alert, Loader, Paper, Stack, Text } from '@mantine/core'
import { IconAlertCircle } from '@tabler/icons-react'
import { fetchDealCheckResult } from '../../../api/deal'
import {
	getDealBuyerCitizenship,
	getDealChecklistAnswers,
	getDealPropertyPreview,
} from '../../../lib/dealSession'
import type { PropertyPreview } from '../deal_object/types'
import type { ChecklistAnswers } from '../deal_checklist/types'
import { buildChecklistReport } from '../deal_checklist/utils'
import DealReport from '../../../components/DealReport'
import type { DealCheckResult } from './types'
import classes from './DealResult.module.css'

export default function DealResultPage() {
	const [result, setResult] = useState<DealCheckResult | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	const checklistReport = useMemo(() => {
		const property = getDealPropertyPreview<PropertyPreview>()
		if (!property) return null

		return buildChecklistReport({
			marketCategory: property.marketCategory,
			propertyType: property.propertyType,
			searchText: `${property.title} ${property.description} ${property.address}`,
			citizenship: getDealBuyerCitizenship(),
			answers: getDealChecklistAnswers<ChecklistAnswers>(),
		})
	}, [result])

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

	return (
		<Stack gap='xl' className={classes.page} maw={760} mx='auto'>
			{loading && (
				<Paper withBorder radius='md' p='xl'>
					<Stack align='center' gap='sm'>
						<Loader color='brand' size='md' />
						<Text size='sm' c='dimmed'>
							Проверяем особенности сделки...
						</Text>
					</Stack>
				</Paper>
			)}

			{error && !loading && (
				<Alert icon={<IconAlertCircle size={16} />} color='red' variant='light' title='Ошибка'>
					{error}
				</Alert>
			)}

			{result && !loading && <DealReport result={result} checklistReport={checklistReport} />}
		</Stack>
	)
}
