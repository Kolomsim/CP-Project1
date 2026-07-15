import { Text, Container, Box, Button } from '@mantine/core'
import { IconShieldCheck, IconBooks } from '@tabler/icons-react'
import classes from './ReadyBlock.module.css'

export default function HeroCTA() {
	return (
		<section className={classes.section}>
			<Container size='lg'>
				<Box className={classes.wrapper}>
					<Text size='xl' className={classes.title}>
						Готовы проверить недвижимость?
					</Text>
					<Box h={16} />

					<Text size='md' className={classes.subtitle}>
						Узнайте о рисках до покупки — сэкономьте время и деньги
					</Text>

					<Box h={8} />

					<Box className={classes.buttons}>
						<Button className={classes.buttonPrimary} size='lg' leftSection={<IconShieldCheck size={20} />}>
							Проверить объект
						</Button>

						<Button
							className={classes.buttonSecondary}
							size='lg'
							variant='outline'
							leftSection={<IconBooks size={20} />}
						>
							База знаний
						</Button>
					</Box>
				</Box>
			</Container>
		</section>
	)
}
