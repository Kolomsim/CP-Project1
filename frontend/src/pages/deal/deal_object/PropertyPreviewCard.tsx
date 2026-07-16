import { Divider, Group, Paper, SimpleGrid, Stack, Tabs, Text, Title } from '@mantine/core'
import type { PropertyPreview } from './types'
import { PropertyMap } from './PropertyMap'
import { formatPriceWithCurrency, formatPricePerSqm } from '../../../utils/format'
import classes from './DealObject.module.css'

type PropertyPreviewCardProps = {
	property: PropertyPreview
	showMap?: boolean
}

const EMPTY_VALUE = '—'

function isMissingValue(value: number | null | undefined): boolean {
	return value == null || value === 0
}

function formatDetailNumber(value: number | null | undefined): string {
	return isMissingValue(value) ? EMPTY_VALUE : String(value)
}

function formatDetailArea(value: number | null | undefined): string {
	return isMissingValue(value) ? EMPTY_VALUE : `${value} м²`
}

function formatDetailMarketCategory(value: string | null | undefined): string {
	return value?.trim() ? value : EMPTY_VALUE
}

function DetailItem({ label, value }: { label: string; value: string }) {
	return (
		<Stack gap={4}>
			<Text size='xs' c='dimmed'>
				{label}
			</Text>
			<Text size='sm' fw={500}>
				{value}
			</Text>
		</Stack>
	)
}

export function PropertyPreviewCard({ property, showMap = true }: PropertyPreviewCardProps) {
	const titleLine = `${property.title}, ${formatDetailArea(property.totalArea)}, ${formatDetailNumber(property.floor)}/${formatDetailNumber(property.totalFloors)} этаж`

	return (
		<Paper withBorder radius='md' p='lg' className={classes.previewCard}>
			<Stack gap='md'>
				<div>
					<Title order={4} fw={600}>
						{titleLine}
					</Title>
					<Text size='sm' c='dimmed' mt={4}>
						{property.address}
					</Text>
				</div>

				<Group justify='space-between' align='flex-end' wrap='wrap' gap='xs'>
					<Text className={classes.price} fw={700}>
						{formatPriceWithCurrency(property.price)}
					</Text>
					<Text size='sm' c='dimmed'>
						{isMissingValue(property.totalArea) ? EMPTY_VALUE : formatPricePerSqm(property.price, property.totalArea)}
					</Text>
				</Group>

				<Divider />

				<Tabs defaultValue='about' variant='outline' radius='md'>
					<Tabs.List>
						{/* <Tabs.Tab value="seller">Продавец</Tabs.Tab> */}
						<Tabs.Tab value='about'>О квартире</Tabs.Tab>
					</Tabs.List>

					{/* <Tabs.Panel value="seller" pt="md">
            <Stack gap="xs">
              <DetailItem label="ФИО" value={property.seller.name} />
              {property.seller.phone && <DetailItem label="Телефон" value={property.seller.phone} />}
              <DetailItem label="Платформа" value={property.platform} />
            </Stack>
          </Tabs.Panel> */}

					<Tabs.Panel value='about' pt='md'>
						<SimpleGrid cols={{ base: 2, sm: 3 }} spacing='md'>
							<DetailItem label='Комнат' value={formatDetailNumber(property.rooms)} />
							<DetailItem label='Тип жилья' value={formatDetailMarketCategory(property.marketCategory)} />
							<DetailItem label='Тип объекта' value={property.propertyType || EMPTY_VALUE} />
							<DetailItem label='Площадь' value={formatDetailArea(property.totalArea)} />
							<DetailItem label='Жилая' value={formatDetailArea(property.livingArea)} />
							<DetailItem
								label='Тип сделки'
								value={property.dealType === 'не указан' ? EMPTY_VALUE : property.dealType || EMPTY_VALUE}
							/>
							<DetailItem label='Кухня' value={formatDetailArea(property.kitchenArea)} />
							<DetailItem label='Этаж' value={formatDetailNumber(property.floor)} />
						</SimpleGrid>
					</Tabs.Panel>
				</Tabs>

				{showMap && (
					<PropertyMap lat={property.location.lat} lon={property.location.lon} address={property.address} />
				)}
			</Stack>
		</Paper>
	)
}
