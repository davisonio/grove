const PBKDF2_ITERATIONS = 100_000
const SALT_LENGTH = 16
const IV_LENGTH = 12

function toBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

function fromBase64(b64: string): Uint8Array {
  const binary = atob(b64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

export function generateSalt(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(SALT_LENGTH))
}

export async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey']
  )

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as unknown as BufferSource,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

/**
 * Encrypt plaintext with AES-256-GCM. Returns "base64(iv).base64(ciphertext)".
 * A fresh random IV is generated on every call.
 */
export async function encrypt(key: CryptoKey, plaintext: string): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH))
  const encoded = new TextEncoder().encode(plaintext)

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as unknown as BufferSource },
    key,
    encoded
  )

  return toBase64(iv.buffer as ArrayBuffer) + '.' + toBase64(ciphertext)
}

/**
 * Decrypt a blob produced by encrypt(). Throws on wrong key or tampered data.
 */
export async function decrypt(key: CryptoKey, blob: string): Promise<string> {
  const dotIndex = blob.indexOf('.')
  if (dotIndex === -1) {
    throw new Error('Invalid encrypted blob format')
  }

  const iv = fromBase64(blob.slice(0, dotIndex))
  const ciphertext = fromBase64(blob.slice(dotIndex + 1))

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv as unknown as BufferSource },
    key,
    ciphertext as unknown as BufferSource
  )

  return new TextDecoder().decode(decrypted)
}

export function saltToBase64(salt: Uint8Array): string {
  return toBase64(salt.buffer as ArrayBuffer)
}

export function saltFromBase64(b64: string): Uint8Array {
  return fromBase64(b64)
}
