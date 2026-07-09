import { Route, Routes } from 'react-router'
import { Container, Stack, Text, Title } from '@mantine/core'
import HomePage from './pages/home/HomePage'
import DealPage from './pages/deal'
import DealFormPage from './pages/deal/deal_form'
import DealObjectPage from './pages/deal/deal_object'
import DealResultPage from './pages/deal/deal_result'
import KbPage from './pages/kb'
import ComparisonPage from './pages/comparison/ComparsionPage'
import FavoritesPage from './pages/favorites/FavoritesPage'
import { AuthPage } from './pages/auth'
import PrivacyPage from './pages/privacy_policy/privacy_policy'
import { AppLayout } from './components/AppLayout'

function NotFound() {
	return (
		<Container size='sm' py='xl'>
			<Stack align='center' gap='sm' ta='center'>
				<Title order={1}>404</Title>
				<Text c='dimmed'>Страница не найдена</Text>
			</Stack>
		</Container>
	)
}

function App() {
	return (
		<Routes>
			<Route element={<AppLayout />}>
				<Route path='/' element={<HomePage />} />

				<Route path='deal'>
					<Route index element={<DealPage />} />
					<Route path='deal_form' element={<DealFormPage />} />
					<Route path='deal_object' element={<DealObjectPage />} />
					<Route path='deal_result' element={<DealResultPage />} />
				</Route>

				<Route path='/kb' element={<KbPage />} />
				<Route path='/comparison' element={<ComparisonPage />} />
				<Route path='/favorites' element={<FavoritesPage />} />
				<Route path='/auth' element={<AuthPage />} />
				<Route path='/privacy' element={<PrivacyPage />} />
				<Route path='*' element={<NotFound />} />
			</Route>
		</Routes>
	)
}

export default App
