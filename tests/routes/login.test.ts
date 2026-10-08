import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { POST as forgot } from '@/app/api/auth/forgot-password/route'
import { POST as login } from '@/app/api/auth/login/route'
import { POST as logout } from '@/app/api/auth/logout/route'
import { POST as reset } from '@/app/api/auth/reset-password/route'
import { GET as session } from '@/app/api/auth/session/route'
import { getAccountByEmail, getAccountById, updateAccounts } from '@/lib/auth/accounts'
import { sendPasswordResetEmail } from '@/lib/auth/mailers'
import { AuthApiError, updateAuthUserPassword, verifyPassword } from '@/lib/auth/supabase-auth'
import { signToken } from '@/lib/auth/tokens'
import { accountRow, request, SECRET, sessionCookie, stubAuthEnv, USER_ID } from '@/tests/fixtures'

vi.mock('@/lib/auth/accounts', async (orig) => ({
  ...(await orig<typeof import('@/lib/auth/accounts')>()),
  getAccountByEmail: vi.fn(),
  getAccountById: vi.fn(),
  updateAccounts: vi.fn(),
}))
vi.mock('@/lib/auth/supabase-auth', async (orig) => ({
  ...(await orig<typeof import('@/lib/auth/supabase-auth')>()),
  verifyPassword: vi.fn(),
  updateAuthUserPassword: vi.fn(),
}))
vi.mock('@/lib/auth/mailers', () => ({ sendPasswordResetEmail: vi.fn() }))

const loginReq = (b: Record<string, unknown>) => request('/api/auth/login', { body: b })

beforeEach(() => {
  stubAuthEnv()
  vi.resetAllMocks()
  vi.mocked(verifyPassword).mockResolvedValue(USER_ID)
  vi.mocked(getAccountById).mockResolvedValue(accountRow())
})
afterEach(() => vi.unstubAllEnvs())

describe('POST /api/auth/login', () => {
  it('logs an active user in, sets the session cookie and sends them to /map', async () => {
    const res = await login(loginReq({ email: 'somchai@example.com', password: 'password123' }))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true, redirect: '/map' })
    expect(res.cookies.get('dash_session')?.value).toBeTruthy()
  })

  it('normalizes the email before checking the password', async () => {
    await login(loginReq({ email: '  Somchai@Example.COM ', password: 'password123' }))
    expect(verifyPassword).toHaveBeenCalledWith('somchai@example.com', 'password123')
  })

  it('honours next for an admin, but never sends a user into /admin', async () => {
    vi.mocked(getAccountById).mockResolvedValue(accountRow({ role: 'admin' }))
    const admin = await login(loginReq({ email: 'a@b.co', password: 'x', next: '/admin/users' }))
    expect((await admin.json()).redirect).toBe('/admin/users')

    vi.mocked(getAccountById).mockResolvedValue(accountRow({ role: 'user' }))
    const user = await login(loginReq({ email: 'a@b.co', password: 'x', next: '/admin/users' }))
    expect((await user.json()).redirect).toBe('/map')
  })

  it('answers 401 for a wrong password', async () => {
    vi.mocked(verifyPassword).mockResolvedValue(null)
    const res = await login(loginReq({ email: 'a@b.co', password: 'wrong' }))
    expect(res.status).toBe(401)
    expect(res.cookies.get('dash_session')).toBeUndefined()
  })

  it('answers 401 for a Supabase user that has no dashboard account', async () => {
    vi.mocked(getAccountById).mockResolvedValue(null)
    expect((await login(loginReq({ email: 'a@b.co', password: 'x' }))).status).toBe(401)
  })

  it.each(['unverified', 'pending', 'disabled'] as const)('answers 403 with reason for a %s account, without a cookie', async (status) => {
    vi.mocked(getAccountById).mockResolvedValue(accountRow({ status }))
    const res = await login(loginReq({ email: 'a@b.co', password: 'x' }))
    expect(res.status).toBe(403)
    expect((await res.json()).reason).toBe(status)
    expect(res.cookies.get('dash_session')).toBeUndefined()
  })

  it('answers 429 with a Thai message when Supabase rate-limits sign-ins', async () => {
    vi.mocked(verifyPassword).mockRejectedValue(new AuthApiError(429, 'rate limited'))
    const res = await login(loginReq({ email: 'a@b.co', password: 'x' }))
    expect(res.status).toBe(429)
    expect((await res.json()).error).toMatch(/บ่อยเกินไป/)
  })

  it('answers 400 when fields are missing', async () => {
    expect((await login(loginReq({ email: '', password: '' }))).status).toBe(400)
  })
})

