import { Stack, Group, Text, Container, Box } from '@mantine/core'
import { IconSearch, IconAnalyze, IconFileDescription } from '@tabler/icons-react'
import classes from './HowItWorks.module.css'

export default function HowItWorks() {
	return (
		<section className={classes.section}>
			<Container size='lg'>
				<Box className={classes.header}>
					<Text size='xl' className={classes.title}>
						Как это работает
					</Text>
					<Box h={12} />
					<Text size='md' className={classes.subtitle}>
						Простой процесс из трех шагов
					</Text>
				</Box>

				<Box h={80} />

				<Box className={classes.stepsWrapper}>
					<Group gap={60} justify='center' className={classes.steps}>
						<Stack gap={24} align='center' className={classes.step}>
							<Box className={classes.circleGreen}>
								<IconSearch size={36} className={classes.icon} />
							</Box>
							<Text size='lg' className={classes.stepTitle}>
								1. Укажите объект
							</Text>
							<Text size='sm' className={classes.description}>
								Вставьте ссылку на объявление с ЦИАН <br />
								или введите адрес интересующей недвижимости
							</Text>
						</Stack>

						<Stack gap={24} align='center' className={classes.step}>
							<Box className={classes.circleTeal}>
								<IconAnalyze size={36} className={classes.icon} />
							</Box>
							<Text size='lg' className={classes.stepTitle}>
								2. Мгновенная проверка
							</Text>
							<Text size='sm' className={classes.description}>
								ИИ анализирует данные из открытых источников <br />и выявляет потенциальные риски по объекту
							</Text>
						</Stack>

						<Stack gap={24} align='center' className={classes.step}>
							<Box className={classes.circleDarkGreen}>
								<IconFileDescription size={36} className={classes.icon} />
							</Box>
							<Text size='lg' className={classes.stepTitle}>
								3. Получите отчёт
							</Text>
							<Text size='sm' className={classes.description}>
								Детальный отчёт с рекомендациями <br />и ссылками на статьи юристов
							</Text>
						</Stack>
					</Group>
				</Box>
			</Container>
		</section>
	)
}
