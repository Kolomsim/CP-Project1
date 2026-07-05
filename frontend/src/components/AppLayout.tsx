import type { ReactNode } from 'react'
import { AppShell, Container, Group, Text, ActionIcon } from '@mantine/core'

type AppLayoutProps = {
  children: ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <AppShell header={{ height: 64 }} footer={{ height: 'auto' }} padding="md">
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Text fw={600}>Сервис по проверке недвижимости</Text>
          <Group gap="xs">
            <ActionIcon variant="default" aria-label="Статистика" />
            <ActionIcon variant="default" aria-label="Избранное" />
            <ActionIcon variant="default" aria-label="Профиль" />
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
