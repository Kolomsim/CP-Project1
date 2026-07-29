import { Divider, Text, Title, Box } from '@mantine/core'

interface FAQHeaderProps {
	title: string
	subtitle?: string
	showDivider?: boolean
}

export default function FAQHeader({ title, subtitle, showDivider = true }: FAQHeaderProps) {
	return (
		<Box style={{ textAlign: 'center', marginBottom: '48px' }}>
			<Title
				order={2}
				style={{
					fontWeight: 600,
					color: 'transparent',
					background: 'linear-gradient(135deg, var(--sc-accent) 0%, var(--sc-accent-deep) 100%)',
					WebkitBackgroundClip: 'text',
					backgroundClip: 'text',
					fontSize: 'clamp(1.8rem, 4vw, 2.5rem)',
					letterSpacing: '-0.02em',
					marginBottom: subtitle ? '16px' : '0',
				}}
			>
				{title}
			</Title>

			{subtitle && (
				<>
					<Text
						size='sm'
						style={{
							color: 'var(--sc-muted)',
							maxWidth: '600px',
							margin: '0 auto',
							lineHeight: 1.6,
						}}
					>
						{subtitle}
					</Text>
					<Box h={8} />
				</>
			)}

			{showDivider && (
				<>
					<Box h={24} />
					<Divider style={{ margin: 0 }} />
					<Box h={24} />
				</>
			)}
		</Box>
	)
}
