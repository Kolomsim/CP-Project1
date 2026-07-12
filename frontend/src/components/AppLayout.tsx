import { AppShell, Container } from '@mantine/core'
import { Outlet } from 'react-router'
import { Header } from './Header'
import { Footer } from './Footer'

export function AppLayout() {
	return (
		<AppShell header={{ height: '54px' }} padding='md'>
			<AppShell.Header>
				<Header />
			</AppShell.Header>

			<AppShell.Main style={{ paddingBottom: '30px', height: '100%' }}>
				<Container size='lg'>
					<Outlet />
				</Container>
			</AppShell.Main>

			<Footer />
		</AppShell>
	)
}
