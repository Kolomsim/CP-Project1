import { Box, Text } from '@mantine/core'
import { buildYandexMapEmbedUrl } from '../../../lib/map'
import classes from './DealObject.module.css'

type PropertyMapProps = {
  lat: number
  lon: number
  address: string
}

export function PropertyMap({ lat, lon, address }: PropertyMapProps) {
  const mapSrc = buildYandexMapEmbedUrl({ lat, lon, address })

  return (
    <Box className={classes.mapSection}>
      <Text size="sm" fw={600} mb="xs">
        Карта
      </Text>
      <Box className={classes.mapFrame}>
        <iframe
          title={`Карта: ${address}`}
          src={mapSrc}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </Box>
    </Box>
  )
}
