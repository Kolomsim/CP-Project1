import { Card, Group, Stack, Text, Image } from '@mantine/core'
import { IconPhoto, IconArrowUp, IconArrowDown, IconMinus } from '@tabler/icons-react'
import type { PropertyPreview, DealRating } from '../../types/property'
import { formatPrice, getRatingClassName } from '../../utils/format'
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

const ratingClassMap: Record<string, string> = {
	ratingGreen: classes.ratingLow,
	ratingYellow: classes.ratingMedium,
	ratingRed: classes.ratingHigh,
}

function getArrowIcon(comparison: ComparisonResult, side: 'left' | 'right') {
	if (comparison.winner === 'tie') {
		return <IconMinus size={16} className={classes.neutral} />
	}
	if ((side === 'left' && comparison.winner === 'left') || (side === 'right' && comparison.winner === 'right')) {
		return <IconArrowUp size={16} className={classes.arrowUp} />
	}
	return <IconArrowDown size={16} className={classes.arrowDown} />
}

function getValueClass(comparison: ComparisonResult, side: 'left' | 'right'): string {
	if (comparison.winner === 'tie') return classes.comparisonValue
	if ((side === 'left' && comparison.winner === 'left') || (side === 'right' && comparison.winner === 'right')) {
		return classes.comparisonWinner
	}
	return classes.comparisonLoser
}

export function ComparisonCard({ property, rating, side, comparisons }: ComparisonCardProps) {
	const imageUrl = property.images?.[0]

	return (
		<Card withBorder className={classes.card} padding='md' style={{ height: '100%' }}>
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

			<Stack gap='xs' mt='md' style={{ flex: 1 }}>
				{/* Title & Price */}
				<Text fw={700} size='lg'>
					{property.title}
				</Text>
				<Text fw={700} size='xl' c='brand'>
					{formatPrice(property.price)} ₽
				</Text>
				<Text size='sm' c='dimmed'>
					{formatPrice(Math.round(property.price / property.total_area))} ₽/м²
				</Text>

				{/* Address — фиксированная высота 2 строки */}
				<Text
					size='sm'
					c='dimmed'
					style={{
						minHeight: '2.5em',
						display: '-webkit-box',
						WebkitLineClamp: 2,
						WebkitBoxOrient: 'vertical',
						overflow: 'hidden',
						lineHeight: 1.25,
					}}
				>
					{property.address}
				</Text>

				{/* Rating */}
				<div className={`${classes.ratingBadge} ${getRatingClassName(rating.level, ratingClassMap)}`}>
					<span className={classes.ratingDot} />
					{rating.label}
				</div>

				{/* Description — растягивается под самый длинный */}
				{property.description && (
					<Text size='sm' c='dimmed' style={{ flex: 1, lineHeight: 1.5 }}>
						{property.description}
					</Text>
				)}

				{/* Comparison Rows */}
				<Stack gap={0} mt='sm'>
					{comparisons.map(comp => (
						<div key={comp.label} className={classes.comparisonRow}>
							<Text className={classes.comparisonLabel}>{comp.label}</Text>
							<Group gap={4} justify='center' style={{ flex: 1 }}>
								<Text className={getValueClass(comp, side)}>{side === 'left' ? comp.leftValue : comp.rightValue}</Text>
								{getArrowIcon(comp, side)}
							</Group>
						</div>
					))}
				</Stack>

				{/* Platform */}
				<Text size='xs' c='dimmed' mt='xs'>
					Платформа: {property.platform}
				</Text>
			</Stack>
		</Card>
	)
}
