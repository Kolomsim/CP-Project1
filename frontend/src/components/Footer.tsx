import { Text } from '@mantine/core'
import classes from './AppChrome.module.css'

export function Footer() {
	return (
		<div className={classes.footer}>
			<Text size='sm' ta='center' className={classes.footerText}>
				© 2026 СмартЧек Недвижимость — сервис анализа рисков при покупке и продаже жилья для физических лиц.
			</Text>
			<Text size='xs' ta='center' mt={6} className={classes.footerText}>
				Информация, размещённая на данном сайте, носит исключительно общий информационный и справочный характер, не
				является юридической консультацией, <br /> заключением специалиста либо индивидуальной рекомендацией,
				направленной на принятие конкретного решения в отношении Вашей ситуации.
			</Text>
		</div>
	)
}
