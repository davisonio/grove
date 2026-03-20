import { useState, useEffect, useCallback } from 'react'
import { fetchZecPrice } from '../price.ts'

interface PriceState {
  usdPerZec: number | null
  fetchedAt: number | null
  loading: boolean
  error: string | null
}

export function usePrice() {
  const [state, setState] = useState<PriceState>({
    usdPerZec: null,
    fetchedAt: null,
    loading: false,
    error: null,
  })

  const refresh = useCallback(async () => {
    setState(s => ({ ...s, loading: true, error: null }))
    try {
      const result = await fetchZecPrice()
      setState({
        usdPerZec: result.usdPerZec,
        fetchedAt: result.fetchedAt,
        loading: false,
        error: null,
      })
    } catch (err) {
      setState(s => ({
        ...s,
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to fetch price',
      }))
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { ...state, refresh }
}
