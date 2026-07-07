import { Box, Card, Group, Stack, Text, Badge, Tooltip, ActionIcon, Image } from '@mantine/core'
import {
	IconHeart,
	IconHeartFilled,
	IconMapPin,
	IconGitCompare,
	IconBuildingSkyscraper,
	IconPhoto,
} from '@tabler/icons-react'
import type { PropertyPreview, DealRating } from '../../types/property'
import classes from './PropertyCard.module.css'

export interface PropertyCardProps {
	property: PropertyPreview
	rating: DealRating
	isFavorite?: boolean
	isCompared?: boolean
	onToggleFavorite?: (id: string) => void
	onToggleCompare?: (id: string) => void
	onShowMap?: (property: PropertyPreview) => void
}

function formatPrice(price: number): string {
	return new Intl.NumberFormat('ru-RU').format(price)
}

function getRatingClassName(level: string): string {
	switch (level) {
		case 'low':
			return classes.ratingLow
		case 'medium':
			return classes.ratingMedium
		case 'high':
			return classes.ratingHigh
		default:
			return ''
	}
}

export function PropertyCard({
	property,
	rating,
	isFavorite = false,
	isCompared = false,
	onToggleFavorite,
	onToggleCompare,
	onShowMap,
}: PropertyCardProps) {
	const pricePerMeter = Math.round(property.price / property.total_area)
	const imageUrl = property.images?.[0]

	return (
		<Card withBorder padding={0} style={{ display: 'flex', flexDirection: 'row', overflow: 'hidden' }}>
			{/* Фото */}
			<Box
				w={280}
				style={{
					position: 'relative',
					flexShrink: 0,
					minHeight: 220,
					background: 'var(--mantine-color-gray-1)',
				}}
			>
				{imageUrl ? (
					<Image src={imageUrl} alt={property.title} h='100%' fit='cover' />
				) : (
					<div className={classes.imagePlaceholder}>
						<IconPhoto size={48} stroke={1} />
					</div>
				)}
			</Box>

			{/* Контент карточки */}
			<Stack gap='xs' p='md' style={{ flex: 1, minWidth: 0 }}>
				<Group justify='space-between' align='flex-start' gap='sm' wrap='nowrap'>
					<Box style={{ flex: 1, minWidth: 0 }}>
						<Text fw={600} size='lg' truncate='end'>
							{property.title}
						</Text>
						<Text c='dimmed' size='sm' truncate='end'>
							<IconMapPin size={14} stroke={1.5} style={{ verticalAlign: -2, marginRight: 4 }} />
							{property.address}
						</Text>
					</Box>
					<Box style={{ flexShrink: 0, textAlign: 'right' }}>
						<Text fw={700} size='xl' style={{ whiteSpace: 'nowrap' }}>
							{formatPrice(property.price)} ₽
						</Text>
						<Text c='dimmed' size='sm' style={{ whiteSpace: 'nowrap' }}>
							{formatPrice(pricePerMeter)} ₽/м²
						</Text>
					</Box>
				</Group>

				{/* Рейтинг */}
				<div className={`${classes.ratingBadge} ${getRatingClassName(rating.level)}`}>
					<span className={classes.ratingDot} />
					{rating.label}
				</div>

				{/* Описание */}
				{property.description && (
					<Text
						size='sm'
						c='dimmed'
						style={{
							display: '-webkit-box',
							WebkitLineClamp: 2,
							WebkitBoxOrient: 'vertical',
							overflow: 'hidden',
							lineHeight: 1.5,
						}}
					>
						{property.description}
					</Text>
				)}

				{/* Мета информация */}
				<Group gap='xs' mt='auto'>
					<Badge variant='light' color='gray' size='sm' leftSection={<IconBuildingSkyscraper size={12} stroke={1.5} />}>
						{property.rooms}-комн., {property.total_area} м²
					</Badge>
					<Badge variant='light' color='gray' size='sm'>
						эт. {property.floor}/{property.total_floors}
					</Badge>
					<Badge variant='light' color='gray' size='sm'>
						{property.property_type}
					</Badge>
				</Group>
			</Stack>

			{/* Действия */}
			<Stack
				justify='center'
				gap='xs'
				p='md'
				style={{
					borderLeft: '1px solid var(--mantine-color-gray-3)',
					flexShrink: 0,
				}}
			>
				<Tooltip label={isFavorite ? 'Убрать из избранного' : 'Добавить в избранное'}>
					<ActionIcon
						variant={isFavorite ? 'filled' : 'default'}
						color={isFavorite ? 'red' : 'gray'}
						size='lg'
						onClick={() => onToggleFavorite?.(property.id)}
						aria-label={isFavorite ? 'Убрать из избранного' : 'Добавить в избранное'}
					>
						{isFavorite ? <IconHeartFilled size={18} /> : <IconHeart size={18} />}
					</ActionIcon>
				</Tooltip>

				<Tooltip label='Открыть на карте'>
					<ActionIcon variant='default' size='lg' onClick={() => onShowMap?.(property)} aria-label='Открыть на карте'>
						<IconMapPin size={18} />
					</ActionIcon>
				</Tooltip>

				<Tooltip label={isCompared ? 'Убрать из сравнения' : 'Добавить к сравнению'}>
					<ActionIcon
						variant={isCompared ? 'filled' : 'default'}
						color={isCompared ? 'violet' : 'gray'}
						size='lg'
						onClick={() => onToggleCompare?.(property.id)}
						aria-label={isCompared ? 'Убрать из сравнения' : 'Добавить к сравнению'}
					>
						<IconGitCompare size={18} />
					</ActionIcon>
				</Tooltip>
			</Stack>
		</Card>
	)
}
