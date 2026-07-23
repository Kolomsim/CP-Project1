import { Alert, Badge, Group, Paper, Stack, Text, Title } from '@mantine/core'
import { IconAlertCircle, IconAlertTriangle, IconCircleCheck } from '@tabler/icons-react'
import type { ChecklistFinding, ChecklistReport } from '../deal_checklist/types'
import { severityColor, verdictColor, verdictLabel } from '../deal_checklist/utils'
import classes from './DealResult.module.css'

type ChecklistResultSummaryProps = {
	report: ChecklistReport
}

function verdictIcon(verdict: ChecklistReport['verdict']) {
	if (verdict === 'critical') return <IconAlertCircle size={18} />
	if (verdict === 'attention') return <IconAlertTriangle size={18} />
	if (verdict === 'ok') return <IconCircleCheck size={18} />
	return <IconAlertTriangle size={18} />
}

function verdictTitle(verdict: ChecklistReport['verdict']) {
	if (verdict === 'critical') return 'Критичные риски по чек-листу'
	if (verdict === 'attention') return 'Есть замечания по чек-листу'
	if (verdict === 'ok') return 'По чек-листу серьёзных рисков нет'
	return 'Чек-лист не заполнен'
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
				<div className={classes.consultationText}>
					<Text size='sm'>{finding.consultation}</Text>
					{'links' in finding && (finding as any).links?.length > 0 && (
						<Stack gap={4} mt='xs'>
							{(finding as any).links.map((lnk: { href: string; label: string }, idx: number) => (
								<Text key={idx} size='xs'>
									<a href={lnk.href} target='_blank' rel='noopener noreferrer'>
										{lnk.label}
									</a>
								</Text>
							))}
						</Stack>
					)}
				</div>
			</Stack>
		</Paper>
	)
}

export function ChecklistResultSummary({ report }: ChecklistResultSummaryProps) {
	const color = verdictColor(report.verdict)

	return (
		<Paper withBorder radius='md' p='lg' className={classes.riskSection}>
			<Stack gap='md'>
				<Group justify='space-between' align='center' wrap='wrap' gap='sm'>
					<Title order={4} fw={600}>
						Итог ручной проверки (чек-листы)
					</Title>
					<Badge size='lg' color={color} variant='filled'>
						{verdictLabel(report.verdict)}
					</Badge>
				</Group>

				<Alert icon={verdictIcon(report.verdict)} color={color} variant='light' title={verdictTitle(report.verdict)}>
					{report.message}
				</Alert>

				{report.verdict !== 'incomplete' && (
					<Group gap='md'>
						<Text size='sm' c='dimmed'>
							Красных флагов: {report.redCount}
						</Text>
						<Text size='sm' c='dimmed'>
							Жёлтых флагов: {report.yellowCount}
						</Text>
						{report.totalActions > 0 && (
							<Text size='sm' c='dimmed'>
								Пунктов отмечено: {report.checkedActions} из {report.totalActions}
							</Text>
						)}
					</Group>
				)}

				{report.findings.length > 0 ? (
					<Stack gap='sm'>
						<Text size='sm' fw={500}>
							По отмеченным пунктам чек-листа:
						</Text>
						{report.findings.map(finding => (
							<FindingItem key={finding.id} finding={finding} />
						))}
					</Stack>
				) : (
					report.verdict !== 'incomplete' && (
						<Text size='sm' c='dimmed'>
							Отмеченных рисков по чек-листу нет.
						</Text>
					)
				)}
			</Stack>
		</Paper>
	)
}
