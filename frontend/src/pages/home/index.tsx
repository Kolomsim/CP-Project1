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
  { 
    title: 'Сопровождение сделки', 
    to: '/deal', 
    description: 'Описание сопровождения сделки'
  },
  // { 
  //   title: 'Риелторы', 
  //   to: '/realtors', 
  //   description: 'Описание риелторов' 
  // },
  { 
    title: 'База знаний', 
    to: '/kb', description: 
    'Описание базы знаний' 
  },
]

const legalChanges = [
  { id: 1, title: 'Закон 1', description: 'Описание ...' },
  { id: 2, title: 'Закон 2', description: 'Описание ...' },
]

export default function HomePage() {
  return (
    <AppLayout>
      <Stack gap="xl">
        <SimpleGrid
          cols={{ base: 1, sm: 2 }}
          spacing="xl"
          maw={920}
          mx="auto"
          w="100%"
        >
          {navCards.map(({ title, to, description }) => (
            <Card
              key={title}
              component={Link}
              to={to}
              withBorder
              padding="lg"
              mih={200}
            >
              <Card.Section withBorder inheritPadding py="md">
                <Text fw={600} size="lg">
                  {title}
                </Text>
              </Card.Section>
              <Text c="dimmed" size="md" mt="md">
                {description}
              </Text>
            </Card>
          ))}
        </SimpleGrid>

        <Stack gap="md">
          <Title order={2}>Актуальные изменения законодательства</Title>

          <Card withBorder padding="lg">
            <Stack gap="lg">
              {legalChanges.map(({ id, title, description }) => (
                <Group key={id} align="flex-start" wrap="nowrap">
                  {/* <ActionIcon>
                    
                  </ActionIcon> */}
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
