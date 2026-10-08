import { NextResponse } from 'next/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { accountRow, request, SECRET, sessionCookie, stubAuthEnv, USER_ID } from '@/tests/fixtures'
import { getAccountById } from './accounts'
import { clearSessionCookie, getSessionAccount, SESSION_COOKIE, setSessionCookie } from './session'
import { signToken } from './tokens'

vi.mock('./accounts', () => ({ getAccountById: vi.fn() }))

const withCookie = (cookie?: string) => request('/api/x', { cookie, origin: null })

beforeEach(() => {
  stubAuthEnv()
  vi.mocked(getAccountById).mockReset().mockResolvedValue(accountRow())
})
afterEach(() => vi.unstubAllEnvs())

describe('getSessionAccount', () => {
  it('returns the account for a valid cookie of an active account', async () => {
    expect(await getSessionAccount(withCookie(sessionCookie(USER_ID)))).toEqual({
      id: USER_ID,
      email: 'somchai@example.com',
      fullName: 'สมชาย ใจดี',
      role: 'user',
      isRoot: false,
    })
  })

  it('returns null without a cookie and does not hit the database', async () => {
    expect(await getSessionAccount(withCookie())).toBeNull()
    expect(getAccountById).not.toHaveBeenCalled()
  })

  it('rejects a verify-email token presented as a session cookie', async () => {
    const t = signToken(SECRET, 'verify-email', { sub: USER_ID, iat: Date.now(), exp: Date.now() + 60_000 })
    expect(await getSessionAccount(withCookie(`${SESSION_COOKIE}=${t}`))).toBeNull()
  })

  it.each(['unverified', 'pending', 'disabled'] as const)('rejects a %s account', async (status) => {
    vi.mocked(getAccountById).mockResolvedValue(accountRow({ status }))
    expect(await getSessionAccount(withCookie(sessionCookie(USER_ID)))).toBeNull()
  })

  it('rejects a session issued before sessions_valid_after (password reset / sign-out everywhere)', async () => {
    const issued = Date.now() - 10_000
    vi.mocked(getAccountById).mockResolvedValue(accountRow({ sessions_valid_after: new Date(issued + 1).toISOString() }))
    expect(await getSessionAccount(withCookie(sessionCookie(USER_ID, issued)))).toBeNull()
  })

  it('fails closed when sessions_valid_after cannot be parsed', async () => {
    vi.mocked(getAccountById).mockResolvedValue(accountRow({ sessions_valid_after: 'not-a-date' }))
    expect(await getSessionAccount(withCookie(sessionCookie(USER_ID)))).toBeNull()
  })

  it('rejects when the account was deleted', async () => {
    vi.mocked(getAccountById).mockResolvedValue(null)
    expect(await getSessionAccount(withCookie(sessionCookie(USER_ID)))).toBeNull()
  })

  it('returns null when DASHBOARD_SESSION_SECRET is missing', async () => {
    vi.stubEnv('DASHBOARD_SESSION_SECRET', '')
    expect(await getSessionAccount(withCookie(sessionCookie(USER_ID)))).toBeNull()
  })
})

describe('session cookie', () => {
  it('sets an httpOnly 12 h cookie that getSessionAccount accepts, and clears it', async () => {
    const res = NextResponse.json({})
    setSessionCookie(res, USER_ID)
    const cookie = res.cookies.get(SESSION_COOKIE)!
    expect(cookie.httpOnly).toBe(true)
    expect(cookie.sameSite).toBe('lax')
    expect(cookie.maxAge).toBe(43200)
    expect(await getSessionAccount(withCookie(`${SESSION_COOKIE}=${cookie.value}`))).not.toBeNull()

    clearSessionCookie(res)
    expect(res.cookies.get(SESSION_COOKIE)?.value).toBe('')
  })
})
