import { Box, Card, Group, Stack, Text, Badge, Image } from '@mantine/core'
import {
	IconPhoto,
	IconArrowUp,
	IconArrowDown,
	IconMinus,
} from '@tabler/icons-react'
import type { PropertyPreview, DealRating } from '../../types/property'
import classes from './ComparisonCard.module.css'

export interface ComparisonCardProps {
	property: PropertyPreview
	rating: DealRating
	side: 'left' | 'right'
	comparisons: ComparisonResult[]
}

export interface ComparisonResult {
	label: string
	leftValue: string | number
	rightValue: string | number
	winner: 'left' | 'right' | 'tie'
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

function getArrowIcon(comparison: ComparisonResult, side: 'left' | 'right') {
	if (comparison.winner === 'tie') {
		return <IconMinus size={16} className={classes.neutral} />
	}
	if (
		(side === 'left' && comparison.winner === 'left') ||
		(side === 'right' && comparison.winner === 'right')
	) {
		return <IconArrowUp size={16} className={classes.arrowUp} />
	}
	return <IconArrowDown size={16} className={classes.arrowDown} />
}

function getValueClass(
	comparison: ComparisonResult,
	side: 'left' | 'right',
): string {
	if (comparison.winner === 'tie') return classes.comparisonValue
	if (
		(side === 'left' && comparison.winner === 'left') ||
		(side === 'right' && comparison.winner === 'right')
	) {
		return classes.comparisonWinner
	}
	return classes.comparisonLoser
}

export function ComparisonCard({
	property,
	rating,
	side,
	comparisons,
}: ComparisonCardProps) {
	const imageUrl = property.images?.[0]

	return (
		<Card withBorder className={classes.card} padding='md'>
			{/* Image */}
			<div className={classes.imageSection}>
				{imageUrl ? (
					<Image src={imageUrl} alt={property.title} h='100%' fit='cover' />
				) : (
					<div className={classes.imagePlaceholder}>
						<IconPhoto size={48} stroke={1} />
					</div>
				)}
			</div>

			<Stack gap='xs' mt='md'>
				{/* Title & Price */}
				<Text fw={700} size='lg'>
					{property.title}
				</Text>
				<Text fw={700} size='xl' c='violet'>
					{formatPrice(property.price)} ₽
				</Text>
				<Text size='sm' c='dimmed'>
					{formatPrice(Math.round(property.price / property.total_area))} ₽/м²
				</Text>

				{/* Address */}
				<Text size='sm' c='dimmed'>
					{property.address}
				</Text>

				{/* Rating */}
				<div
					className={`${classes.ratingBadge} ${getRatingClassName(rating.level)}`}
				>
					<span className={classes.ratingDot} />
					{rating.label}
				</div>

				{/* Description */}
				{property.description && (
					<Text size='sm' c='dimmed'>
						{property.description}
					</Text>
				)}

				{/* Comparison Rows */}
				<Stack gap={0} mt='sm'>
					{comparisons.map(comp => (
						<div key={comp.label} className={classes.comparisonRow}>
							<Text className={classes.comparisonLabel}>{comp.label}</Text>
							<Group gap={4} justify='center' style={{ flex: 1 }}>
								<Text className={getValueClass(comp, side)}>
									{side === 'left' ? comp.leftValue : comp.rightValue}
								</Text>
								{getArrowIcon(comp, side)}
							</Group>
						</div>
					))}
				</Stack>

				{/* Seller */}
				<Text size='xs' c='dimmed' mt='xs'>
					Продавец: {property.seller.name}
					{property.seller.phone && ` • ${property.seller.phone}`}
				</Text>
				<Text size='xs' c='dimmed'>
					Платформа: {property.platform}
				</Text>
			</Stack>
		</Card>
	)
}
