import type { PropertyPreview } from '../deal_object/types'

export type RiskSeverity = 'высокий' | 'средний' | 'низкий'

export type DealRisk = {
	type: string
	severity: RiskSeverity
	title: string
	description: string
	recommendation: string
	articleLink?: string
	details?: string
	autoCheck?: boolean
	checkUrl?: string
}

export type DealCheckResult = {
	overallRating: string
	problems: DealRisk[]
	property: PropertyPreview
	riskCount: number
	criticalCount: number
	checkDate: string
}
