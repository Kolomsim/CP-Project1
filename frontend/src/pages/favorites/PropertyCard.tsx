import { ActionIcon, Badge, Box, Card, Group, Loader, Stack, Text, Tooltip } from '@mantine/core'
import { IconBuildingSkyscraper, IconHeart, IconHeartFilled, IconMapPin, IconReload } from '@tabler/icons-react'
import type { PropertyPreview, DealRating } from '../../types/property'
import { formatPrice, getRatingClassName } from '../../utils/format'
import classes from './PropertyCard.module.css'

export interface PropertyCardProps {
	property: PropertyPreview
	rating: DealRating
	isFavorite?: boolean
	onToggleFavorite?: (id: string) => void
	onShowMap?: (property: PropertyPreview) => void
	onRefresh?: () => void
	isRefreshing?: boolean
}

function stopPropagation(fn: (...args: never[]) => void, ...args: Parameters<typeof fn>) {
	return (e: React.MouseEvent) => {
		e.stopPropagation()
		fn(...args)
	}
}

const ratingClassMap: Record<string, string> = {
	ratingGreen: classes.ratingLow,
	ratingYellow: classes.ratingMedium,
	ratingRed: classes.ratingHigh,
}

export function PropertyCard({
	property,
	rating,
	isFavorite = false,
	onToggleFavorite,
	onShowMap,
	onRefresh,
	isRefreshing = false,
}: PropertyCardProps) {
	const pricePerMeter = Math.round(property.price / property.total_area)

	return (
		<Card
			withBorder
			padding={0}
			className={classes.card}
			style={{ display: 'flex', flexDirection: 'row', overflow: 'hidden' }}
		>
			{/* Иконка недвижимости */}
			<Box
				w={200}
				style={{
					position: 'relative',
					flexShrink: 0,
					minHeight: 220,
					background: 'var(--mantine-color-gray-1)',
				}}
			>
				<div className={classes.imagePlaceholder}>
					<IconBuildingSkyscraper size={64} stroke={1} className={classes.propertyIcon} />
				</div>
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
				<div className={`${classes.ratingBadge} ${getRatingClassName(rating.level, ratingClassMap)}`}>
					<span className={classes.ratingDot} />
					{rating.label}
				</div>

				{/* Мета информация */}
				<Group gap='xs' mt='auto'>
					<Badge variant='light' color='gray' size='sm'>
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
						onClick={stopPropagation(() => onToggleFavorite?.(property.id))}
						aria-label={isFavorite ? 'Убрать из избранного' : 'Добавить в избранное'}
					>
						{isFavorite ? <IconHeartFilled size={18} /> : <IconHeart size={18} />}
					</ActionIcon>
				</Tooltip>

				<Tooltip label='Открыть на карте'>
					<ActionIcon
						variant='default'
						size='lg'
						onClick={stopPropagation(() => onShowMap?.(property))}
						aria-label='Открыть на карте'
					>
						<IconMapPin size={18} />
					</ActionIcon>
				</Tooltip>

				<Tooltip label='Обновить данные с Циана'>
					<ActionIcon
						variant='default'
						size='lg'
						disabled={isRefreshing}
						onClick={stopPropagation(() => onRefresh?.())}
						aria-label='Обновить данные с Циана'
					>
						{isRefreshing ? <Loader size='xs' color='gray' /> : <IconReload size={18} />}
					</ActionIcon>
				</Tooltip>
			</Stack>
		</Card>
	)
}
