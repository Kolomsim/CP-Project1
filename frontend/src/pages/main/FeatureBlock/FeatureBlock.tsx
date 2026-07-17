import { Container, Stack, Text, ThemeIcon, Title, Button } from '@mantine/core'
import { IconCheck, IconArrowRight } from '@tabler/icons-react'
import { Link } from 'react-router'
import type { ReactNode } from 'react'
import classes from './FeatureBlock.module.css'

export interface FeatureItem {
	icon: React.FC<{ size?: number; stroke?: number }>
	text: string
}

export interface FeatureBlockProps {
	/** Заголовок блока */
	title: string
	/** Подзаголовок / описание */
	description: string
	/** Список ключевых возможностей */
	features: FeatureItem[]
	/** Путь к картинке (иллюстрация) */
	image: string
	/** Альтернативный текст для картинки */
	imageAlt: string
	/** Вариант цветовой схемы */
	variant?: 'mint' | 'cream' | 'lavender'
	/** Расположение картинки: слева или справа */
	imagePosition?: 'left' | 'right'
	/** Текст кнопки */
	buttonText?: string
	/** Ссылка кнопки */
	buttonLink?: string
	/** Доп. контент внизу блока (например, кнопка) — если передан, buttonText/buttonLink игнорируются */
	children?: ReactNode
}

const variantClasses: Record<string, string> = {
	mint: classes.variantMint,
	cream: classes.variantCream,
	lavender: classes.variantLavender,
}

export function FeatureBlock({
	title,
	description,
	features,
	image,
	imageAlt,
	variant = 'mint',
	imagePosition = 'right',
	buttonText,
	buttonLink,
	children,
}: FeatureBlockProps) {
	const variantClass = variantClasses[variant] ?? classes.variantMint

	const content = (
		<Stack gap='lg' className={classes.content}>
			<Title order={2} className={classes.title}>
				{title}
			</Title>

			<Text className={classes.description}>{description}</Text>

			<Stack gap='sm' className={classes.features}>
				{features.map(({ icon: Icon, text }) => (
					<div key={text} className={classes.featureRow}>
						<ThemeIcon size={22} radius='xl' className={classes.checkIcon}>
							<IconCheck size={13} stroke={2} />
						</ThemeIcon>
						<Text className={classes.featureText}>{text}</Text>
					</div>
				))}
			</Stack>

			{(children || (buttonText && buttonLink)) && (
				<div className={classes.actions}>
					{children ?? (
						<Button
							component={Link}
							to={buttonLink!}
							size='md'
							radius='md'
							className={classes.button}
							rightSection={<IconArrowRight size={16} stroke={1.8} />}
						>
							{buttonText}
						</Button>
					)}
				</div>
			)}
		</Stack>
	)

	const imageBlock = (
		<div className={classes.imageWrapper}>
			<img src={image} alt={imageAlt} className={classes.image} loading='lazy' />
		</div>
	)

	return (
		<section className={`${classes.section} ${variantClass}`}>
			<Container size='lg' className={classes.inner}>
				{imagePosition === 'left' ? (
					<div className={classes.grid}>
						<div className={classes.gridColImage}>{imageBlock}</div>
						<div className={classes.gridColContent}>{content}</div>
					</div>
				) : (
					<div className={classes.grid}>
						<div className={classes.gridColContent}>{content}</div>
						<div className={classes.gridColImage}>{imageBlock}</div>
					</div>
				)}
			</Container>
		</section>
	)
}
