import { Paper, Text, Container, Box, Group } from '@mantine/core'
import { IconShieldCheck, IconFileCheck, IconBooks } from '@tabler/icons-react'
import classes from './KeyFeatures.module.css'

export default function KeyFeatures() {
	return (
		<Box className={classes.bg}>
			<section className={classes.section}>
				<Container size='lg'>
					<Box className={classes.header}>
						<Text size='xl' className={classes.title}>
							Ключевые возможности
						</Text>
						<Text size='lg' className={classes.subtitle}>
							Современные технологии для безопасной сделки с недвижимостью <br />и проверки объектов перед покупкой
						</Text>
					</Box>

					<Box className={classes.cards}>
						<Paper className={classes.card}>
							<Group gap={16} className={classes.cardBody}>
								<Box className={classes.iconCircleGreen}>
									<IconShieldCheck size={32} className={classes.icon} />
								</Box>
								<Box>
									<Text size='lg' className={classes.cardTitle}>
										Проверка рисков
									</Text>
									<Text size='sm' className={classes.cardDescription}>
										Автоматический анализ объекта на наличие <br />
										обременений, арестов и других рисков <br />в считанные секунды
									</Text>
								</Box>
							</Group>
						</Paper>

						<Paper className={classes.card}>
							<Group gap={16} className={classes.cardBody}>
								<Box className={classes.iconCircleTeal}>
									<IconFileCheck size={32} className={classes.icon} />
								</Box>
								<Box>
									<Text size='lg' className={classes.cardTitle}>
										Сопровождение сделки
									</Text>
									<Text size='sm' className={classes.cardDescription}>
										Чек-листы, существенные условия договоров <br />
										и ответы на частые вопросы по сделкам <br />с недвижимостью
									</Text>
								</Box>
							</Group>
						</Paper>

						<Paper className={classes.card}>
							<Group gap={16} className={classes.cardBody}>
								<Box className={classes.iconCircleDarkGreen}>
									<IconBooks size={32} className={classes.icon} />
								</Box>
								<Box>
									<Text size='lg' className={classes.cardTitle}>
										База знаний
									</Text>
									<Text size='sm' className={classes.cardDescription}>
										Актуальная информация по правовым вопросам <br />
										недвижимости с пошаговыми инструкциями <br />и комментариями экспертов
									</Text>
								</Box>
							</Group>
						</Paper>
					</Box>
				</Container>
			</section>
		</Box>
	)
}
