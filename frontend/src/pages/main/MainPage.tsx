import { AppShell } from '@mantine/core'
import { Header } from '../../components/Header'
import { Footer } from '../../components/Footer'
import ReadyBlock from './ReadyBlock/ReadyBlock'
import SecurityBadges from './SecurityBadges/SecurityBadges'
import HowItWorks from './HowItWorks/HowItWorks'
import KeyFeatures from './KeyFeatures/KeyFeatures'
import PreviewBlock from './PreviewBlock/PreviewBlock'
import classes from '../../components/AppChrome.module.css'

export default function MainPage() {
	return (
		<AppShell header={{ height: '54px' }} padding={0}>
			<AppShell.Header className={classes.header} withBorder={false}>
				<Header />
			</AppShell.Header>
			<AppShell.Main style={{ paddingTop: '54px' }}>
				<PreviewBlock />
				<KeyFeatures />
				<HowItWorks />
				<SecurityBadges />
				<ReadyBlock />
			</AppShell.Main>
			<Footer />
		</AppShell>
	)
}
