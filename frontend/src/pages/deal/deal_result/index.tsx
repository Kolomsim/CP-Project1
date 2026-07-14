import { useEffect, useState } from 'react'
import { Alert, Loader, Paper, Stack, Text } from '@mantine/core'
import { IconAlertCircle } from '@tabler/icons-react'
import { fetchDealCheckResult } from '../../../api/deal'
import { getDealPropertyPreview } from '../../../lib/dealSession'
import type { PropertyPreview } from '../deal_object/types'
import DealReport from '../../../components/DealReport'
import type { DealCheckResult } from './types'
import classes from './DealResult.module.css'

export default function DealResultPage() {
	const [result, setResult] = useState<DealCheckResult | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

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
			<div>
				<Title order={2} mb='sm'>
					Результат проверки
				</Title>
				<Text c='dimmed' mb='xl'>
					Обратите внимание на выявленные особенности объекта недвижимости.
				</Text>
				<Text c='dimmed'>
					Важно! Представленный отчёт об особенностях объекта недвижимости сформирован автоматически и предназначен для предварительного
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

			{result && !loading && <DealReport result={result} />}
		</Stack>
	)
}
