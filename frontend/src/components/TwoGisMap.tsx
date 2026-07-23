import { useMemo } from 'react'
import { Box, Text } from '@mantine/core'
import { buildTwoGisMapSrcDoc, isValidCoordinates } from '../lib/map'

type TwoGisMapProps = {
	lat: number
	lon: number
	address?: string
	title?: string
	height?: number | string
	className?: string
}

export function TwoGisMap({ lat, lon, address, title, height = 400, className }: TwoGisMapProps) {
	const cssHeight = typeof height === 'number' ? `${height}px` : height

	const srcDoc = useMemo(() => {
		if (!isValidCoordinates(lat, lon)) return null
		return buildTwoGisMapSrcDoc({ lat, lon, address: address ?? title })
	}, [lat, lon, address, title])

	if (!srcDoc) {
		return (
			<Box className={className} style={{ height: cssHeight, display: 'grid', placeItems: 'center', padding: 12 }}>
				<Text size='sm' c='dimmed' ta='center'>
					Координаты объекта неизвестны
				</Text>
			</Box>
		)
	}

	return (
		<iframe
			title={title ? `Карта: ${title}` : 'Карта 2ГИС'}
			className={className}
			srcDoc={srcDoc}
			loading='eager'
			referrerPolicy='no-referrer-when-downgrade'
			style={{
				width: '100%',
				height: cssHeight,
				border: 0,
				display: 'block',
				background: '#e8eef3',
			}}
		/>
	)
}
