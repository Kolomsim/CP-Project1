import { Box, type BoxProps, Text } from '@mantine/core'
import { buildYandexMapEmbedUrl } from '../lib/map'

type PropertyMapProps = BoxProps & {
	lat?: number
	lon?: number
	address: string
	title?: string
	height?: number | string
}

export function PropertyMap({ lat, lon, address, title, height = 280, ...boxProps }: PropertyMapProps) {
	const mapSrc = buildYandexMapEmbedUrl({ lat, lon, address })

	return (
		<Box {...boxProps}>
			{title && (
				<Text size='sm' fw={600} mb='xs'>
					{title}
				</Text>
			)}
			<Box
				style={{
					border: '1px solid var(--mantine-color-gray-3)',
					borderRadius: 'var(--mantine-radius-md)',
					overflow: 'hidden',
					height,
				}}
			>
				<iframe
					title={`Карта: ${address}`}
					src={mapSrc}
					width='100%'
					height='100%'
					loading='lazy'
					referrerPolicy='no-referrer-when-downgrade'
					style={{ border: 'none' }}
				/>
			</Box>
		</Box>
	)
}
