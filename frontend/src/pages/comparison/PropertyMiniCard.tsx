import { Box, Card, Group, Stack, Text, Badge, Checkbox, Image } from '@mantine/core'
import { IconPhoto } from '@tabler/icons-react'
import type { PropertyPreview } from '../../types/property'
import { formatPrice } from '../../utils/format'

export interface PropertyMiniCardProps {
	property: PropertyPreview
	selected: boolean
	onToggle: (id: string) => void
}

export function PropertyMiniCard({ property, selected, onToggle }: PropertyMiniCardProps) {
	const imageUrl = property.images?.[0]

	return (
		<Card
			withBorder
			padding='sm'
			style={{
				display: 'flex',
				flexDirection: 'row',
				alignItems: 'center',
				gap: 12,
				cursor: 'pointer',
				opacity: selected ? 1 : 0.7,
				borderColor: selected ? 'var(--mantine-color-violet-5)' : undefined,
				background: selected ? 'var(--mantine-color-violet-0)' : undefined,
			}}
			onClick={() => onToggle(property.id)}
		>
			<Checkbox
				checked={selected}
				onChange={() => onToggle(property.id)}
				color='violet'
				aria-label={`Выбрать ${property.title}`}
			/>
			<Box
				w={80}
				h={60}
				style={{
					flexShrink: 0,
					borderRadius: 8,
					overflow: 'hidden',
					background: 'var(--mantine-color-gray-1)',
				}}
			>
				{imageUrl ? (
					<Image src={imageUrl} alt={property.title} h='100%' fit='cover' />
				) : (
					<div
						style={{
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							height: 60,
							color: 'var(--mantine-color-gray-5)',
						}}
					>
						<IconPhoto size={24} stroke={1} />
					</div>
				)}
			</Box>
			<Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
				<Text size='sm' fw={600} truncate='end'>
					{property.title}
				</Text>
				<Text size='xs' c='dimmed' truncate='end'>
					{property.address}
				</Text>
				<Group gap={4}>
					<Badge variant='light' color='gray' size='xs'>
						{property.rooms} комн.
					</Badge>
					<Badge variant='light' color='gray' size='xs'>
						{property.total_area} м²
					</Badge>
				</Group>
			</Stack>
			<Text fw={700} size='sm' style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>
				{formatPrice(property.price)} ₽
			</Text>
		</Card>
	)
}
