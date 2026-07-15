// FAQAccordion.tsx
import { useState } from 'react'
import { Accordion, Text, Box } from '@mantine/core'
import { IconChevronRight } from '@tabler/icons-react'
import { accordionItems } from './faqData'

export default function FAQAccordion() {
	const [activeKey, setActiveKey] = useState<string | null>(null)

	const handleChange = (value: string | null) => {
		setActiveKey(value)
	}

	const items = accordionItems.map(item => ({
		value: item.id,
		control: (
			<Box style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
				{item.icon && (
					<Box
						style={{
							color: activeKey === item.id ? 'var(--sc-accent)' : 'var(--sc-muted)',
							fontSize: '18px',
							transition: 'color 0.3s ease',
						}}
					>
						{item.icon}
					</Box>
				)}
				<Text
					size='sm'
					style={{
						fontWeight: 500,
						color: activeKey === item.id ? 'var(--sc-accent)' : 'var(--sc-ink)',
						transition: 'color 0.3s ease',
					}}
				>
					{item.question}
				</Text>
			</Box>
		),
		panel: (
			<Text
				size='sm'
				style={{
					color: 'var(--sc-muted)',
					lineHeight: 1.7,
					whiteSpace: 'pre-line',
				}}
			>
				{item.answer}
			</Text>
		),
	}))

	return (
		<Box>
			<Accordion
				value={activeKey}
				onChange={handleChange}
				chevron={<IconChevronRight size={16} />}
				chevronPosition='right'
				variant='contained'
				styles={{
					item: {
						background: 'white',
						borderRadius: '12px',
						marginBottom: '16px',
						border: activeKey ? '1px solid var(--sc-accent)' : '1px solid var(--sc-border)',
						boxShadow: activeKey ? '0 8px 25px rgba(47, 158, 102, 0.15)' : '0 2px 12px rgba(0,0,0,0.06)',
						transition: 'all 0.3s ease',
					},
					control: {
						borderRadius: '12px',
					},
					chevron: {
						color: activeKey ? 'var(--sc-accent)' : 'var(--sc-muted)',
						transition: 'all 0.3s ease',
					},
				}}
			>
				{items.map(item => (
					<Accordion.Item key={item.value} value={item.value}>
						<Accordion.Control>{item.control}</Accordion.Control>
						<Accordion.Panel>{item.panel}</Accordion.Panel>
					</Accordion.Item>
				))}
			</Accordion>
			<Box h={32} />
		</Box>
	)
}
