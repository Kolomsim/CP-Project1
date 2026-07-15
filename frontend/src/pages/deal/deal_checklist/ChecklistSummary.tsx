import { Alert, Badge, Group, Paper, Stack, Text, Title } from '@mantine/core'
import { IconAlertCircle, IconAlertTriangle, IconCircleCheck } from '@tabler/icons-react'
import type { ChecklistVerdict } from './types'
import { verdictColor, verdictLabel } from './utils'
import classes from './DealChecklist.module.css'

type ChecklistSummaryProps = {
	verdict: ChecklistVerdict
	message: string
	redCount: number
	yellowCount: number
}

function verdictIcon(verdict: ChecklistVerdict) {
	if (verdict === 'critical') return <IconAlertCircle size={18} />
	if (verdict === 'attention') return <IconAlertTriangle size={18} />
	if (verdict === 'ok') return <IconCircleCheck size={18} />
	return <IconAlertTriangle size={18} />
}

function verdictTitle(verdict: ChecklistVerdict) {
	if (verdict === 'critical') return 'Критичные риски'
	if (verdict === 'attention') return 'Есть замечания'
	if (verdict === 'ok') return 'Серьёзных рисков нет'
	return 'Проверка ещё не заполнена'
}

export function ChecklistSummary({ verdict, message, redCount, yellowCount }: ChecklistSummaryProps) {
	const color = verdictColor(verdict)

	return (
		<Paper withBorder radius='md' p='lg' className={classes.summaryCard}>
			<Stack gap='md'>
				<Group justify='space-between' align='center' wrap='wrap' gap='sm'>
					<Title order={4} fw={600}>
						Итог ручной проверки
					</Title>
					<Badge size='lg' color={color} variant='filled'>
						{verdictLabel(verdict)}
					</Badge>
				</Group>


				<Alert icon={verdictIcon(verdict)} color={color} variant='light' title={verdictTitle(verdict)}>
					{message}
				</Alert>

				{verdict !== 'incomplete' && (
					<Group gap='md'>
						<Text size='sm' c='dimmed'>
							Красных флагов: {redCount}
						</Text>
						<Text size='sm' c='dimmed'>
							Жёлтых флагов: {yellowCount}
						</Text>
					</Group>
				)}
			</Stack>
		</Paper>
	)
}
