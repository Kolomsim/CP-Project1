import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Alert, Button, Container, Paper, Select, Stack, Title } from '@mantine/core'
import { IconAlertCircle } from '@tabler/icons-react'
import { saveBuyerInfo } from '../../../api/deal'
import { clearDealSession, saveDealBuyerCitizenship, setDealSessionId } from '../../../lib/dealSession'

const citizenshipData = [
	{ value: 'russian', label: 'Российская Федерация' },
	{ value: 'foreign', label: 'Иностранное гражданство' },
]

const purchaseMethodData = [
	{ value: 'full_payment', label: '100% оплата (собственные средства)' },
	{ value: 'mortgage', label: 'Ипотека' },
	{ value: 'mat_capital', label: 'Материнский капитал' },
]

const containedInputStyles = {
	root: {
		position: 'relative' as const,
	},
	input: {
		height: 54,
		paddingTop: 18,
	},
	label: {
		position: 'absolute' as const,
		pointerEvents: 'none' as const,
		fontSize: 11,
		paddingLeft: 12,
		paddingTop: 6,
		zIndex: 1,
	},
}

export default function DealFormPage() {
	const navigate = useNavigate()
	const [citizenship, setCitizenship] = useState<string | null>(null)
	const [purchaseMethod, setPurchaseMethod] = useState<string | null>(null)
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const missingFields = [
		!citizenship && 'гражданство',
		!purchaseMethod && 'способ покупки',
	].filter(Boolean) as string[]

	const handleSubmit = async () => {
		if (missingFields.length > 0) {
			setError(`Заполните все поля: ${missingFields.join(', ')}.`)
			return
		}

		setLoading(true)
		setError(null)

		try {
			clearDealSession()
			const sessionId = await saveBuyerInfo({
				citizenship: citizenship!,
				purchaseMethod: purchaseMethod!,
			})
			setDealSessionId(sessionId)
			saveDealBuyerCitizenship(citizenship!)
			navigate('/deal/deal_object')
		} catch (err) {
			if (err instanceof TypeError || (err instanceof Error && err.message.includes('fetch'))) {
				setError('Не удалось связаться с сервером. Убедитесь, что бэкенд запущен на порту 8000.')
				return
			}

			setError(err instanceof Error ? err.message : 'Не удалось сохранить данные.')
		} finally {
			setLoading(false)
		}
	}

	return (
		<Container size='sm' py='xl'>
			<Paper withBorder p='xl' radius='md' shadow='sm'>
				<Title order={2} mb='xl' ta='center'>
					Анкета покупателя
				</Title>

				<Stack gap='md'>
					<Select
						label='Гражданство'
						placeholder='Выберите гражданство'
						data={citizenshipData}
						value={citizenship}
						onChange={value => setCitizenship(value)}
						styles={containedInputStyles}
					/>

					<Select
						label='Способ покупки недвижимости'
						placeholder='Выберите вариант финансирования'
						data={purchaseMethodData}
						value={purchaseMethod}
						onChange={value => setPurchaseMethod(value)}
						styles={containedInputStyles}
					/>

					{error && (
						<Alert icon={<IconAlertCircle size={16} />} color='red' variant='light' title='Ошибка'>
							{error}
						</Alert>
					)}

					<Button fullWidth size='md' mt='xl' onClick={() => void handleSubmit()} loading={loading}>
						Продолжить
					</Button>
				</Stack>
			</Paper>
		</Container>
	)
}
