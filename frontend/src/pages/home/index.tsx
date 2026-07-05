import { Link } from 'react-router'
import {
  Anchor,
  Card,
  Group,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  Title,
} from '@mantine/core'
import { AppLayout } from '../../components/AppLayout'

const navCards = [
  { title: 'Сопровождение сделки', to: '/deal' },
  { title: 'Риелторы', to: '/realtors' },
  { title: 'База знаний', to: '/kb' },
]

const legalChanges = [
  { id: 1, title: 'Закон 1', description: 'Описание ...' },
  { id: 2, title: 'Закон 2', description: 'Описание ...' },
]

export default function HomePage() {
  return (
    <AppLayout>
      <Stack gap="xl">
        <SimpleGrid cols={{ base: 1, sm: 3 }}>
          {navCards.map(({ title, to }) => (
            <Card key={title} component={Link} to={to} withBorder>
              <Card.Section withBorder inheritPadding py="xs">
                <Text fw={500}>{title}</Text>
              </Card.Section>
              <Skeleton height={120} mt="md" />
            </Card>
          ))}
        </SimpleGrid>

        <Stack gap="md">
          <Title order={2}>Актуальные изменения законодательства</Title>

          <Card withBorder padding="lg">
            <Stack gap="lg">
              {legalChanges.map(({ id, title, description }) => (
                <Group key={id} align="flex-start" wrap="nowrap">
                  <Skeleton height={80} width={80} radius="md" />
                  <Stack flex={1} gap="xs">
                    <Text fw={600}>{title}</Text>
                    <Text c="dimmed" size="sm">
                      {description}
                    </Text>
                    <Group justify="flex-end">
                      <Anchor size="sm">Читать подробнее...</Anchor>
                    </Group>
                  </Stack>
                </Group>
              ))}
            </Stack>
          </Card>
        </Stack>
      </Stack>
    </AppLayout>
  )
}
