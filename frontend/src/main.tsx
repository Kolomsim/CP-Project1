import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import { MantineProvider } from '@mantine/core'
import '@mantine/core/styles.css'
import './index.css'
import App from './App.tsx'
import { theme } from './theme'
import { AuthProvider } from './context/AuthContext'

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<BrowserRouter>
			<MantineProvider theme={theme}>
				<AuthProvider>
					<App />
				</AuthProvider>
			</MantineProvider>
		</BrowserRouter>
	</StrictMode>,
)
