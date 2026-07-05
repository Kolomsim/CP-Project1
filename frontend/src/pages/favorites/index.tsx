import { Badge, Stack, Text, Title } from '@mantine/core'
import { AppLayout } from '../../components/AppLayout'

export default function FavoritesPage() {
  return (
    <AppLayout>
        <Stack align="center" gap="md"
          ta="center" py="xl">
          <Title order={1}>Избранное</Title>
          <Text c="dimmed" maw={520}>
            Избранные объекты недвижимости и карточки с рейтингом сделки.
          </Text>
          <Badge variant="light" color="violet" size="lg">
            Страница-заглушка
          </Badge>
        </Stack>
      </AppLayout>
  )
}
