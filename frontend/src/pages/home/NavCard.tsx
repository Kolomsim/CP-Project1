import { Link } from 'react-router'
import { Card, Text } from '@mantine/core'

export interface NavCardProps {
	title: string
	to: string
	description: string
}

export function NavCard({ title, to, description }: NavCardProps) {
	return (
		<Card component={Link} to={to} withBorder padding='lg' mih={200}>
			<Card.Section withBorder inheritPadding py='md'>
				<Text fw={600} size='lg'>
					{title}
				</Text>
			</Card.Section>
			<Text c='dimmed' size='md' mt='md'>
				{description}
			</Text>
		</Card>
	)
}