describe('session and logout', () => {
  it('returns the signed-in account, or 401', async () => {
    const ok = await session(request('/api/auth/session', { cookie: sessionCookie(USER_ID) }))
    expect(ok.status).toBe(200)
    expect((await ok.json()).account).toMatchObject({ id: USER_ID, role: 'user', fullName: 'สมชาย ใจดี' })
    expect((await session(request('/api/auth/session'))).status).toBe(401)
  })

  it('logout clears the cookie, and refuses cross-site calls', async () => {
    const res = await logout(request('/api/auth/logout', { method: 'POST' }))
    expect(res.status).toBe(200)
    expect(res.cookies.get('dash_session')?.value).toBe('')
    expect((await logout(request('/api/auth/logout', { method: 'POST', origin: 'https://evil.example' }))).status).toBe(403)
  })
})

describe('POST /api/auth/forgot-password', () => {
  it('sends a reset link for non-disabled accounts and always answers ok', async () => {
    for (const status of ['active', 'pending', 'unverified'] as const) {
      vi.mocked(getAccountByEmail).mockResolvedValueOnce(accountRow({ status }))
      expect((await forgot(request('/api/auth/forgot-password', { body: { email: 'a@b.co' } }))).status).toBe(200)
    }
    expect(sendPasswordResetEmail).toHaveBeenCalledTimes(3)

    vi.mocked(getAccountByEmail).mockResolvedValueOnce(accountRow({ status: 'disabled' }))
    expect((await forgot(request('/api/auth/forgot-password', { body: { email: 'a@b.co' } }))).status).toBe(200)
    vi.mocked(getAccountByEmail).mockResolvedValueOnce(null)
    expect((await forgot(request('/api/auth/forgot-password', { body: { email: 'nobody@b.co' } }))).status).toBe(200)
    expect(sendPasswordResetEmail).toHaveBeenCalledTimes(3)
  })
})

describe('POST /api/auth/reset-password', () => {
  const account = accountRow()
  const sva = Date.parse(account.sessions_valid_after)
  const resetToken = (over: { sva?: number } = {}) =>
    signToken(SECRET, 'reset-password', { sub: USER_ID, sva, exp: Date.now() + 60_000, ...over })
  const resetReq = (token: string, password = 'newpassword1') => request('/api/auth/reset-password', { body: { token, password } })

  it('claims the link by bumping sessions_valid_after, then sets the new password', async () => {
    vi.mocked(updateAccounts).mockResolvedValue([account])
    const res = await reset(resetReq(resetToken()))
    expect(res.status).toBe(200)
    const [filters, patch] = vi.mocked(updateAccounts).mock.calls[0]
    expect(filters).toEqual({ id: `eq.${USER_ID}`, sessions_valid_after: `eq.${account.sessions_valid_after}` })
    expect(Object.keys(patch)).toEqual(['sessions_valid_after'])
    expect(updateAuthUserPassword).toHaveBeenCalledWith(USER_ID, 'newpassword1')
  })

  it('answers 400 for a link issued before the last reset (already used)', async () => {
    const res = await reset(resetReq(resetToken({ sva: sva - 1 })))
    expect(res.status).toBe(400)
    expect(updateAccounts).not.toHaveBeenCalled()
    expect(updateAuthUserPassword).not.toHaveBeenCalled()
  })

  it('answers 400 when another request used the link first', async () => {
    vi.mocked(updateAccounts).mockResolvedValue([])
    expect((await reset(resetReq(resetToken()))).status).toBe(400)
    expect(updateAuthUserPassword).not.toHaveBeenCalled()
  })

  it('answers 400 for a disabled account, a weak password or a verify-email token', async () => {
    vi.mocked(getAccountById).mockResolvedValueOnce(accountRow({ status: 'disabled' }))
    expect((await reset(resetReq(resetToken()))).status).toBe(400)
    expect((await reset(resetReq(resetToken(), 'short'))).status).toBe(400)
    const wrongPurpose = signToken(SECRET, 'verify-email', { sub: USER_ID, sva, exp: Date.now() + 60_000 })
    expect((await reset(resetReq(wrongPurpose))).status).toBe(400)
    expect(updateAuthUserPassword).not.toHaveBeenCalled()
  })

  it('answers 400 with a clear message when Supabase rejects the new password as weak', async () => {
    vi.mocked(updateAccounts).mockResolvedValue([account])
    vi.mocked(updateAuthUserPassword).mockRejectedValue(new AuthApiError(422, 'weak_password', 'weak_password'))
    const res = await reset(resetReq(resetToken()))
    expect(res.status).toBe(400)
    expect((await res.json()).error).toMatch(/ข้อกำหนด/)
  })
})
