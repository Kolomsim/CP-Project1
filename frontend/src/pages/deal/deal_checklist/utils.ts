import type {
	ChecklistAnswers,
	ChecklistFinding,
	ChecklistReport,
	ChecklistVerdict,
	FlagSeverity,
	SellerQuestion,
	SellerSection,
} from './types'
import {
	APARTMENT_SECTIONS,
	DEVELOPER_SECTIONS,
	FOREIGN_BUYER_SECTIONS,
	SELLER_SECTIONS,
	VERDICT_MESSAGES,
} from './checklistData'

export function emptyChecklistAnswers(): ChecklistAnswers {
	return { actions: {}, questions: {} }
}

export function isPrimaryMarket(marketCategory: string): boolean {
	const value = marketCategory.toLowerCase()
	return value.includes('новостр') || value.includes('первич')
}

export function isSecondaryMarket(marketCategory: string): boolean {
	const value = marketCategory.toLowerCase()
	return value.includes('втор')
}

export function isForeignCitizenship(citizenship: string | null | undefined): boolean {
	if (!citizenship) return false
	const value = citizenship.trim().toLowerCase()
	return value === 'foreign' || (value !== 'russian' && value !== 'россия' && value !== 'российская федерация')
}

export function isApartmentProperty(
	propertyType: string | null | undefined,
	searchText?: string | null,
): boolean {
	const haystack = `${propertyType ?? ''} ${searchText ?? ''}`.toLowerCase()
	return haystack.includes('апартамент') || haystack.includes('apartment')
}

export function getExtraSections(options: {
	foreign: boolean
	apartment: boolean
}): SellerSection[] {
	const sections: SellerSection[] = []
	if (options.foreign) sections.push(...FOREIGN_BUYER_SECTIONS)
	if (options.apartment) sections.push(...APARTMENT_SECTIONS)
	return sections
}

export function resolveChecklistMode(marketCategory: string): 'developer' | 'seller' | null {
	if (isPrimaryMarket(marketCategory)) return 'developer'
	if (isSecondaryMarket(marketCategory)) return 'seller'
	return null
}

export function sectionQuestions(section: SellerSection): SellerQuestion[] {
	if (section.questions && section.questions.length > 0) {
		return section.questions
	}
	if (section.question) {
		return [section.question]
	}
	return []
}

function countQuestionRisks(
	sections: SellerSection[],
	answers: ChecklistAnswers,
): { answered: number; redCount: number; yellowCount: number } {
	let answered = 0
	let redCount = 0
	let yellowCount = 0

	for (const section of sections) {
		for (const question of sectionQuestions(section)) {
			const answer = answers.questions[question.id]
			if (answer == null) continue
			answered += 1
			if (answer === question.problemAnswer) {
				if ((question.severity ?? 'red') === 'yellow') yellowCount += 1
				else redCount += 1
			}
		}
	}

	return { answered, redCount, yellowCount }
}

function collectSectionFindings(sections: SellerSection[], answers: ChecklistAnswers): ChecklistFinding[] {
	const findings: ChecklistFinding[] = []

	for (const section of sections) {
		for (const question of sectionQuestions(section)) {
			const answer = answers.questions[question.id]
			if (answer == null || answer !== question.problemAnswer) continue

			findings.push({
				id: question.id,
				source: section.title,
				label: question.label,
				severity: question.severity ?? 'red',
				consultation: question.consultation,
			})
		}
	}

	return findings
}

function countActions(sections: SellerSection[], answers: ChecklistAnswers): {
	checkedActions: number
	totalActions: number
} {
	let checkedActions = 0
	let totalActions = 0

	for (const section of sections) {
		for (const action of section.actions) {
			totalActions += 1
			if (answers.actions[action.id]) checkedActions += 1
		}
	}

	return { checkedActions, totalActions }
}

export function getChecklistVerdict(
	mode: 'developer' | 'seller' | null,
	answers: ChecklistAnswers,
	extraSections: SellerSection[] = [],
): { verdict: ChecklistVerdict; message: string; redCount: number; yellowCount: number } {
	let redCount = 0
	let yellowCount = 0
	let answered = 0

	const modeSections =
		mode === 'developer' ? DEVELOPER_SECTIONS : mode === 'seller' ? SELLER_SECTIONS : []

	if (modeSections.length > 0) {
		const risks = countQuestionRisks(modeSections, answers)
		answered += risks.answered
		redCount += risks.redCount
		yellowCount += risks.yellowCount
	}

	const extraRisks = countQuestionRisks(extraSections, answers)
	answered += extraRisks.answered
	redCount += extraRisks.redCount
	yellowCount += extraRisks.yellowCount

	if (answered === 0) {
		return { verdict: 'incomplete', message: VERDICT_MESSAGES.incomplete, redCount, yellowCount }
	}

	if (redCount > 0) {
		return { verdict: 'critical', message: VERDICT_MESSAGES.critical, redCount, yellowCount }
	}

	if (yellowCount > 0) {
		return { verdict: 'attention', message: VERDICT_MESSAGES.attention, redCount, yellowCount }
	}

	return { verdict: 'ok', message: VERDICT_MESSAGES.ok, redCount, yellowCount }
}

export function buildChecklistReport(options: {
	marketCategory?: string | null
	propertyType?: string | null
	searchText?: string | null
	citizenship?: string | null
	answers?: ChecklistAnswers | null
}): ChecklistReport | null {
	const mode = options.marketCategory ? resolveChecklistMode(options.marketCategory) : null
	const extraSections = getExtraSections({
		foreign: isForeignCitizenship(options.citizenship),
		apartment: isApartmentProperty(options.propertyType, options.searchText),
	})

	if (!mode && extraSections.length === 0) {
		return null
	}

	const answers = options.answers ?? emptyChecklistAnswers()
	const modeSections =
		mode === 'developer' ? DEVELOPER_SECTIONS : mode === 'seller' ? SELLER_SECTIONS : []

	const findings = [
		...collectSectionFindings(modeSections, answers),
		...collectSectionFindings(extraSections, answers),
	]

	const { checkedActions, totalActions } = countActions([...modeSections, ...extraSections], answers)
	const summary = getChecklistVerdict(mode, answers, extraSections)

	return {
		mode,
		verdict: summary.verdict,
		message:
			summary.verdict === 'incomplete'
				? 'Ручная проверка по чек-листу не заполнена или не завершена.'
				: summary.message,
		redCount: summary.redCount,
		yellowCount: summary.yellowCount,
		findings,
		checkedActions,
		totalActions,
	}
}

export function severityColor(severity: FlagSeverity): string {
	return severity === 'red' ? 'red' : 'yellow'
}

export function verdictColor(verdict: ChecklistVerdict): string {
	if (verdict === 'critical') return 'red'
	if (verdict === 'attention') return 'yellow'
	if (verdict === 'ok') return 'brand'
	return 'gray'
}

export function verdictLabel(verdict: ChecklistVerdict): string {
	if (verdict === 'critical') return 'Не рекомендуется'
	if (verdict === 'attention') return 'Требуется внимание'
	if (verdict === 'ok') return 'Норма'
	return 'Не завершено'
}
