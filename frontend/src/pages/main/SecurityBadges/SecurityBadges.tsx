import { IconLock, IconCertificate } from '@tabler/icons-react'
import { Group, Text } from '@mantine/core'
import classes from './SecurityBadges.module.css'

export default function SecurityBadges() {
	return (
		<Group gap={80} wrap='wrap' justify='center' className={classes.badges}>
			<Group gap={16} className={classes.item}>
				<IconLock className={classes.icon} stroke={1.5} />
				<Text size='md' className={classes.text}>
					Проверка из открытых источников
				</Text>
			</Group>

			<Group gap={16} className={classes.item}>
				<IconCertificate className={classes.icon} stroke={1.5} />
				<Text size='md' className={classes.text}>
					Юридическая экспертиза
				</Text>
			</Group>
		</Group>
	)
}
