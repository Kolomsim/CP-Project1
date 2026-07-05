import { Route, Routes } from 'react-router'
import { Container, Stack, Text, Title } from '@mantine/core'
import HomePage from './pages/home'
import DealPage from './pages/deal'
import KbPage from './pages/kb'
import ComparisonPage from './pages/comparison'
import FavoritesPage from './pages/favorites'

function NotFound() {
  return (
    <Container size="sm" py="xl">
      <Stack align="center" gap="sm" ta="center">
        <Title order={1}>404</Title>
        <Text c="dimmed">Страница не найдена</Text>
      </Stack>
    </Container>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/deal" element={<DealPage />} />
      <Route path="/kb" element={<KbPage />} />
      <Route path="/comparison" element={<ComparisonPage />} />
      <Route path="/favorites" element={<FavoritesPage />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default App
