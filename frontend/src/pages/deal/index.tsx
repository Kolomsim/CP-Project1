import { Button, Container, List, Text, ThemeIcon, Title } from '@mantine/core'
import classes from './HeroContentLeft.module.css'
import { IconCheck } from '@tabler/icons-react'
import { Link } from 'react-router'

export default function DealPage() {
	return (
		<div className={classes.hero}>
			<Container className={classes.container} size='lg'>
				<Title className={classes.title} order={3} size='h4' mb='sm' mt='xl' fw='medium' ta='center'>
					Заполните форму для релевантной проверки
				</Title>
				<Text className={classes.description} size='xl' mt='xl' mb='xl'>
					Узнайте о скрытых рисках недвижимости за 5 минут Ответьте на несколько вопросов о планируемой сделке. Наш
					алгоритм проанализирует вашу ситуацию, учтет данные ведомств и сформирует персональный отчет:
				</Text>
				<List
					spacing='xs'
					size='sm'
					mb='xl'
					center
					icon={
						<ThemeIcon color='blue' size={20} radius='xl'>
							<IconCheck size={12} stroke={1.5} />
						</ThemeIcon>
					}
				>
					<List.Item>Карта рисков: проверка на скрытых жильцов, маткапитал, суды и долги продавца.</List.Item>
					<List.Item>Экологический радар: разметка промзон, свалок и шумных дорог вокруг объекта.</List.Item>
					<List.Item>Пошаговый чек-лист: индивидуальный список документов именно для вашей сделки.</List.Item>
				</List>

				<Button variant='solid' size='xl' radius='md' component={Link} to='/deal/deal_form'>
					Начать
				</Button>

			</Container>
		</div>
	)
}
