const COINGECKO_URL = 'https://api.coingecko.com/api/v3/simple/price?ids=zcash&vs_currencies=usd'
const CACHE_TTL = 60_000 // 60 seconds

interface PriceCache {
  usdPerZec: number
  fetchedAt: number
}

let cache: PriceCache | null = null

export async function fetchZecPrice(): Promise<{ usdPerZec: number; fetchedAt: number }> {
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL) {
    return cache
  }

  const res = await fetch(COINGECKO_URL)
  if (!res.ok) {
    throw new Error(`CoinGecko API error: ${res.status}`)
  }

  const data = await res.json()
  const usdPerZec = data?.zcash?.usd
  if (typeof usdPerZec !== 'number') {
    throw new Error('Unexpected CoinGecko response format')
  }

  cache = { usdPerZec, fetchedAt: Date.now() }
  return cache
}

export function convertUsdToZec(usdAmount: number, usdPerZec: number): number {
  if (usdPerZec <= 0) return 0
  return usdAmount / usdPerZec
}

export function invalidateCache(): void {
  cache = null
}
