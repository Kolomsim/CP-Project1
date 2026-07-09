import { Stack, Text, Title } from '@mantine/core'

export default function PrivacyPolicyPage() {
	return (
		<Stack align='center' gap='md' ta='center' py='xl'>
			<Title order={1}>Политика конфиденциальности</Title>
			<Text c='dimmed' maw={520}>
				Наша политика конфиденциальности определяет, как мы обрабатываем ваши персональные данные и обеспечиваем вашу
				конфиденциальность.
			</Text>
		</Stack>
	)
}
