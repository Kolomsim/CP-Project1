import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import { Alert, Button, Loader, Paper, Stack, Text, Title } from '@mantine/core'
import { IconAlertCircle } from '@tabler/icons-react'
import {
	getDealBuyerCitizenship,
	getDealChecklistAnswers,
	getDealPropertyPreview,
	saveDealChecklistAnswers,
} from '../../../lib/dealSession'
import { fetchDeveloperCheck } from '../../../api/deal'
import type { PropertyPreview } from '../deal_object/types'
import { DeveloperChecklist, SellerChecklist } from './Checklists'
import { ChecklistSummary } from './ChecklistSummary'
import type { AutoAnswer, ChecklistAnswers } from './types'
import {
	emptyChecklistAnswers,
	getChecklistVerdict,
	getExtraSections,
	isApartmentProperty,
	isForeignCitizenship,
	resolveChecklistMode,
} from './utils'
import classes from './DealChecklist.module.css'

function resolveMode(marketCategory: string): 'developer' | 'seller' | null {
	return resolveChecklistMode(marketCategory)
}

function pageTitle(mode: 'developer' | 'seller' | null, hasExtras: boolean): string {
	if (mode === 'developer') return 'Проверка застройщика'
	if (mode === 'seller') return 'Проверка продавца'
	if (hasExtras) return 'Дополнительные проверки'
	return 'Чек-лист'
}

function pageDescription(mode: 'developer' | 'seller' | null, hasExtras: boolean): string {
	const parts: string[] = []
	if (mode === 'developer') {
		parts.push('Отметьте выполненные проверки по застройщику и ответьте на вопросы о найденных рисках.')
	} else if (mode === 'seller') {
		parts.push('Отметьте выполненные проверки по продавцу и зафиксируйте ключевые риски.')
	}
	if (hasExtras) {
		parts.push('Ниже — дополнительные пункты по вашему профилю сделки.')
	}
	return parts.join(' ')
}

