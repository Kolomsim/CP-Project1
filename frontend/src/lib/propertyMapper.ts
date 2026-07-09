import type { PropertyPreview } from '../pages/deal/deal_object/types'

type ApiSeller = {
  name: string
  phone?: string | null
  inn?: string | null
}

type ApiLocation = {
  lat: number
  lon: number
  address?: string | null
}

export type ApiPropertyPreview = {
  id: string
  platform: string
  url: string
  title: string
  address: string
  price: number
  total_area: number
  living_area?: number | null
  kitchen_area?: number | null
  floor: number
  total_floors: number
  rooms: number
  property_type: string
  deal_type?: string | null
  seller: ApiSeller
  location: ApiLocation
  description?: string | null
}

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  flat: 'квартира',
  house: 'дом',
  room: 'комната',
  land: 'участок',
  дом: 'дом',
  новостройка: 'новостройка',
  вторичка: 'вторичка',
}

const DEAL_TYPE_LABELS: Record<string, string> = {
  free_sale: 'свободная продажа',
  alternative: 'альтернатива',
  mortgage: 'ипотека',
  Ипотека: 'ипотека',
  Сразу: 'свободная продажа',
  Кредит: 'кредит',
}

function mapPropertyType(value: string): string {
  return PROPERTY_TYPE_LABELS[value] ?? value
}

function mapDealType(value?: string | null): string {
  if (!value) {
    return 'не указан'
  }

  return DEAL_TYPE_LABELS[value] ?? value
}

export function mapApiPropertyToPreview(data: ApiPropertyPreview): PropertyPreview {
  return {
    id: data.id,
    platform: data.platform,
    url: data.url,
    title: data.title,
    address: data.address,
    price: data.price,
    totalArea: data.total_area,
    livingArea: data.living_area ?? 0,
    kitchenArea: data.kitchen_area ?? 0,
    floor: data.floor,
    totalFloors: data.total_floors,
    rooms: data.rooms,
    propertyType: mapPropertyType(data.property_type),
    dealType: mapDealType(data.deal_type),
    description: data.description ?? '',
    seller: {
      name: data.seller.name,
      phone: data.seller.phone ?? undefined,
    },
    location: {
      lat: data.location.lat,
      lon: data.location.lon,
    },
  }
}
