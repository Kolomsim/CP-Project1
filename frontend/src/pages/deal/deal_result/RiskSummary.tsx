import { Anchor, Badge, Group, Paper, Stack, Text, Title } from '@mantine/core'
import { Link } from 'react-router'
import type { DealCheckResult, DealRisk } from './types'
import { getRiskLevelLabel } from '../../../utils/format'
import classes from './DealResult.module.css'

type RiskSummaryProps = {
	result: Pick<DealCheckResult, 'overallRating' | 'problems'>
}

function getRatingColor(rating: string) {
	if (rating === 'Не рекомендуется' || rating === 'Обратите внимание') {
		return 'red'
	}

	if (rating === 'Требуется проверка') {
		return 'yellow'
	}

	return 'brand'
}

function getSeverityColor(severity: DealRisk['severity']) {
	if (severity === 'высокий') {
		return 'red'
	}

	if (severity === 'средний') {
		return 'orange'
	}

	return 'blue'
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
			</Stack>
		</Paper>
	)
}

export function RiskSummary({ result }: RiskSummaryProps) {
	return (
		<Paper withBorder radius='md' p='lg' className={classes.riskSection}>
			<Stack gap='md'>
				<Group justify='space-between' align='center' wrap='wrap' gap='sm'>
					<Title order={4} fw={600}>
						Итоговый рейтинг сделки:
					</Title>
					<Badge size='lg' color={getRatingColor(result.overallRating)} variant='filled'>
						{result.overallRating}
					</Badge>
				</Group>

				{result.problems.length > 0 ? (
          <Stack gap="sm">
            <Text size="sm" fw={500}>
              В результате проверки выявлены следующие характеристики объекта недвижимости:
            </Text>

            {result.problems.map((risk, index) => (
              <RiskItem key={`${risk.type}-${index}`} risk={risk} />
            ))}
          </Stack>
        ) : (
          <Text size="sm" c="dimmed">
            Критических особенностей не обнаружено.
          </Text>
        )}
      </Stack>
    </Paper>
  )
}
  