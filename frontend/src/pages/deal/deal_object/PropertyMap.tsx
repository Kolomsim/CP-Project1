import { Box, Text } from '@mantine/core'
import { TwoGisMap } from '../../../components/TwoGisMap'
import classes from './DealObject.module.css'

type PropertyMapProps = {
	lat: number
	lon: number
	address: string
}

export function PropertyMap({ lat, lon, address }: PropertyMapProps) {
	return (
		<Box className={classes.mapSection}>
			<Text size='sm' fw={600} mb='xs'>
				Карта
			</Text>
			<Box className={classes.mapFrame}>
				<TwoGisMap lat={lat} lon={lon} address={address} title={address} height={400} />
			</Box>
		</Box>
	)
}
