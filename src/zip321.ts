import type { Payment } from './types.ts'

const BECH32_CHARSET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l'
const MIN_SHIELDED_ADDRESS_LENGTH = 78

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
 * Check if an address is a mainnet shielded Zcash address.
 */
export function isShieldedAddress(address: string): boolean {
  const trimmed = address.trim()
  if (!trimmed.startsWith('zs1') && !trimmed.startsWith('u1')) return false
  return trimmed.length >= MIN_SHIELDED_ADDRESS_LENGTH && hasBech32Syntax(trimmed)
}

/**
 * Check if an address is a transparent Zcash address.
 */
export function isTransparentAddress(address: string): boolean {
  const trimmed = address.trim()
  return trimmed.startsWith('t1') || trimmed.startsWith('t3')
}

/**
 * Check if an address looks like a testnet address.
 */
export function isTestnetAddress(address: string): boolean {
  const trimmed = address.trim()
  return trimmed.startsWith('ztestsapling') || trimmed.startsWith('utest')
}

function hasBech32Syntax(address: string): boolean {
  if (!address) return false
  if (address !== address.toLowerCase() && address !== address.toUpperCase()) {
    return false
  }

  const normalized = address.toLowerCase()
  const separator = normalized.lastIndexOf('1')
  if (separator <= 0 || separator === normalized.length - 1) {
    return false
  }

  const dataChars = normalized.slice(separator + 1)
  if (dataChars.length < 6) {
    return false
  }

  for (const char of dataChars) {
    if (BECH32_CHARSET.indexOf(char) === -1) {
      return false
    }
  }

  return true
}

/**
 * Validate a mainnet shielded Zcash address.
 */
export function validateAddress(address: string): { valid: boolean; warning?: string } {
  const trimmed = address.trim()

  if (!trimmed) {
    return { valid: false, warning: 'Address is required' }
  }

  if (isTransparentAddress(trimmed)) {
    return { valid: false, warning: 'Transparent addresses are not allowed. Use a mainnet shielded address.' }
  }

  if (isTestnetAddress(trimmed)) {
    return { valid: false, warning: 'Testnet addresses are not allowed. Use a mainnet shielded address.' }
  }

  if (!trimmed.startsWith('zs1') && !trimmed.startsWith('u1')) {
    return { valid: false, warning: 'Expected a mainnet shielded address starting with zs1 or u1.' }
  }

  if (trimmed.length < MIN_SHIELDED_ADDRESS_LENGTH || !hasBech32Syntax(trimmed)) {
    return { valid: false, warning: 'Invalid shielded address. Check for typos and try again.' }
  }

  return { valid: true }
}
