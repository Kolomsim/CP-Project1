import { useState } from 'react'
import { Anchor, Button, Card, Group, SimpleGrid, Stack, Text, TextInput, Title } from '@mantine/core'
import { IconSearch } from '@tabler/icons-react'

const popularLaws = {
	codes: {
		title: 'Кодексы РФ',
		items: [
			'Гражданский кодекс (Часть 2)',
			'Жилищный кодекс РФ',
			'Семейный кодекс (Маткапитал)',
			'Жилищный кодекс РФ (Актуальный)',
			'ФЗ №218 «О гос.регистрации...»',
		],
	},
	analytics: {
		title: 'Авторские материалы и аналитика',
		items: ['Обзоры судебной практики', 'Типичные ошибки при сделках'],
	},
}

const popularReviews = {
	documents: [
		'Договор купли-продажи (ДКП)',
		'Шаблоны документов',
		'Расписка в получении средств',
		'Договор с риелтором',
	],
	articles: [
		'Риски приватизации: как не потерять квартиру из-за «скрытых» жильцов.',
		'Банкротство продавца: чек-лист проверки перед передачей денег.',
		'Покупка квартиры с маткапиталом: выделение доли детей.',
	],
}

function LinkList({ items }: { items: string[] }) {
	return (
		<Stack gap='sm'>
			{items.map(item => (
				<Anchor key={item} size='sm' underline='hover'>
					{item}
				</Anchor>
			))}
		</Stack>
	)
}

function CategoryCard({ title, items }: { title: string; items: string[] }) {
	return (
		<Card withBorder padding='lg' h='100%'>
			<Stack gap='md'>
				<Text fw={600}>{title}</Text>
				<LinkList items={items} />
			</Stack>
		</Card>
	)
}

export default function KbPage() {
	const [query, setQuery] = useState('')

	return (
		<Stack gap='xl'>
			<Group align='flex-end' wrap='nowrap'>
				<TextInput
					flex={1}
					size='md'
					placeholder='Поиск по статьям, кодексам, законам...'
					value={query}
					onChange={event => setQuery(event.currentTarget.value)}
					leftSection={<IconSearch size={18} stroke={1.5} />}
				/>
				<Button size='md'>Найти</Button>
			</Group>

			<Stack gap='md'>
				<Title order={2}>Популярные законы и статьи:</Title>
				<SimpleGrid cols={{ base: 1, sm: 2 }}>
					<CategoryCard title={popularLaws.codes.title} items={popularLaws.codes.items} />
					<CategoryCard title={popularLaws.analytics.title} items={popularLaws.analytics.items} />
				</SimpleGrid>
			</Stack>

			<Stack gap='md'>
				<Title order={2}>Популярные разборы от юристов:</Title>
				<SimpleGrid cols={{ base: 1, sm: 2 }}>
					<Card withBorder padding='lg' h='100%'>
						<LinkList items={popularReviews.documents} />
					</Card>
					<Card withBorder padding='lg' h='100%'>
						<Stack gap='md'>
							{popularReviews.articles.map(article => (
								<Anchor key={article} size='sm' underline='hover'>
									{article}
								</Anchor>
							))}
						</Stack>
					</Card>
				</SimpleGrid>
			</Stack>
		</Stack>
	)
}
