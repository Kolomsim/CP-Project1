import { Route, Routes, Navigate, Outlet } from 'react-router'
import { Container, Stack, Text, Title } from '@mantine/core'
import HomePage from './pages/home/HomePage'
import MainPage from './pages/main/MainPage'
import FAQPage from './pages/faq/FAQPage'
import DealPage from './pages/deal'
import DealFormPage from './pages/deal/deal_form'
import DealObjectPage from './pages/deal/deal_object'
import DealChecklistPage from './pages/deal/deal_checklist'
import DealResultPage from './pages/deal/deal_result'
import KbPage from './pages/kb/KnowledgeBasePage'
import ArticleViewPage from './pages/article/ArticleViewPage'
import ArticleEditorPage from './pages/article/ArticleEditorPage'
import ComparisonPage from './pages/comparison/ComparsionPage'
import FavoritesPage from './pages/favorites/FavoritesPage'
import FavoritesReportPage from './pages/favorites/FavoritesReportPage'
import AuthPage from './pages/auth/AuthPage'
import PrivacyPage from './pages/privacy_policy/privacy_policy'
import { AppLayout } from './components/AppLayout'
import { useAuth } from './context/AuthContext'

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

/** Перенаправляет на /auth, если пользователь не авторизован */
function ProtectedRoute({ children }: { children: React.ReactNode }) {
	const { isAuthenticated, isLoading } = useAuth()

	if (isLoading) {
		return null
	}

	if (!isAuthenticated) {
		return <Navigate to='/auth' replace />
	}

	return <>{children}</>
}

function App() {
	return (
		<Routes>
			{/* Корневой маршрут — MainPage (landing) для всех */}
			<Route path='/' element={<MainPage />} />
			<Route path='/main' element={<MainPage />} />

			{/* Маршруты с AppLayout (Header + Footer) */}
			<Route element={<AppLayout />}>
				{/* HomePage доступен только авторизованным */}
				<Route
					path='/home'
					element={
						<ProtectedRoute>
							<HomePage />
						</ProtectedRoute>
					}
				/>

				<Route path='deal'>
					<Route index element={<DealPage />} />
					<Route path='deal_form' element={<DealFormPage />} />
					<Route path='deal_object' element={<DealObjectPage />} />
					<Route path='deal_checklist' element={<DealChecklistPage />} />
					<Route path='deal_result' element={<DealResultPage />} />
				</Route>

				<Route path='/kb' element={<KbPage />} />
				<Route path='/faq' element={<FAQPage />} />
				<Route path='/kb/new' element={<ArticleEditorPage />} />
				<Route path='/kb/:articleId' element={<ArticleViewPage />} />
				<Route path='/kb/:articleId/edit' element={<ArticleEditorPage />} />

				{/* Защищённые маршруты (только для авторизованных) */}
				<Route
					path='/comparison'
					element={
						<ProtectedRoute>
							<ComparisonPage />
						</ProtectedRoute>
					}
				/>
				<Route
					path='/favorites'
					element={
						<ProtectedRoute>
							<FavoritesPage />
						</ProtectedRoute>
					}
				/>
				<Route
					path='/favorites/:favoriteId'
					element={
						<ProtectedRoute>
							<FavoritesReportPage />
						</ProtectedRoute>
					}
				/>

				<Route path='/auth' element={<AuthPage />} />
				<Route path='/privacy' element={<PrivacyPage />} />
				<Route path='*' element={<NotFound />} />
			</Route>
		</Routes>
	)
}

export default App
