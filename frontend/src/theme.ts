import { createTheme, type MantineColorsTuple } from '@mantine/core'

/** СмартЧек mint/green — акцент, не фон всего сайта */
const brand: MantineColorsTuple = [
	'#f4faf0',
	'#e2f1d1',
	'#c8e4b0',
	'#a9d48c',
	'#8bc46d',
	'#6bb353',
	'#2f9e66',
	'#247a4f',
	'#1c5f3e',
	'#144530',
]

export const theme = createTheme({
	primaryColor: 'brand',
	colors: { brand },
	fontFamily: '"Manrope", system-ui, -apple-system, "Segoe UI", sans-serif',
	headings: {
		fontFamily: '"Manrope", system-ui, -apple-system, "Segoe UI", sans-serif',
		fontWeight: '700',
		sizes: {
			h1: { fontWeight: '800' },
			h2: { fontWeight: '700' },
			h3: { fontWeight: '700' },
		},
	},
	defaultRadius: 'md',
	black: '#14201b',
	white: '#ffffff',
	primaryShade: 6,
	defaultGradient: {
		from: 'brand.6',
		to: 'brand.8',
		deg: 135,
	},
	components: {
		Button: {
			defaultProps: {
				radius: 'md',
			},
		},
		Paper: {
			defaultProps: {
				radius: 'md',
				bg: 'white',
			},
			styles: {
				root: {
					borderColor: 'var(--sc-border)',
				},
			},
		},
		Card: {
			defaultProps: {
				radius: 'md',
				bg: 'white',
			},
			styles: {
				root: {
					borderColor: 'var(--sc-border)',
					boxShadow: 'var(--sc-shadow)',
				},
			},
		},
		Loader: {
			defaultProps: {
				color: 'brand',
			},
		},
		Anchor: {
			defaultProps: {
				c: 'brand.7',
			},
		},
		Badge: {
			defaultProps: {
				radius: 'sm',
			},
		},
		TextInput: {
			styles: {
				input: {
					backgroundColor: '#fff',
					borderColor: 'var(--sc-border-strong)',
				},
			},
		},
		Textarea: {
			styles: {
				input: {
					backgroundColor: '#fff',
					borderColor: 'var(--sc-border-strong)',
				},
			},
		},
		Select: {
			styles: {
				input: {
					backgroundColor: '#fff',
					borderColor: 'var(--sc-border-strong)',
				},
			},
		},
	},
})
