import { Badge, Stack, Text, Title } from '@mantine/core'
import { AppLayout } from '../../components/AppLayout'

export default function DealPage() {
  return (
    <AppLayout>
      <Stack align="center" gap="md" ta="center" py="xl">
        <Title order={1}>Сопровождение сделки</Title>
        <Text c="dimmed" maw={520}>
          Лендинг, многошаговая форма проверки, предпросмотр объекта, итоговый
          рейтинг и избранное.
        </Text>
        <Badge variant="light" color="violet" size="lg">
          Страница-заглушка
        </Badge>
      </Stack>
    </AppLayout>
  )
}
