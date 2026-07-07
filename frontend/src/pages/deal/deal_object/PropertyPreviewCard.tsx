import { Divider, Group, Paper, SimpleGrid, Stack, Tabs, Text, Title } from '@mantine/core'
import type { PropertyPreview } from './types'
import { PropertyMap } from './PropertyMap'
import classes from './DealObject.module.css'

type PropertyPreviewCardProps = {
  property: PropertyPreview
}

function formatPrice(value: number) {
  return `${new Intl.NumberFormat('ru-RU').format(value)} ₽`
}

function formatPricePerSqm(price: number, area: number) {
  return `${new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(price / area)} ₽/м²`
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <Stack gap={4}>
      <Text size="xs" c="dimmed">
        {label}
      </Text>
      <Text size="sm" fw={500}>
        {value}
      </Text>
    </Stack>
  )
}

export function PropertyPreviewCard({ property }: PropertyPreviewCardProps) {
  const titleLine = `${property.title}, ${property.totalArea} м², ${property.floor}/${property.totalFloors} этаж`

  return (
    <Paper withBorder radius="md" p="lg" className={classes.previewCard}>
      <Stack gap="md">
        <div>
          <Title order={4} fw={600}>
            {titleLine}
          </Title>
          <Text size="sm" c="dimmed" mt={4}>
            {property.address}
          </Text>
          <Text size="sm" mt="sm" lineClamp={3}>
            {property.description}
          </Text>
        </div>

        <Group justify="space-between" align="flex-end" wrap="wrap" gap="xs">
          <Text className={classes.price} fw={700}>
            {formatPrice(property.price)}
          </Text>
          <Text size="sm" c="dimmed">
            {formatPricePerSqm(property.price, property.totalArea)}
          </Text>
        </Group>

        <Divider />

        <Tabs defaultValue="about" variant="outline" radius="md">
          <Tabs.List>
            <Tabs.Tab value="seller">Продавец</Tabs.Tab>
            <Tabs.Tab value="about">О квартире</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="seller" pt="md">
            <Stack gap="xs">
              <DetailItem label="ФИО" value={property.seller.name} />
              {property.seller.phone && <DetailItem label="Телефон" value={property.seller.phone} />}
              <DetailItem label="Платформа" value={property.platform} />
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="about" pt="md">
            <SimpleGrid cols={{ base: 2, sm: 3 }} spacing="md">
              <DetailItem label="Комнат" value={String(property.rooms)} />
              <DetailItem label="Тип жилья" value={property.propertyType} />
              <DetailItem label="Площадь" value={`${property.totalArea} м²`} />
              <DetailItem label="Жилая" value={`${property.livingArea} м²`} />
              <DetailItem label="Тип сделки" value={property.dealType} />
              <DetailItem label="Кухня" value={`${property.kitchenArea} м²`} />
              <DetailItem label="Этаж" value={String(property.floor)} />
            </SimpleGrid>
          </Tabs.Panel>
        </Tabs>

        <PropertyMap lat={property.location.lat} lon={property.location.lon} address={property.address} />
      </Stack>
    </Paper>
  )
}
