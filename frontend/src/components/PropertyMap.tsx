import { Box, type BoxProps, Text } from '@mantine/core'
import { TwoGisMap } from './TwoGisMap'

type PropertyMapProps = BoxProps & {
	lat?: number
	lon?: number
	address: string
	title?: string
	height?: number | string
}

export function PropertyMap({ lat, lon, address, title, height = 280, ...boxProps }: PropertyMapProps) {
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
				<TwoGisMap
					lat={lat ?? 0}
					lon={lon ?? 0}
					address={address}
					title={title ?? address}
					height={height}
				/>
			</Box>
		</Box>
	)
}
