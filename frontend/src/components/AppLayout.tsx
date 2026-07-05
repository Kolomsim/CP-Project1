import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { AppShell, Container, Group, Text, ActionIcon } from '@mantine/core'

import { IconGitCompare, IconHeart, IconUser } from '@tabler/icons-react'


type AppLayoutProps = {
  children: ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <AppShell header={{ height: 64 }} footer={{ height: 'auto' }} padding="md">
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Text
            component={Link}
            to="/"
            fw={600}
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            Сервис по проверке недвижимости
          </Text>
          <Group gap="xs">
            <ActionIcon
              component={Link}
              to="/comparison"
              variant="default"
              aria-label="Сравнение"
              size="lg"
            >
              <IconGitCompare stroke={1.5} />
            </ActionIcon>
            <ActionIcon
              component={Link}
              to="/favorites"
              variant="default"
              aria-label="Избранное"
              size="lg"
            >
              <IconHeart stroke={1.5} />
            </ActionIcon>
            <ActionIcon variant="default" aria-label="Профиль" size="lg">
              <IconUser stroke={1.5} />
            </ActionIcon>

          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Main>
        <Container size="lg">{children}</Container>
      </AppShell.Main>

      <AppShell.Footer p="md">
        <Text size="sm" c="dimmed" ta="center">
          © 2026 SmartCheck Недвижимость — сервис анализа рисков при покупке и
          продаже жилья для физических лиц.
        </Text>
      </AppShell.Footer>
    </AppShell>
  )
}
