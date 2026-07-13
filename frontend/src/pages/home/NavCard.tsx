import { Link } from 'react-router'
import { Card, Group, Text } from '@mantine/core'
import classes from './NavCard.module.css'

export interface NavCardProps {
	title: string
	to: string
	description: string
	icon: React.ComponentType<{ size?: number; stroke?: number }>
}

export function NavCard({ title, to, description, icon: Icon }: NavCardProps) {
	return (
		<Card component={Link} to={to} withBorder padding='lg' className={classes.card}>
			<Card.Section withBorder inheritPadding py='md' className={classes.section}>
				<Group gap='md'>
					<div className={classes.iconWrapper}>
						<Icon size={28} stroke={1.5} />
					</div>
					<Text fw={600} size='lg'>
						{title}
					</Text>
				</Group>
			</Card.Section>
			<div className={classes.body}>
				<Text c='dimmed' size='md' mt='md'>
					{description}
				</Text>
			</div>
		</Card>
	)
}
