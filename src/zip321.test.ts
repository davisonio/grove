import { describe, it, expect } from 'vitest'
import { buildZip321Uri, toBase64url, formatZecAmount } from './zip321.ts'

describe('toBase64url', () => {
  it('encodes ASCII text', () => {
    const result = toBase64url('This is a unicode memo ✨🦄🏆🎉')
    expect(result).toBe('VGhpcyBpcyBhIHVuaWNvZGUgbWVtbyDinKjwn6aE8J-PhvCfjok')
  })

  it('does not include padding characters', () => {
    const result = toBase64url('ab')
    expect(result).not.toContain('=')
  })

  it('uses - and _ instead of + and /', () => {
    // The string "?>>" in base64 is "Pz4+" which in base64url should be "Pz4-"
    const result = toBase64url('?>>')
    expect(result).not.toContain('+')
    expect(result).not.toContain('/')
  })
})

describe('formatZecAmount', () => {
  it('formats whole numbers', () => {
    expect(formatZecAmount(123)).toBe('123.0')
  })

  it('formats with decimal places', () => {
    expect(formatZecAmount(123.456)).toBe('123.456')
  })

  it('preserves up to 8 decimal places', () => {
    expect(formatZecAmount(0.00000001)).toBe('0.00000001')
  })

  it('includes leading zero for amounts < 1', () => {
    expect(formatZecAmount(0.001)).toBe('0.001')
  })

  it('strips trailing zeros', () => {
    expect(formatZecAmount(1.5)).toBe('1.5')
  })

  it('handles dust amount', () => {
    expect(formatZecAmount(0.0001)).toBe('0.0001')
  })
})

describe('buildZip321Uri', () => {
  it('builds a single payment, no memo', () => {
    const uri = buildZip321Uri([
      { address: 'zs1testaddr123', amount: 1.5 }
    ])
    expect(uri).toBe('zcash:?address=zs1testaddr123&amount=1.5')
  })

  it('builds a single payment with UTF-8 memo', () => {
    const uri = buildZip321Uri([
      { address: 'zs1testaddr123', amount: 10, memo: 'Grove payout' }
    ])
    expect(uri).toContain('address=zs1testaddr123')
    expect(uri).toContain('amount=10.0')
    expect(uri).toContain('memo=R3JvdmUgcGF5b3V0')
    expect(uri).not.toContain('=&') // no padding chars leaked into URI
  })

  it('builds multiple payments with mixed memos', () => {
    const uri = buildZip321Uri([
      { address: 'zs1addr0', amount: 1, memo: 'First' },
      { address: 'zs1addr1', amount: 2 },
      { address: 'zs1addr2', amount: 3, memo: 'Third' },
    ])

    // First payment: bare params
    expect(uri).toContain('address=zs1addr0')
    expect(uri).toContain('amount=1.0')
    expect(uri).toContain('memo=Rmlyc3Q')

    // Second payment: .1 suffix, no memo
    expect(uri).toContain('address.1=zs1addr1')
    expect(uri).toContain('amount.1=2.0')
    expect(uri).not.toContain('memo.1=')

    // Third payment: .2 suffix, with memo
    expect(uri).toContain('address.2=zs1addr2')
    expect(uri).toContain('amount.2=3.0')
    expect(uri).toContain('memo.2=VGhpcmQ')
  })

  it('handles amount with 8 decimal places', () => {
    const uri = buildZip321Uri([
      { address: 'zs1preciseaddr', amount: 0.00000001 }
    ])
    expect(uri).toContain('amount=0.00000001')
  })

  it('omits memo param when memo is empty string', () => {
    const uri = buildZip321Uri([
      { address: 'zs1addr', amount: 1, memo: '' }
    ])
    expect(uri).not.toContain('memo')
  })

  it('omits memo param when memo is undefined', () => {
    const uri = buildZip321Uri([
      { address: 'zs1addr', amount: 1 }
    ])
    expect(uri).not.toContain('memo')
  })

  it('throws on empty payments array', () => {
    expect(() => buildZip321Uri([])).toThrow('At least one payment is required')
  })

  it('matches the known-good test vector from ZIP-321 spec', () => {
    const uri = buildZip321Uri([
      {
        address: 'tmEZhbWHTpdKMw5it8YDspUXSMGQyFwovpU',
        amount: 123.456,
      },
      {
        address: 'ztestsapling10yy2ex5dcqkclhc7z7yrnjq2z6feyjad56ptwlfgmy77dmaqqrl9gyhprdx59qgmsnyfska2kez',
        amount: 0.789,
        memo: 'This is a unicode memo ✨🦄🏆🎉',
      },
    ])

    expect(uri).toBe(
      'zcash:?address=tmEZhbWHTpdKMw5it8YDspUXSMGQyFwovpU&amount=123.456' +
      '&address.1=ztestsapling10yy2ex5dcqkclhc7z7yrnjq2z6feyjad56ptwlfgmy77dmaqqrl9gyhprdx59qgmsnyfska2kez' +
      '&amount.1=0.789' +
      '&memo.1=VGhpcyBpcyBhIHVuaWNvZGUgbWVtbyDinKjwn6aE8J-PhvCfjok'
    )
  })
})
