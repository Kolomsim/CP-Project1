import { Link } from 'react-router'
import { Anchor, Card, Group, Stack, Text } from '@mantine/core'
import { IconArrowRight } from '@tabler/icons-react'
import classes from './NewsCard.module.css'

export interface NewsItem {
	id: string
	title: string
	preview: string
	author: string | null
	createdAt: string
	slug: string
}

export interface NewsCardProps {
	item: NewsItem
}

export function NewsCard({ item }: NewsCardProps) {
	return (
		<Card withBorder padding='lg' className={classes.card}>
			<Stack gap='xs'>
				<Text fw={600} size='lg'>
					{item.title}
				</Text>
				<Text c='dimmed' size='sm' lineClamp={3}>
					{item.preview}
				</Text>
				<Group justify='space-between' align='center' mt='xs'>
					<Group gap='xs'>
						{item.author && (
							<Text size='xs' c='dimmed'>
								{item.author}
							</Text>
						)}
						<Text size='xs' c='dimmed'>
							{new Date(item.createdAt).toLocaleDateString('ru-RU')}
						</Text>
					</Group>
					<Anchor component={Link} to={`/kb/${item.slug}`} size='sm'>
						<Group gap={4}>
							Читать далее
							<IconArrowRight size={14} stroke={1.5} />
						</Group>
					</Anchor>
				</Group>
			</Stack>
		</Card>
	)
}
