import type { ComparisonResult } from '../pages/comparison/ComparisonCard'
import type { PropertyWithRating } from '../mock/properties'

export function formatPrice(price: number): string {
	return new Intl.NumberFormat('ru-RU').format(price)
}

export function buildComparisons(
	a: PropertyWithRating,
	b: PropertyWithRating,
): ComparisonResult[] {
	return [
		{
			label: 'Цена',
			leftValue: `${formatPrice(a.price)} ₽`,
			rightValue: `${formatPrice(b.price)} ₽`,
			winner: a.price < b.price ? 'left' : a.price > b.price ? 'right' : 'tie',
		},
		{
			label: 'Цена за м²',
			leftValue: `${formatPrice(Math.round(a.price / a.total_area))} ₽`,
			rightValue: `${formatPrice(Math.round(b.price / b.total_area))} ₽`,
			winner:
				a.price / a.total_area < b.price / b.total_area
					? 'left'
					: a.price / a.total_area > b.price / b.total_area
						? 'right'
						: 'tie',
		},
		{
			label: 'Общая площадь',
			leftValue: `${a.total_area} м²`,
			rightValue: `${b.total_area} м²`,
			winner:
				a.total_area > b.total_area
					? 'left'
					: a.total_area < b.total_area
						? 'right'
						: 'tie',
		},
		{
			label: 'Жилая площадь',
			leftValue: a.living_area ? `${a.living_area} м²` : '—',
			rightValue: b.living_area ? `${b.living_area} м²` : '—',
			winner:
				(a.living_area ?? 0) > (b.living_area ?? 0)
					? 'left'
					: (a.living_area ?? 0) < (b.living_area ?? 0)
						? 'right'
						: 'tie',
		},
		{
			label: 'Площадь кухни',
			leftValue: a.kitchen_area ? `${a.kitchen_area} м²` : '—',
			rightValue: b.kitchen_area ? `${b.kitchen_area} м²` : '—',
			winner:
				(a.kitchen_area ?? 0) > (b.kitchen_area ?? 0)
					? 'left'
					: (a.kitchen_area ?? 0) < (b.kitchen_area ?? 0)
						? 'right'
						: 'tie',
		},
		{
			label: 'Комнат',
			leftValue: `${a.rooms}`,
			rightValue: `${b.rooms}`,
			winner: a.rooms > b.rooms ? 'left' : a.rooms < b.rooms ? 'right' : 'tie',
		},
		{
			label: 'Этаж',
			leftValue: `${a.floor}/${a.total_floors}`,
			rightValue: `${b.floor}/${b.total_floors}`,
			winner: 'tie',
		},
	]
}