export default function DealChecklistPage() {
	const property = getDealPropertyPreview<PropertyPreview>()
	const citizenship = getDealBuyerCitizenship()
	const mode = property?.marketCategory ? resolveMode(property.marketCategory) : null
	const showForeign = isForeignCitizenship(citizenship)
	const showApartment = isApartmentProperty(
		property?.propertyType,
		property ? `${property.title} ${property.description} ${property.address}` : null,
	)
	const extraSections = useMemo(
		() => getExtraSections({ foreign: showForeign, apartment: showApartment }),
		[showForeign, showApartment],
	)
	const hasExtras = extraSections.length > 0

	const [answers, setAnswers] = useState<ChecklistAnswers>(() => {
		const saved = getDealChecklistAnswers<ChecklistAnswers & { flags?: unknown }>()
		if (!saved) return emptyChecklistAnswers()
		return {
			actions: saved.actions ?? {},
			questions: saved.questions ?? {},
		}
	})

	const [autoAnswers, setAutoAnswers] = useState<Record<string, AutoAnswer> | null>(null)
	const [autoLoading, setAutoLoading] = useState(false)
	const [autoError, setAutoError] = useState<string | null>(null)

	// Загружаем авто-ответы из ФНС при монтировании для режима застройщика
	useEffect(() => {
		if (mode !== 'developer') return

		let cancelled = false
		setAutoLoading(true)
		setAutoError(null)

		fetchDeveloperCheck()
			.then(data => {
				if (!cancelled) {
					setAutoAnswers(data.auto_answers)
					// Автоматически применяем авто-ответы, если пользователь ещё не выбрал ответ
					setAnswers(prev => {
						const next = { ...prev }
						let changed = false
						for (const [qId, aa] of Object.entries(data.auto_answers)) {
							if (next.questions[qId] === undefined || next.questions[qId] === null) {
								next.questions = { ...next.questions, [qId]: aa.value }
								changed = true
							}
						}
						if (changed) {
							saveDealChecklistAnswers(next)
						}
						return next
					})
				}
			})
			.catch(err => {
				if (!cancelled) {
					setAutoError(err instanceof Error ? err.message : 'Ошибка загрузки данных ФНС')
				}
			})
			.finally(() => {
				if (!cancelled) setAutoLoading(false)
			})

		return () => {
			cancelled = true
		}
	}, [mode])

	const summary = useMemo(
		() => (mode || hasExtras ? getChecklistVerdict(mode, answers, extraSections) : null),
		[mode, answers, hasExtras, extraSections],
	)

	const persist = (next: ChecklistAnswers) => {
		setAnswers(next)
		saveDealChecklistAnswers(next)
	}

	const handleActionToggle = (actionId: string, checked: boolean) => {
		persist({
			...answers,
			actions: { ...answers.actions, [actionId]: checked },
		})
	}

	const handleQuestionChange = (questionId: string, value: 'yes' | 'no' | null) => {
		persist({
			...answers,
			questions: { ...answers.questions, [questionId]: value },
		})
	}

	if (!property) {
		return (
			<Stack gap='xl' className={classes.page} maw={760} mx='auto'>
				<Paper withBorder radius='md' p='lg' className={classes.missingCard}>
					<Alert icon={<IconAlertCircle size={16} />} color='red' variant='light' title='Нет данных объекта'>
						Сначала укажите объект на предыдущем шаге.
					</Alert>
					<Button component={Link} to='/deal/deal_object' mt='md'>
						К выбору объекта
					</Button>
				</Paper>
			</Stack>
		)
	}

	if (!mode && !hasExtras) {
		return (
			<Stack gap='xl' className={classes.page} maw={760} mx='auto'>
				<Paper withBorder radius='md' p='lg' className={classes.missingCard}>
					<Alert
						icon={<IconAlertCircle size={16} />}
						color='yellow'
						variant='light'
						title='Не удалось определить тип жилья'
					>
						Для объекта не указано, новостройка это или вторичка. Вернитесь к предпросмотру или продолжите к
						автоматической проверке.
					</Alert>
					<Button component={Link} to='/deal/deal_result' mt='md'>
						К результату проверки
					</Button>
				</Paper>
			</Stack>
		)
	}

	return (
		<Stack gap='xl' className={classes.page} maw={760} mx='auto'>
			<div>
				<Title order={2} mb='sm'>
					Шаг 3. {pageTitle(mode, hasExtras)}
				</Title>
				<Text c='dimmed'>{pageDescription(mode, hasExtras)}</Text>
			</div>

			{autoLoading && (
				<Paper withBorder radius='md' p='md'>
					<Stack align='center' gap='sm'>
						<Loader size='sm' />
						<Text size='sm' c='dimmed'>
							Загружаем данные из ФНС для автоматического заполнения...
						</Text>
					</Stack>
				</Paper>
			)}

			{autoError && (
				<Alert icon={<IconAlertCircle size={16} />} color='yellow' variant='light' title='Данные ФНС не загружены'>
					<Text size='sm'>{autoError}</Text>
					<Text size='xs' c='dimmed' mt={4}>
						Вы можете заполнить чек-лист вручную.
					</Text>
				</Alert>
			)}

			{mode === 'developer' && (
				<>
					<Paper withBorder radius='md' p='md' mb='md'>
						<Title order={3} mb='xs'>
							Информация о застройщике
						</Title>
						<Text size='sm'>
							{property?.seller?.name ? `Имя застройщика: ${property.seller.name}` : 'Имя застройщика не указано'}
						</Text>
						{property?.seller?.inn && <Text size='sm'>ИНН застройщика: {property.seller.inn}</Text>}
					</Paper>
					<DeveloperChecklist
						answers={answers}
						onActionToggle={handleActionToggle}
						onQuestionChange={handleQuestionChange}
						autoAnswers={autoAnswers ?? undefined}
					/>
				</>
			)}

			{mode === 'seller' && (
				<SellerChecklist
					answers={answers}
					onActionToggle={handleActionToggle}
					onQuestionChange={handleQuestionChange}
				/>
			)}

			{hasExtras && (
				<>
					{(mode === 'developer' || mode === 'seller') && (
						<div>
							<Title order={3} mb='xs'>
								Дополнительно для вашей сделки
							</Title>
							<Text size='sm' c='dimmed'>
								{showForeign && showApartment
									? 'Показаны чек-листы для иностранного покупателя и апартаментов.'
									: showForeign
										? 'Показан чек-лист для иностранного покупателя — по данным анкеты.'
										: 'Показан чек-лист по апартаментам — по данным объекта.'}
							</Text>
						</div>
					)}
					<SellerChecklist
						answers={answers}
						onActionToggle={handleActionToggle}
						onQuestionChange={handleQuestionChange}
						sections={extraSections}
					/>
				</>
			)}

			{summary && (
				<ChecklistSummary
					verdict={summary.verdict}
					message={summary.message}
					redCount={summary.redCount}
					yellowCount={summary.yellowCount}
				/>
			)}

			<Button component={Link} to='/deal/deal_result' size='md'>
				Перейти к отчёту
			</Button>
		</Stack>
	)
}
