import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import {
  Alert,
  Button,
  Loader,
  Paper,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core'
import { useDebouncedValue } from '@mantine/hooks'
import { IconAlertCircle, IconLink } from '@tabler/icons-react'
import { AppLayout } from '../../../components/AppLayout'
import { PropertyPreviewCard } from './PropertyPreviewCard'
import { fetchPropertyPreview, isSupportedPropertyUrl } from './mockPropertyParser'
import type { PropertyPreview } from './types'
import classes from './DealObject.module.css'

const containedInputStyles = {
  root: {
    position: 'relative' as const,
  },
  input: {
    height: 54,
    paddingTop: 18,
  },
  label: {
    position: 'absolute' as const,
    pointerEvents: 'none' as const,
    fontSize: 11,
    paddingLeft: 12,
    paddingTop: 6,
    zIndex: 1,
  },
}

export default function DealObjectPage() {
  const [url, setUrl] = useState('')
  const [debouncedUrl] = useDebouncedValue(url, 600)
  const [property, setProperty] = useState<PropertyPreview | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadPreview = async (value: string) => {
    const trimmed = value.trim()

    if (!trimmed) {
      setProperty(null)
      setError(null)
      return
    }

    if (!isSupportedPropertyUrl(trimmed)) {
      setProperty(null)
      setError('Укажите ссылку с поддерживаемого сервиса: ЦИАН, Авито, Домклик или SmartCheck.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const preview = await fetchPropertyPreview(trimmed)
      setProperty(preview)
    } catch (err) {
      setProperty(null)
      setError(err instanceof Error ? err.message : 'Не удалось загрузить предпросмотр.')
    } finally {
      setLoading(false)
    }
  }

  const handleUrlChange = (value: string) => {
    setUrl(value)
    if (!value.trim()) {
      setProperty(null)
      setError(null)
    }
  }

  const handleUrlBlur = () => {
    void loadPreview(url)
  }

  useEffect(() => {
    if (!debouncedUrl.trim()) {
      setProperty(null)
      setError(null)
      return
    }

    void loadPreview(debouncedUrl)
  }, [debouncedUrl])

  return (
    <AppLayout>
      <Stack gap="xl" className={classes.page} maw={760} mx="auto">
        <div>
          <Title order={2} mb="sm">
            Шаг 2. Укажите интересующий объект
          </Title>
          <Text c="dimmed">
            Укажите ссылку на интересующий объект недвижимости (поддерживаются следующие сервисы: ЦИАН,
            Авито, Домклик, SmartCheck)
          </Text>
        </div>

        <Paper withBorder radius="md" p="lg" className={classes.urlPaper}>
          <TextInput
            label="Ссылка на объект"
            placeholder="https://www.cian.ru/sale/flat/123456789/"
            value={url}
            onChange={(event) => handleUrlChange(event.currentTarget.value)}
            onBlur={handleUrlBlur}
            leftSection={<IconLink size={16} stroke={1.5} />}
            styles={containedInputStyles}
          />
        </Paper>

        {loading && (
          <Paper withBorder radius="md" p="xl">
            <Stack align="center" gap="sm">
              <Loader color="violet" size="md" />
              <Text size="sm" c="dimmed">
                Загружаем данные объекта...
              </Text>
            </Stack>
          </Paper>
        )}

        {error && !loading && (
          <Alert icon={<IconAlertCircle size={16} />} color="red" variant="light" title="Ошибка">
            {error}
          </Alert>
        )}

        {property && !loading && (
          <Stack gap="sm">
            <div>
              <Title order={4}>Предпросмотр</Title>
              <Text size="sm" c="dimmed">
                Убедитесь, что данные интересующей недвижимости совпадают с предпросмотром.
              </Text>
            </div>

            <PropertyPreviewCard property={property} />

            <Button component={Link} to="/deal/deal_result" size="md" mt="md">
              Продолжить
            </Button>
          </Stack>
        )}
      </Stack>
    </AppLayout>
  )
}
