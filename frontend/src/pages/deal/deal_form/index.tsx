import { useState } from 'react'
import { Link } from 'react-router'
import { Button, Container, Paper, Select, Stack, Title } from '@mantine/core'
import { AppLayout } from '../../../components/AppLayout'

const citizenshipData = [
  { value: 'russian', label: 'Российская Федерация' },
  { value: 'foreign', label: 'Иностранное гражданство' },
  { value: 'none', label: 'Не имеет гражданства' },
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
  const [citizenship, setCitizenship] = useState<string | null>(null)
  const [maritalStatus, setMaritalStatus] = useState<string | null>(null)
  const [purchaseMethod, setPurchaseMethod] = useState<string | null>(null)

  const handleSubmit = () => {
    console.log('Данные формы:', { citizenship, maritalStatus, purchaseMethod })
  }

  return (
    <AppLayout>
      <Container size="sm" py="xl">
        <Paper withBorder p="xl" radius="md" shadow="sm">
          <Title order={2} mb="xl" ta="center">
            Анкета покупателя
          </Title>

          <Stack gap="md">
            <Select
              label="Гражданство"
              placeholder="Выберите гражданство"
              data={citizenshipData}
              value={citizenship}
              onChange={(value) => setCitizenship(value)}
              styles={containedInputStyles}
            />

            <Select
              label="Семейное положение"
              placeholder="Укажите статус"
              data={maritalStatusData}
              value={maritalStatus}
              onChange={(value) => setMaritalStatus(value)}
              styles={containedInputStyles}
            />

            <Select
              label="Способ покупки недвижимости"
              placeholder="Выберите вариант финансирования"
              data={purchaseMethodData}
              value={purchaseMethod}
              onChange={(value) => setPurchaseMethod(value)}
              styles={containedInputStyles}
            />

            <Button
              fullWidth
              size="md"
              mt="xl"
              component={Link}
              to="/deal/deal_object"
              onClick={handleSubmit}
              disabled={!citizenship || !maritalStatus || !purchaseMethod}
            >
              Продолжить
            </Button>
          </Stack>
        </Paper>
      </Container>
    </AppLayout>
  )
}
