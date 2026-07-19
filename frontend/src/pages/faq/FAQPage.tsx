import { Box } from '@mantine/core'
import FAQHeader from './FAQHeader'
import FAQAccordion from './FAQAccordion'
import FAQContainer from './FAQContainer'

export default function FAQPage() {
	return (
		<Box style={{ minHeight: '100vh', backgroundColor: 'var(--sc-page)' }}>
			<Box style={{ padding: '20px 0' }}>
				<FAQContainer>
					<FAQHeader
						title='Часто задаваемые вопросы'
						subtitle='Ответы на часто задаваемые вопросы о работе сервиса проверки недвижимости СмартЧек'
					/>

					<FAQAccordion />
				</FAQContainer>
			</Box>
		</Box>
	)
}
