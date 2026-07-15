import type { PropertyPreview } from './types'

export const DEMO_PROPERTY: PropertyPreview = {
  id: '7749201',
  platform: 'ЦИАН',
  url: 'https://www.cian.ru/sale/flat/7749201/',
  title: 'Недвижимость 1',
  address: 'г. Москва, ул. Ленина, д. 12',
  price: 9_999_999,
  totalArea: 48,
  livingArea: 20,
  kitchenArea: 13,
  floor: 8,
  totalFloors: 10,
  rooms: 1,
  propertyType: 'квартира',
  marketCategory: 'вторичка',
  dealType: 'свободная продажа',
  description:
    'Уютная однокомнатная квартира в тихом районе. Рядом метро, школы и парк. Квартира в хорошем состоянии, готова к заселению.',
  seller: {
    name: 'Иванов Иван Иванович',
    phone: '+7 (999) 123-45-67',
  },
  location: {
    lat: 55.751244,
    lon: 37.618423,
  },
}

const SUPPORTED_PLATFORMS = [
  { pattern: /cian\.ru/i, name: 'ЦИАН' },
  { pattern: /avito\.ru/i, name: 'Авито' },
  { pattern: /domclick\.ru/i, name: 'Домклик' },
  { pattern: /smartcheck\.ru/i, name: 'SmartCheck' },
]

export function isSupportedPropertyUrl(url: string): boolean {
  try {
    const parsed = new URL(url.trim())
    return SUPPORTED_PLATFORMS.some(({ pattern }) => pattern.test(parsed.hostname))
  } catch {
    return false
  }
}

export function getPlatformName(url: string): string | null {
  const match = SUPPORTED_PLATFORMS.find(({ pattern }) => pattern.test(url))
  return match?.name ?? null
}
