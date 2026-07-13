import { PropertyMap as BasePropertyMap } from '../../../components/PropertyMap'

type PropertyMapProps = {
	lat: number
	lon: number
	address: string
}

export function PropertyMap({ lat, lon, address }: PropertyMapProps) {
	return <BasePropertyMap lat={lat} lon={lon} address={address} title='Карта' />
}
