import { describe, expect, it } from 'vitest'
import { signToken, verifyToken } from './tokens'

const SECRET = 'x'.repeat(32)
const NOW = 1_800_000_000_000

describe('signed tokens', () => {
  it('round-trips the claims for the same purpose', () => {
    const token = signToken(SECRET, 'session', { sub: 'abc', iat: NOW, exp: NOW + 1000 })
    expect(verifyToken(SECRET, 'session', token, NOW)).toMatchObject({ sub: 'abc', iat: NOW, exp: NOW + 1000 })
  })

  it('rejects a token made for another purpose', () => {
    const token = signToken(SECRET, 'verify-email', { sub: 'abc', exp: NOW + 1000 })
    expect(verifyToken(SECRET, 'session', token, NOW)).toBeNull()
    expect(verifyToken(SECRET, 'reset-password', token, NOW)).toBeNull()
  })

  it('rejects a payload swapped under a valid signature', () => {
    const [, signature] = signToken(SECRET, 'session', { sub: 'abc', exp: NOW + 1000 }).split('.')
    const forged = Buffer.from(JSON.stringify({ sub: 'someone-else', exp: NOW + 1000, purpose: 'session' })).toString('base64url')
    expect(verifyToken(SECRET, 'session', `${forged}.${signature}`, NOW)).toBeNull()
  })

  it('rejects a token signed with another secret', () => {
    const token = signToken('y'.repeat(32), 'session', { sub: 'abc', exp: NOW + 1000 })
    expect(verifyToken(SECRET, 'session', token, NOW)).toBeNull()
  })

  it('treats exp equal to now as expired', () => {
    const token = signToken(SECRET, 'session', { sub: 'abc', exp: NOW })
    expect(verifyToken(SECRET, 'session', token, NOW)).toBeNull()
    expect(verifyToken(SECRET, 'session', token, NOW - 1)).not.toBeNull()
  })

  it('rejects missing and malformed tokens', () => {
    for (const bad of [undefined, '', 'abc', 'a.b.c', '.', 'a.', '.b']) {
      expect(verifyToken(SECRET, 'session', bad, NOW)).toBeNull()
    }
  })

  it('refuses to verify with a secret shorter than 32 characters', () => {
    const short = 'z'.repeat(31)
    const token = signToken(short, 'session', { sub: 'abc', exp: NOW + 1000 })
    expect(verifyToken(short, 'session', token, NOW)).toBeNull()
  })
})
