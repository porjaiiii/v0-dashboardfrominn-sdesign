import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { accountRow, request, sessionCookie, stubAuthEnv, USER_ID } from '@/tests/fixtures'
import { getAccountById } from './accounts'
import { isSameOrigin, requireAccount } from './http'

vi.mock('./accounts', () => ({ getAccountById: vi.fn() }))

beforeEach(() => {
  stubAuthEnv()
  vi.mocked(getAccountById).mockReset().mockResolvedValue(accountRow())
})
afterEach(() => vi.unstubAllEnvs())

describe('isSameOrigin', () => {
  it('accepts the request origin and APP_BASE_URL, refuses others and missing', () => {
    expect(isSameOrigin(request('/x', { method: 'POST' }))).toBe(true)
    vi.stubEnv('APP_BASE_URL', 'https://dash.example')
    expect(isSameOrigin(request('/x', { method: 'POST', origin: 'https://dash.example' }))).toBe(true)
    expect(isSameOrigin(request('/x', { method: 'POST', origin: 'https://evil.example' }))).toBe(false)
    expect(isSameOrigin(request('/x', { method: 'POST', origin: null }))).toBe(false)
  })
})

describe('requireAccount', () => {
  it('answers 503 when the login system is not configured', async () => {
    vi.stubEnv('DASHBOARD_SESSION_SECRET', '')
    const r = await requireAccount(request('/x'), 'signed-in')
    expect('denied' in r && r.denied.status).toBe(503)
  })

  it('answers 401 without a session', async () => {
    const r = await requireAccount(request('/x'), 'signed-in')
    expect('denied' in r && r.denied.status).toBe(401)
  })

  it('answers 403 when a user calls an admin API', async () => {
    const r = await requireAccount(request('/x', { cookie: sessionCookie(USER_ID) }), 'admin')
    expect('denied' in r && r.denied.status).toBe(403)
  })

  it('returns the account when the role is enough', async () => {
    const r = await requireAccount(request('/x', { cookie: sessionCookie(USER_ID) }), 'signed-in')
    expect('account' in r && r.account.id).toBe(USER_ID)
    vi.mocked(getAccountById).mockResolvedValue(accountRow({ role: 'admin' }))
    const a = await requireAccount(request('/x', { cookie: sessionCookie(USER_ID) }), 'admin')
    expect('account' in a && a.account.role).toBe('admin')
  })

  it('answers 500 (not 200) when the database lookup fails', async () => {
    const logged = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.mocked(getAccountById).mockRejectedValue(new Error('db down'))
    const r = await requireAccount(request('/x', { cookie: sessionCookie(USER_ID) }), 'signed-in')
    expect('denied' in r && r.denied.status).toBe(500)
    expect(logged).toHaveBeenCalled()
    logged.mockRestore()
  })
})
