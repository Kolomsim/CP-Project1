import { Anchor, Badge, Button, Checkbox, Group, Paper, Stack, Text, Title, Tooltip, ThemeIcon } from '@mantine/core'
import { IconRobot, IconQuestionMark } from '@tabler/icons-react'
import { DEVELOPER_SECTIONS, SELLER_SECTIONS } from './checklistData'
import type { AutoAnswer, ChecklistAnswers, FlagSeverity, SellerQuestion, SellerSection } from './types'
import { sectionQuestions, severityColor } from './utils'
import classes from './DealChecklist.module.css'

const SEVERITY_TOOLTIPS: Record<FlagSeverity, string> = {
	red: 'Красный – обнаружены серьёзные недостатки. Требуется консультация со специалистом.',
	yellow: 'Жёлтый – выявлены незначительные особенности, требующие внимания.',
}

const SEVERITY_LABELS: Record<FlagSeverity, string> = {
	red: 'Красный флаг',
	yellow: 'Жёлтый флаг',
}

type SellerChecklistProps = {
	answers: ChecklistAnswers
	onActionToggle: (actionId: string, checked: boolean) => void
	onQuestionChange: (questionId: string, value: 'yes' | 'no' | null) => void
	sections?: SellerSection[]
}

function SeverityBadge({ severity }: { severity: FlagSeverity }) {
	return (
		<Tooltip label={SEVERITY_TOOLTIPS[severity]} multiline maw={280} withArrow openDelay={200}>
			<Badge
				color={severityColor(severity)}
				variant='light'
				style={{ cursor: 'help' }}
				rightSection={<IconQuestionMark size={12} style={{ marginLeft: 2 }} />}
			>
				{SEVERITY_LABELS[severity]}
			</Badge>
		</Tooltip>
	)
}

function QuestionBlock({
	question,
	answers,
	onQuestionChange,
	autoAnswer,
}: {
	question: SellerQuestion
	answers: ChecklistAnswers
	onQuestionChange: (questionId: string, value: 'yes' | 'no' | null) => void
	autoAnswer?: AutoAnswer
}) {
	const value = answers.questions[question.id] ?? null
	const severity: FlagSeverity = question.severity ?? 'red'
	const isProblem = value === question.problemAnswer

	// Если ответ ещё не выбран пользователем и есть авто-ответ — применяем его
	const effectiveValue = value ?? autoAnswer?.value ?? null
	const hasAuto = autoAnswer !== undefined && value === null

	return (
		<Paper
			withBorder
			radius='md'
			p='md'
			className={classes.questionCard}
			style={hasAuto ? { borderLeft: '4px solid var(--mantine-color-brand-5)' } : undefined}
		>
			<Stack gap='sm'>
				<Group justify='space-between' align='flex-start' wrap='wrap' gap='xs'>
					<Group gap='xs' align='center' maw='75%' wrap='nowrap'>
						{hasAuto && (
							<Tooltip label={`Автоматически проверено: ${autoAnswer.source}`} withArrow openDelay={200}>
								<ThemeIcon variant='light' color='brand' size='sm' style={{ cursor: 'help', flexShrink: 0 }}>
									<IconRobot size={14} />
								</ThemeIcon>
							</Tooltip>
						)}
						<Text size='sm' fw={600}>
							{question.label}
						</Text>
					</Group>
					{question.severity && <SeverityBadge severity={severity} />}
				</Group>

				{hasAuto && (
					<Text size='xs' c='brand' fw={500}>
						Авто-ответ: {autoAnswer.value === 'yes' ? 'Да' : 'Нет'} — {autoAnswer.source}
						{autoAnswer.details ? ` (${autoAnswer.details})` : ''}
					</Text>
				)}

				<Group grow preventGrowOverflow={false}>
					<Button
						size='sm'
						variant={effectiveValue === 'no' ? 'filled' : 'light'}
						color='brand'
						onClick={() => onQuestionChange(question.id, 'no')}
					>
						Нет
					</Button>
					<Button
						size='sm'
						variant={effectiveValue === 'yes' ? 'filled' : 'light'}
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

function SectionActions({
	actions,
	answers,
	onActionToggle,
}: {
	actions: SellerSection['actions']
	answers: ChecklistAnswers
	onActionToggle: (actionId: string, checked: boolean) => void
}) {
	return (
		<Stack gap='sm'>
			{actions.map(action => (
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
	)
}

function SectionCard({
	section,
	answers,
	onActionToggle,
	onQuestionChange,
	autoAnswers,
}: {
	section: SellerSection
	answers: ChecklistAnswers
	onActionToggle: (actionId: string, checked: boolean) => void
	onQuestionChange: (questionId: string, value: 'yes' | 'no' | null) => void
	autoAnswers?: Record<string, AutoAnswer>
}) {
	const questions = sectionQuestions(section)

	// Определяем, есть ли в этой секции автоматические ответы
	const hasAutoAnswers = questions.some(q => autoAnswers?.[q.id] !== undefined)
	const hasManualQuestions = questions.some(q => autoAnswers?.[q.id] === undefined)

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
					<SectionActions actions={section.actions} answers={answers} onActionToggle={onActionToggle} />
				)}

				{/* Сначала автоматические вопросы */}
				{hasAutoAnswers && (
					<>
						<Group gap='xs' align='center'>
							<ThemeIcon variant='light' color='brand' size='sm'>
								<IconRobot size={14} />
							</ThemeIcon>
							<Text size='sm' fw={500} c='brand'>
								Проверено автоматически
							</Text>
						</Group>
						{questions
							.filter(q => autoAnswers?.[q.id] !== undefined)
							.map(question => (
								<QuestionBlock
									key={question.id}
									question={question}
									answers={answers}
									onQuestionChange={onQuestionChange}
									autoAnswer={autoAnswers?.[question.id]}
								/>
							))}
					</>
				)}

				{/* Затем ручные вопросы */}
				{hasManualQuestions && (
					<>
						{hasAutoAnswers && (
							<Group gap='xs' align='center'>
								<ThemeIcon variant='light' color='gray' size='sm'>
									<IconQuestionMark size={14} />
								</ThemeIcon>
								<Text size='sm' fw={500} c='dimmed'>
									Требуется ручная проверка
								</Text>
							</Group>
						)}
						{questions
							.filter(q => autoAnswers?.[q.id] === undefined)
							.map(question => (
								<QuestionBlock
									key={question.id}
									question={question}
									answers={answers}
									onQuestionChange={onQuestionChange}
								/>
							))}
					</>
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
			{sections.map(section => (
				<SectionCard
					key={section.id}
					section={section}
					answers={answers}
					onActionToggle={onActionToggle}
					onQuestionChange={onQuestionChange}
				/>
			))}
		</Stack>
	)
}

export function DeveloperChecklist({
	answers,
	onActionToggle,
	onQuestionChange,
	autoAnswers,
}: {
	answers: ChecklistAnswers
	onActionToggle: (actionId: string, checked: boolean) => void
	onQuestionChange: (questionId: string, value: 'yes' | 'no' | null) => void
	autoAnswers?: Record<string, AutoAnswer>
}) {
	return (
		<Stack gap='lg'>
			{DEVELOPER_SECTIONS.map(section => (
				<SectionCard
					key={section.id}
					section={section}
					answers={answers}
					onActionToggle={onActionToggle}
					onQuestionChange={onQuestionChange}
					autoAnswers={autoAnswers}
				/>
			))}
		</Stack>
	)
}
