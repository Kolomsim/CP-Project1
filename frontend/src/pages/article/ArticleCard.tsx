import { Link } from 'react-router'
import { Anchor, Badge, Card, Group, Stack, Text } from '@mantine/core'
import type { ArticleItem } from '../../api/articles'
import classes from './ArticleCard.module.css'

type ArticleCardProps = {
	article: ArticleItem
}

export default function ArticleCard({ article }: ArticleCardProps) {
	const actualDate = new Date(article.updated_at).toLocaleDateString('ru-RU')

	return (
		<Anchor component={Link} to={`/kb/${article.id}`} underline='never' c='inherit' style={{ textDecoration: 'none' }}>
			<Card withBorder padding='md' component='div' className={classes.card}>
				<Stack gap='xs'>
					{article.category && (
						<Badge variant='light' color='brand' size='sm' w='fit-content'>
							{article.category}
						</Badge>
					)}

					<Text fw={600} lineClamp={2}>
						{article.title}
					</Text>

					{article.preview && (
						<Text size='sm' c='dimmed' lineClamp={2}>
							{article.preview}
						</Text>
					)}

					<Group gap='xs' justify='space-between' mt='xs' wrap='nowrap'>
						{article.author && (
							<Text size='xs' c='dimmed' lineClamp={1}>
								{article.author.name}
							</Text>
						)}
						<Text size='xs' c='dimmed' style={{ flexShrink: 0 }}>
							актуально на {actualDate}
						</Text>
					</Group>
				</Stack>
			</Card>
		</Anchor>
	)
}
