import { Anchor, Badge, Button, Checkbox, Group, Paper, Stack, Text, Title } from '@mantine/core'
import { DEVELOPER_SECTIONS, SELLER_SECTIONS } from './checklistData'
import type { ChecklistAnswers, FlagSeverity, SellerQuestion, SellerSection } from './types'
import { sectionQuestions, severityColor } from './utils'
import classes from './DealChecklist.module.css'

type SellerChecklistProps = {
	answers: ChecklistAnswers
	onActionToggle: (actionId: string, checked: boolean) => void
	onQuestionChange: (questionId: string, value: 'yes' | 'no' | null) => void
	sections?: SellerSection[]
}

function QuestionBlock({
	question,
	answers,
	onQuestionChange,
}: {
	question: SellerQuestion
	answers: ChecklistAnswers
	onQuestionChange: (questionId: string, value: 'yes' | 'no' | null) => void
}) {
	const value = answers.questions[question.id] ?? null
	const severity: FlagSeverity = question.severity ?? 'red'
	const isProblem = value === question.problemAnswer

	return (
		<Paper withBorder radius='md' p='md' className={classes.questionCard}>
			<Stack gap='sm'>
				<Group justify='space-between' align='flex-start' wrap='wrap' gap='xs'>
					<Text size='sm' fw={600} maw='75%'>
						{question.label}
					</Text>
					{question.severity && (
						<Badge color={severityColor(severity)} variant='light'>
							{severity === 'red' ? 'Красный флаг' : 'Жёлтый флаг'}
						</Badge>
					)}
				</Group>
				<Group grow preventGrowOverflow={false}>
					<Button
						size='sm'
						variant={value === 'no' ? 'filled' : 'light'}
						color='brand'
						onClick={() => onQuestionChange(question.id, 'no')}
					>
						Нет
					</Button>
					<Button
						size='sm'
						variant={value === 'yes' ? 'filled' : 'light'}
						color={severity === 'red' ? 'red' : 'yellow'}
						onClick={() => onQuestionChange(question.id, 'yes')}
					>
						Да
					</Button>
				</Group>
				{isProblem && (
					<Text size='sm' c='dimmed' className={classes.consultation}>
						{question.consultation}
					</Text>
				)}
			</Stack>
		</Paper>
	)
}

export function SellerChecklist({
	answers,
	onActionToggle,
	onQuestionChange,
	sections = SELLER_SECTIONS,
}: SellerChecklistProps) {
	return (
		<Stack gap='lg'>
			{sections.map(section => {
				const questions = sectionQuestions(section)

				return (
					<Paper key={section.id} withBorder radius='md' p='lg' className={classes.sectionCard}>
						<Stack gap='md'>
							<div>
								<Title order={4} mb={4}>
									{section.title}
								</Title>
								{section.description && (
									<Text size='sm' c='dimmed'>
										{section.description}
									</Text>
								)}
							</div>

							{section.actions.length > 0 && (
								<Stack gap='sm'>
									{section.actions.map(action => (
										<Checkbox
											key={action.id}
											checked={Boolean(answers.actions[action.id])}
											onChange={event => onActionToggle(action.id, event.currentTarget.checked)}
											label={
												<span>
													{action.label}
													{action.links && action.links.length > 0 && (
														<>
															{' '}
															(
															{action.links.map((link, index) => (
																<span key={link.href}>
																	{index > 0 && ', '}
																	<Anchor href={link.href} target='_blank' rel='noreferrer' size='sm'>
																		{link.label}
																	</Anchor>
																</span>
															))}
															)
														</>
													)}
												</span>
											}
										/>
									))}
								</Stack>
							)}

							{questions.map(question => (
								<QuestionBlock
									key={question.id}
									question={question}
									answers={answers}
									onQuestionChange={onQuestionChange}
								/>
							))}
						</Stack>
					</Paper>
				)
			})}
		</Stack>
	)
}

export function DeveloperChecklist({
	answers,
	onActionToggle,
	onQuestionChange,
}: {
	answers: ChecklistAnswers
	onActionToggle: (actionId: string, checked: boolean) => void
	onQuestionChange: (questionId: string, value: 'yes' | 'no' | null) => void
}) {
	return (
		<SellerChecklist
			answers={answers}
			onActionToggle={onActionToggle}
			onQuestionChange={onQuestionChange}
			sections={DEVELOPER_SECTIONS}
		/>
	)
}
