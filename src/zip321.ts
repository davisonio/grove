import type { Payment } from './types.ts'

/**
 * Encode a UTF-8 string to base64url (RFC 4648 Section 5) with no padding.
 */
export function toBase64url(input: string): string {
  const bytes = new TextEncoder().encode(input)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  const b64 = btoa(binary)
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/**
 * Format a ZEC amount as a decimal string with up to 8 fractional digits.
 * Leading zero for values < 1. No trailing zeros beyond what's needed,
 * except we always show at least one fractional digit for clarity.
 */
export function formatZecAmount(amount: number): string {
  if (amount < 0) throw new Error('Amount must be non-negative')
  // Use toFixed(8) to get full precision, then strip trailing zeros
  const fixed = amount.toFixed(8)
  // Remove trailing zeros, but keep at least one decimal place
  const trimmed = fixed.replace(/0+$/, '')
  // If we trimmed everything after the dot, add a single zero
  if (trimmed.endsWith('.')) {
    return trimmed + '0'
  }
  return trimmed
}

/**
 * Build a ZIP-321 compliant multi-payment URI.
 *
 * Spec: https://zips.z.cash/zip-0321
 *
 * - First payment uses bare param names (address, amount, memo)
 * - Subsequent payments use .1, .2, .3 etc
 * - Memos are base64url-encoded (no padding)
 * - Empty/undefined memos are omitted
 */
export function buildZip321Uri(payments: Payment[]): string {
  if (payments.length === 0) {
    throw new Error('At least one payment is required')
  }

  const params: string[] = []

  for (let i = 0; i < payments.length; i++) {
    const p = payments[i]
    const suffix = i === 0 ? '' : `.${i}`

    params.push(`address${suffix}=${encodeURIComponent(p.address)}`)
    params.push(`amount${suffix}=${formatZecAmount(p.amount)}`)

    if (p.memo && p.memo.length > 0) {
      const encoded = toBase64url(p.memo)
      params.push(`memo${suffix}=${encoded}`)
    }
  }

  return `zcash:?${params.join('&')}`
}

/**
 * Check if an address is a shielded Zcash address.
 */
export function isShieldedAddress(address: string): boolean {
  return address.startsWith('zs1') || address.startsWith('u1')
}

/**
 * Check if an address is a transparent Zcash address.
 */
export function isTransparentAddress(address: string): boolean {
  return address.startsWith('t1') || address.startsWith('t3')
}

/**
 * Check if an address looks like a testnet address.
 */
export function isTestnetAddress(address: string): boolean {
  return address.startsWith('ztestsapling') || address.startsWith('utest')
}

/**
 * Basic address validation: must start with a known prefix and be reasonably long.
 */
export function validateAddress(address: string): { valid: boolean; warning?: string } {
  const trimmed = address.trim()

  if (trimmed.length < 20) {
    return { valid: false, warning: 'Address is too short' }
  }

  if (isTransparentAddress(trimmed)) {
    return { valid: true, warning: 'Transparent address. Transactions will be visible on-chain.' }
  }

  if (isShieldedAddress(trimmed) || isTestnetAddress(trimmed)) {
    return { valid: true }
  }

  return { valid: false, warning: 'Unrecognized address format. Expected zs1, u1, t1, or t3 prefix.' }
}
