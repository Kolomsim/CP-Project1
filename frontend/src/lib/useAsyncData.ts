import { useEffect, useState, useRef } from 'react'

type UseAsyncDataResult<T> = {
	loading: boolean
	error: string | null
	data: T | null
}

/**
 * Хук для асинхронной загрузки данных с автоматическим перезапуском при изменении ключа.
 */
export function useAsyncData<T>(
	deps: unknown[],
	fn: () => Promise<T | null>,
	initialValue: T | null = null,
): UseAsyncDataResult<T> {
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [data, setData] = useState<T | null>(initialValue)
	const fnRef = useRef(fn)
	fnRef.current = fn

	useEffect(() => {
		let cancelled = false
		setLoading(true)
		setError(null)

		fnRef
			.current()
			.then(result => {
				if (!cancelled) {
					setData(result)
					setLoading(false)
				}
			})
			.catch((err: unknown) => {
				if (!cancelled) {
					setError(err instanceof Error ? err.message : 'Неизвестная ошибка')
					setLoading(false)
				}
			})

		return () => {
			cancelled = true
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, deps)

	return { loading, error, data }
}
