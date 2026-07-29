import { Paper, Container } from '@mantine/core'
import type { ReactNode } from 'react'

interface FAQContainerProps {
	children: ReactNode
}

export default function FAQContainer({ children }: FAQContainerProps) {
	return (
		<Container size='lg'>
			<Paper
				p='xl'
				style={{
					backgroundColor: 'var(--sc-mint-soft)',
					padding: '40px 20px',
					borderRadius: '16px',
					minHeight: '600px',
					boxShadow: '0 10px 40px rgba(0,0,0,0.08)',
					background: 'linear-gradient(135deg, var(--sc-mint-soft) 0%, var(--sc-surface) 100%)',
					border: '1px solid var(--sc-border)',
					margin: '20px 0',
				}}
			>
				{children}
			</Paper>
		</Container>
	)
}
