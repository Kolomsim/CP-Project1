import { Anchor, Group, Skeleton, Stack, Text } from '@mantine/core'

export interface NewsItem {
	id: string | number
	title: string
	description: string
	imageUrl?: string
}

export interface NewsCardProps {
	item: NewsItem
}

export function NewsCard({ item }: NewsCardProps) {
	return (
		<Group align='flex-start' wrap='nowrap'>
			<Skeleton height={80} width={80} radius='md' />
			<Stack flex={1} gap='xs'>
				<Text fw={600}>{item.title}</Text>
				<Text c='dimmed' size='sm'>
					{item.description}
				</Text>
				<Group justify='flex-end'>
					<Anchor size='sm'>Читать подробнее...</Anchor>
				</Group>
			</Stack>
		</Group>
	)
}
