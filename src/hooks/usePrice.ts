import { useState, useEffect, useCallback } from 'react'
import { fetchZecPrice } from '../price.ts'

interface PriceState {
  usdPerZec: number | null
  fetchedAt: number | null
  loading: boolean
  error: string | null
}

const EMPTY_STATE: PriceState = {
  usdPerZec: null,
  fetchedAt: null,
  loading: false,
  error: null,
}

export function usePrice(enabled = true) {
  const [state, setState] = useState<PriceState>(EMPTY_STATE)

  const refresh = useCallback(async () => {
    if (!enabled) return

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
  }, [enabled])

  useEffect(() => {
    if (!enabled) {
      setState(EMPTY_STATE)
      return
    }

    void refresh()
  }, [enabled, refresh])

  return { ...state, refresh }
}
