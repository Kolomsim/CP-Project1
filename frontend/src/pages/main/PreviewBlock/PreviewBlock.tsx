import { Group, Stack, Paper, Text, Container, Button, Box } from '@mantine/core'
import { Link } from 'react-router'
import { IconCircleCheck, IconShieldCheck, IconBooks } from '@tabler/icons-react'
import classes from './PreviewBlock.module.css'

export default function PreviewBlock() {
	return (
		<Box
			style={{
				background: 'linear-gradient(135deg, var(--sc-mint) 0%, var(--sc-mint-soft) 100%)',
				padding: '80px 40px',
				fontFamily: 'system-ui, -apple-system, sans-serif',
			}}
		>
			<Container size='lg'>
				<Box
					style={{
						maxWidth: 1600,
						margin: '0 auto',
						display: 'flex',
						justifyContent: 'space-between',
						alignItems: 'center',
						gap: 100,
					}}
				>
					<Stack gap={32} style={{ flex: 1, maxWidth: 600 }}>
						<Group gap={16} mb={8}>
							<IconShieldCheck size={32} style={{ color: 'var(--sc-accent)' }} />
							<Text size='xl' fw={800} style={{ color: 'var(--sc-ink)' }}>
								SmartCheck
							</Text>
						</Group>

						<Text
							size='md'
							style={{
								fontFamily: "'Dela Gothic One', sans-serif",
								fontWeight: 400,
								fontSize: 18,
								color: 'var(--sc-accent)',
								lineHeight: 1.5,
								letterSpacing: '0.01em',
								width: 371,
							}}
						>
							Сервис анализа рисков при покупке недвижимости
						</Text>

						<Group gap={16}>
							<Button
								component={Link}
								to='/deal/deal_form'
								size='lg'
								leftSection={<IconShieldCheck size={20} />}
								style={{
									background: 'var(--sc-accent)',
									border: 'none',
									height: 64,
									padding: '0 48px',
									color: 'white',
									fontSize: 18,
									fontWeight: 600,
									boxShadow: '0 10px 25px -5px rgba(47, 158, 102, 0.4)',
									transition: 'all 0.25s',
									cursor: 'pointer',
								}}
							>
								Проверить объект
							</Button>
							<Button
								component={Link}
								to='/kb'
								size='lg'
								variant='outline'
								leftSection={<IconBooks size={20} />}
								style={{
									background: 'transparent',
									color: 'var(--sc-accent)',
									height: 64,
									padding: '0 48px',
									fontSize: 18,
									fontWeight: 600,
									transition: 'all 0.25s',
									cursor: 'pointer',
								}}
							>
								База знаний
							</Button>
						</Group>
					</Stack>

					<Paper className={classes.resultCard} p={0}>
						<Box className={classes.badgeGlass}>
							<IconShieldCheck size={14} style={{ marginRight: 4 }} />
							<span>Риск: низкий</span>
						</Box>

						<Box className={classes.imageWrapper}>
							<Box className={classes.resultPlaceholder}>
								<IconShieldCheck size={64} style={{ color: 'var(--sc-mint)', opacity: 0.5 }} />
								<Text size='sm' c='dimmed' mt='sm'>
									Пример отчёта по объекту
								</Text>
							</Box>

							<Box className={classes.confidenceGlass}>Проверка завершена</Box>
						</Box>

						<Box className={classes.footerGlass}>
							<Group gap={8}>
								<IconCircleCheck style={{ color: '#2f9e66', width: 18, height: 18 }} />
								<Text size='sm'>Объект проверен</Text>
							</Group>

							<Button variant='subtle' size='sm'>
								Подробнее
							</Button>
						</Box>
					</Paper>
				</Box>
			</Container>
		</Box>
	)
}
