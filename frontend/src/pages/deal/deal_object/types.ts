export type PropertyPreview = {
  id: string
  platform: string
  url: string
  title: string
  address: string
  price: number
  totalArea: number
  livingArea: number
  kitchenArea: number
  floor: number
  totalFloors: number
  rooms: number
  propertyType: string
  dealType: string
  description: string
  seller: {
    name: string
    phone?: string
  }
  location: {
    lat: number
    lon: number
    address?: string
  }
}
