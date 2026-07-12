export function formatPrice(price: number): string {
	return new Intl.NumberFormat('ru-RU').format(price)
}

export function formatPriceWithCurrency(price: number): string {
	return `${formatPrice(price)} ₽`
}

export function formatPricePerSqm(price: number, area: number): string {
	return `${new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(price / area)} ₽/м²`
}

/**
 * Возвращает CSS-класс для рейтинга риска на основе уровня.
 * @param level - уровень риска ('low', 'medium', 'high', 'green', 'yellow', 'red')
 * @param classMap - объект с маппингом уровня на CSS-класс (опционально)
 */
export function getRatingClassName(level: string, classMap?: Record<string, string>): string {
	const keyMap: Record<string, string> = {
		low: 'ratingGreen',
		green: 'ratingGreen',
		medium: 'ratingYellow',
		yellow: 'ratingYellow',
		high: 'ratingRed',
		red: 'ratingRed',
	}

	const className = keyMap[level] ?? ''
	return classMap ? (classMap[className] ?? '') : className
}

/**
 * Возвращает текстовое описание уровня риска.
 */
export function getRiskLevelLabel(level: string): string {
	switch (level) {
		case 'low':
		case 'green':
			return 'Низкий'
		case 'medium':
		case 'yellow':
			return 'Средний'
		case 'high':
		case 'red':
			return 'Высокий'
		default:
			return level
	}
}
