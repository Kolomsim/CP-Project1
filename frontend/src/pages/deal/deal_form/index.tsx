import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Alert, Button, Container, Paper, Select, Stack, Title } from '@mantine/core'
import { IconAlertCircle } from '@tabler/icons-react'
import { saveBuyerInfo } from '../../../api/deal'
import { clearDealSession, setDealSessionId } from '../../../lib/dealSession'

const citizenshipData = [
	{ value: 'russian', label: 'Российская Федерация' },
	{ value: 'foreign', label: 'Иностранное гражданство' },
]

const maritalStatusData = [
	{ value: 'single', label: 'Не женат/не замужем' },
	{ value: 'married', label: 'Женат/замужем' },
	{ value: 'divorced', label: 'Разведен/разведена' },
	{ value: 'widowed', label: 'Вдовец/вдова' },
	{ value: 'cohabitation', label: 'Гражданский брак' },
]

const purchaseMethodData = [
	{ value: 'full_payment', label: '100% оплата (собственные средства)' },
	{ value: 'mortgage', label: 'Ипотека' },
	{ value: 'installment', label: 'Рассрочка от застройщика' },
	{ value: 'mat_capital', label: 'Материнский капитал' },
	{ value: 'state_support', label: 'Государственная поддержка' },
	{ value: 'other', label: 'Другое' },
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
	const [maritalStatus, setMaritalStatus] = useState<string | null>(null)
	const [purchaseMethod, setPurchaseMethod] = useState<string | null>(null)
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const handleSubmit = async () => {
		if (!citizenship || !maritalStatus || !purchaseMethod) {
			return
		}

		setLoading(true)
		setError(null)

		try {
			clearDealSession()
			const sessionId = await saveBuyerInfo({
				citizenship,
				maritalStatus,
				purchaseMethod,
			})
			setDealSessionId(sessionId)
			navigate('/deal/deal_object')
		} catch (err) {
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
						label='Семейное положение'
						placeholder='Укажите статус'
						data={maritalStatusData}
						value={maritalStatus}
						onChange={value => setMaritalStatus(value)}
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

					<Button
						fullWidth
						size='md'
						mt='xl'
						onClick={() => void handleSubmit()}
						loading={loading}
						disabled={!citizenship || !maritalStatus || !purchaseMethod}
					>
						Продолжить
					</Button>
				</Stack>
			</Paper>
		</Container>
	)
}
