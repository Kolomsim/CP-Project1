import { Group, Stack, Text, Container, Button, Box } from '@mantine/core'
import { Link } from 'react-router'
import { IconShieldCheck, IconBooks } from '@tabler/icons-react'

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
				<Stack gap={32} style={{ maxWidth: 720, margin: '0 auto', alignItems: 'center', textAlign: 'center' }}>
					<Group gap={16} mb={8} justify='center'>
						<IconShieldCheck size={40} style={{ color: 'var(--sc-accent)' }} />
						<Text style={{ color: 'var(--sc-ink)', fontSize: 32, fontWeight: 800 }}>СмартЧек</Text>
					</Group>

					<Text
						style={{
							fontFamily: "'Dela Gothic One', sans-serif",
							fontWeight: 400,
							fontSize: 20,
							color: 'var(--sc-ink)',
							lineHeight: 1.55,
							letterSpacing: '0.01em',
							maxWidth: 640,
						}}
					>
						СмартЧек — помогаем найти скрытые риски в сделках с недвижимостью. Проверьте объект, продавца и
						документы за короткий срок. Безопасная покупка начинается здесь.
					</Text>

					<Group gap={16} justify='center'>
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
			</Container>
		</Box>
	)
}
