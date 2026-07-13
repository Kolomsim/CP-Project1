import { Link } from 'react-router'
import { Anchor, Badge, Card, Group, Stack, Text } from '@mantine/core'
import type { ArticleItem } from '../../api/articles'
import classes from './ArticleCard.module.css'

type ArticleCardProps = {
	article: ArticleItem
}

export default function ArticleCard({ article }: ArticleCardProps) {
	return (
		<Anchor component={Link} to={`/kb/${article.id}`} underline='never' c='inherit' style={{ textDecoration: 'none' }}>
			<Card withBorder padding='lg' h='100%' component='div' className={classes.card}>
				<Stack gap='sm'>
					<Group gap='xs'>
						{article.category && (
							<Badge variant='light' color='blue' size='sm'>
								{article.category}
							</Badge>
						)}
					</Group>
					<Text fw={600} lineClamp={2}>
						{article.title}
					</Text>
					{article.preview && (
						<Text size='sm' c='dimmed' lineClamp={3}>
							{article.preview}
						</Text>
					)}
					<Group gap='xs' justify='space-between'>
						{article.author && (
							<Text size='xs' c='dimmed'>
								{article.author.name}
							</Text>
						)}
						<Text size='xs' c='dimmed'>
							{new Date(article.created_at).toLocaleDateString('ru-RU')}
						</Text>
					</Group>
				</Stack>
			</Card>
		</Anchor>
	)
}
