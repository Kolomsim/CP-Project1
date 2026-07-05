import { Stack, Text, Title, Badge } from "@mantine/core"
import { AppLayout } from "../../components/AppLayout"


export default function ComparisonPage() {
  return (
    <AppLayout>
      <Stack align="center" gap="md" ta="center" py="xl">
        <Title order={1}>Сравнение</Title>
        <Text c="dimmed" maw={520}>
          Сравнение объектов недвижимости и карточки с рейтингом сделки.
        </Text>
        <Badge variant="light" color="violet" size="lg">
          Страница-заглушка
        </Badge>
      </Stack>
    </AppLayout>
  )
}
