import { Link, useLocation } from 'react-router'
import {
  AppShell,
  Badge,
  Container,
  Group,
  Stack,
  Text,
  Title,
  UnstyledButton,
} from '@mantine/core'

type StubLayoutProps = {
  title: string
  description?: string
}

const navItems = [
  { to: '/', label: 'Сопровождение сделки' },
  { to: '/kb', label: 'База знаний' },
  { to: '/comparison', label: 'Сравнение' },
]

export function StubLayout({ title, description }: StubLayoutProps) {
  const { pathname } = useLocation()

  return (
    <AppShell header={{ height: 64 }} padding="md">
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Text fw={600} size="lg">
            SmartCheck
          </Text>
          <Group gap="xs">
            {navItems.map(({ to, label }) => (
              <UnstyledButton
                key={to}
                component={Link}
                to={to}
                px="sm"
                py={6}
                style={{
                  borderRadius: 'var(--mantine-radius-md)',
                  fontWeight: pathname === to ? 600 : 400,
                  backgroundColor:
                    pathname === to
                      ? 'var(--mantine-color-violet-light)'
                      : undefined,
                }}
              >
                {label}
              </UnstyledButton>
            ))}
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Main>
        <Container size="sm" py="xl">
          <Stack align="center" gap="md" ta="center">
            <Title order={1}>{title}</Title>
            {description && (
              <Text c="dimmed" maw={520}>
                {description}
              </Text>
            )}
            <Badge variant="light" color="violet" size="lg">
              Страница-заглушка
            </Badge>
          </Stack>
        </Container>
      </AppShell.Main>
    </AppShell>
  )
}
