import type { NearbyPlace } from '../../../api/nearby'

export function formatDistance(meters: number): string {
	if (meters < 1000) return `${Math.round(meters)} м`
	return `${(meters / 1000).toFixed(1)} км`
}

const TYPE_LABELS: Record<string, string> = {
	Школа: 'Школа',
	Гимназия: 'Гимназия',
	Лицей: 'Лицей',
	'Детский сад': 'Детский сад',
	Парк: 'Парк',
	Сквер: 'Сквер',
	Набережная: 'Набережная',
	'Детская площадка': 'Детская площадка',
	'Детские площадки': 'Детская площадка',
	Спорт: 'Спорт / фитнес',
	Фитнес: 'Спорт / фитнес',
	Бассейн: 'Бассейн',
	Поликлиника: 'Поликлиника',
	Больницы: 'Больница',
	Больница: 'Больница',
	Аптека: 'Аптека',
	Супермаркет: 'Супермаркет',
	Метро: 'Метро',
	Остановка: 'Остановка транспорта',
	Завод: 'Промышленный объект',
	Фабрика: 'Промышленный объект',
	Комбинат: 'Промышленный объект',
	Тэц: 'ТЭЦ / котельная',
	Котельная: 'ТЭЦ / котельная',
	Свалка: 'Свалка / мусор',
	Полигон: 'Свалка / полигон',
	Бар: 'Бар / ночной клуб',
	'Ночной клуб': 'Бар / ночной клуб',
	Кладбище: 'Кладбище',
	Аэропорт: 'Аэропорт',
	'Железнодорожная станция': 'Железная дорога',
	Депо: 'Железная дорога',
}

function escapeHtml(value: string): string {
	return value
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
}

export function formatPlaceType(place: NearbyPlace): string {
	const direct = TYPE_LABELS[place.type]
	if (direct) return direct

	const lower = place.type.toLowerCase()
	for (const [key, label] of Object.entries(TYPE_LABELS)) {
		if (lower.includes(key.toLowerCase())) return label
	}

	if (place.category === 'bad') return 'Негативный фактор'
	return place.type || 'Инфраструктура'
}

function typeMatches(placeType: string, keywords: string[]): boolean {
	const lower = placeType.toLowerCase()
	return keywords.some(kw => lower.includes(kw))
}

export function getPlaceConsequence(place: NearbyPlace): string {
	if (place.consequence) return place.consequence

	const distance = formatDistance(place.distance_meters)
	const close = place.distance_meters < 500
	const veryClose = place.distance_meters < 300
	const type = place.type

	if (typeMatches(type, ['железнодорож', 'депо', 'вокзал'])) {
		if (veryClose) {
			return `Железная дорога в ${distance} от недвижимости — вероятен постоянный шум поездов, вибрация и сквозняки от движения составов.`
		}
		if (close) {
			return `Железная дорога в ${distance} от недвижимости — возможен шум поездов, особенно ночью и при открытых окнах.`
		}
		return `Железная дорога в ${distance} от недвижимости — в отдельные часы возможен шум от проходящих составов.`
	}

	if (typeMatches(type, ['завод', 'фабрик', 'комбинат'])) {
		if (close) {
			return `Промышленный объект в ${distance} от недвижимости — возможны шум, запахи и выбросы, особенно при ветре в сторону дома.`
		}
		return `Промышленный объект в ${distance} от недвижимости — при определённых условиях возможны шум и запахи от производства.`
	}

	if (typeMatches(type, ['тэц', 'котельн', 'очистн'])) {
		if (close) {
			return `ТЭЦ или котельная в ${distance} от недвижимости — возможны шум оборудования, дым и запах топлива.`
		}
		return `ТЭЦ или котельная в ${distance} от недвижимости — при определённых условиях возможны шум и запахи.`
	}

	if (typeMatches(type, ['свалк', 'полигон', 'мусоросжиг'])) {
		if (close) {
			return `Свалка или полигон в ${distance} от недвижимости — вероятны неприятные запахи, пыль и привлечение грызунов.`
		}
		return `Свалка или полигон в ${distance} от недвижимости — при ветре возможны запахи и повышенная запылённость.`
	}

	if (typeMatches(type, ['ночной клуб', 'бар', 'клуб'])) {
		if (close) {
			return `Бар или ночной клуб в ${distance} от недвижимости — вероятен шум по вечерам и ночам, особенно в выходные.`
		}
		return `Бар или ночной клуб в ${distance} от недвижимости — в вечернее время возможен шум от посетителей и музыки.`
	}

	if (typeMatches(type, ['кладбищ'])) {
		return `Кладбище в ${distance} от недвижимости — для части покупателей это может снижать комфорт проживания и ликвидность жилья.`
	}

	if (typeMatches(type, ['аэропорт'])) {
		if (close) {
			return `Аэропорт в ${distance} от недвижимости — вероятен шум самолётов при взлёте и посадке, особенно днём.`
		}
		return `Аэропорт в ${distance} от недвижимости — возможен периодический шум авиатранспорта.`
	}

	if (close) {
		return `Негативный фактор в ${distance} от недвижимости — возможен дискомфорт: шум, запахи или загрязнение окружающей среды.`
	}

	return `Негативный фактор в ${distance} от недвижимости — рекомендуется уточнить возможное влияние на комфорт проживания.`
}

export function buildPlaceMarker(place: NearbyPlace) {
	const typeLabel = formatPlaceType(place)
	const name = place.name?.trim() || 'Без названия'
	const distance = formatDistance(place.distance_meters)
	const consequence = place.category === 'bad' ? getPlaceConsequence(place) : null

	return {
		lat: place.lat,
		lon: place.lon,
		tooltip: typeLabel,
		popup: `<div class="map-popup"><div class="map-popup-type">${escapeHtml(typeLabel)}</div><div class="map-popup-name">${escapeHtml(name)}</div><div class="map-popup-distance">${distance} от объекта</div>${consequence ? `<div class="map-popup-consequence">${escapeHtml(consequence)}</div>` : ''}</div>`,
	}
}
