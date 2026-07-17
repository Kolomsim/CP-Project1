import { AppShell } from '@mantine/core'
import { IconShieldCheck } from '@tabler/icons-react'
import { Header } from '../../components/Header'
import { Footer } from '../../components/Footer'
import { FeatureBlock } from './FeatureBlock/FeatureBlock'
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

				{/* Блок 1: Проверка недвижимости */}
				<FeatureBlock
					title='Проверка недвижимости'
					description='Получите полную картину об объекте недвижимости перед покупкой. Алгоритм анализирует данные из открытых источников и формирует детальный отчёт с рекомендациями.'
					features={[
						{ icon: IconShieldCheck, text: 'Карта рисков: скрытые жильцы, маткапитал, суды и долги продавца' },
						{ icon: IconShieldCheck, text: 'Экологический радар: промзоны, свалки и шумные дороги рядом' },
						{ icon: IconShieldCheck, text: 'Пошаговый чек-лист документов под вашу сделку' },
						{ icon: IconShieldCheck, text: 'Рейтинг объекта и итоговая оценка' },
					]}
					image='/illustration-deal.svg'
					imageAlt='Проверка недвижимости'
					variant='mint'
					imagePosition='right'
					buttonText='Проверить объект'
					buttonLink='/deal'
				/>

				{/* Блок 2: Сравнение и избранное */}
				<FeatureBlock
					title='Сравнение и избранное'
					description='Сохраняйте понравившиеся объекты в избранное и сравнивайте их между собой, чтобы выбрать лучший вариант. Для использования избранного и сравнения необходима регистрация.'
					features={[
						{ icon: IconShieldCheck, text: 'Добавляйте объекты в избранное после проверки' },
						{ icon: IconShieldCheck, text: 'Сравнивайте до двух объектов по ключевым характеристикам' },
						{ icon: IconShieldCheck, text: 'Наглядная таблица различий и карта с расположением' },
						{ icon: IconShieldCheck, text: 'Быстрый доступ к полному отчёту из избранного' },
					]}
					image='/illustration-compare.svg'
					imageAlt='Сравнение и избранное'
					variant='cream'
					imagePosition='left'
					buttonText='Перейти к избранному'
					buttonLink='/favorites'
				/>

				{/* Блок 3: База знаний */}
				<FeatureBlock
					title='База знаний'
					description='Актуальная информация по правовым вопросам недвижимости: пошаговые инструкции, статьи, разборы и комментарии экспертов.'
					features={[
						{ icon: IconShieldCheck, text: 'Статьи юристов по недвижимости с практическими примерами' },
						{ icon: IconShieldCheck, text: 'Пошаговые инструкции для разных ситуаций' },
						{ icon: IconShieldCheck, text: 'Удобный поиск по всем материалам' },
					]}
					image='/illustration-knowledge.svg'
					imageAlt='База знаний'
					variant='lavender'
					imagePosition='right'
					buttonText='Перейти в базу знаний'
					buttonLink='/kb'
				/>

				<HowItWorks />
				<SecurityBadges />
				<ReadyBlock />
			</AppShell.Main>
			<Footer />
		</AppShell>
	)
}
