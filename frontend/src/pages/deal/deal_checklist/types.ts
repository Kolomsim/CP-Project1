export type FlagSeverity = 'red' | 'yellow'

export type ChecklistVerdict = 'critical' | 'attention' | 'ok' | 'incomplete'

export type SellerAction = {
	id: string
	label: string
	links?: { href: string; label: string }[]
}

export type SellerQuestion = {
	id: string
	label: string
	/** Answer that means a problem was found */
	problemAnswer: 'yes' | 'no'
	consultation: string
	/** Default: red */
	severity?: FlagSeverity
}

export type SellerSection = {
	id: string
	title: string
	description?: string
	actions: SellerAction[]
	question?: SellerQuestion
	questions?: SellerQuestion[]
}

export type ChecklistAnswers = {
	actions: Record<string, boolean>
	questions: Record<string, 'yes' | 'no' | null>
}

export type ChecklistFinding = {
	id: string
	source: string
	label: string
	severity: FlagSeverity
	consultation: string
}

export type ChecklistReport = {
	mode: 'developer' | 'seller' | null
	verdict: ChecklistVerdict
	message: string
	redCount: number
	yellowCount: number
	findings: ChecklistFinding[]
	checkedActions: number
	totalActions: number
}
