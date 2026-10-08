import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { POST as resend } from '@/app/api/auth/resend-verification/route'
import { POST as signup } from '@/app/api/auth/signup/route'
import { POST as verify } from '@/app/api/auth/verify-email/route'
import { countRecentSignups, getAccountByEmail, getAccountById, updateAccounts } from '@/lib/auth/accounts'
import { notifyRootOfSignup, sendVerificationEmail } from '@/lib/auth/mailers'
import { SIGNUP_BUSY_MESSAGE, SIGNUP_HOURLY_CAP, SIGNUP_PASSWORD_MISMATCH_MESSAGE, TOO_MANY_ATTEMPTS_MESSAGE } from '@/lib/auth/policy'
import { AuthApiError, createAuthUser, updateAuthUserPassword, verifyPassword } from '@/lib/auth/supabase-auth'
import { signToken } from '@/lib/auth/tokens'
import { accountRow, request, ROOT_ID, SECRET, stubAuthEnv, USER_ID } from '@/tests/fixtures'

vi.mock('@/lib/auth/accounts', async (orig) => ({
  ...(await orig<typeof import('@/lib/auth/accounts')>()),
  getAccountByEmail: vi.fn(),
  getAccountById: vi.fn(),
  countRecentSignups: vi.fn(),
  updateAccounts: vi.fn(),
}))
vi.mock('@/lib/auth/supabase-auth', async (orig) => ({
  ...(await orig<typeof import('@/lib/auth/supabase-auth')>()),
  createAuthUser: vi.fn(),
  updateAuthUserPassword: vi.fn(),
  verifyPassword: vi.fn(),
}))
vi.mock('@/lib/auth/mailers', () => ({ sendVerificationEmail: vi.fn(), notifyRootOfSignup: vi.fn() }))

const body = { fullName: 'สมชาย ใจดี', email: 'somchai@example.com', password: 'password123' }
const signupReq = (b: unknown = body, origin?: string | null) => request('/api/auth/signup', { body: b, origin })

beforeEach(() => {
  stubAuthEnv()
  vi.resetAllMocks()
  vi.mocked(sendVerificationEmail).mockResolvedValue(true)
  vi.mocked(notifyRootOfSignup).mockResolvedValue(true)
  vi.mocked(countRecentSignups).mockResolvedValue(0)
})
afterEach(() => vi.unstubAllEnvs())

describe('POST /api/auth/signup', () => {
  it('creates an unverified account and emails the confirmation link', async () => {
    const created = accountRow({ status: 'unverified' })
    vi.mocked(getAccountByEmail).mockResolvedValue(null)
    vi.mocked(createAuthUser).mockResolvedValue(USER_ID)
    vi.mocked(getAccountById).mockResolvedValue(created)

    const res = await signup(signupReq())
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true, emailSent: true })
    expect(createAuthUser).toHaveBeenCalledWith({ fullName: 'สมชาย ใจดี', email: 'somchai@example.com', password: 'password123' })
    expect(sendVerificationEmail).toHaveBeenCalledWith(created)
  })

  it('normalizes the email before checking and creating', async () => {
    vi.mocked(getAccountByEmail).mockResolvedValue(null)
    vi.mocked(createAuthUser).mockResolvedValue(USER_ID)
    vi.mocked(getAccountById).mockResolvedValue(accountRow({ status: 'unverified' }))
    await signup(signupReq({ ...body, email: '  Somchai@Example.COM ' }))
    expect(getAccountByEmail).toHaveBeenCalledWith('somchai@example.com')
    expect(vi.mocked(createAuthUser).mock.calls[0][0].email).toBe('somchai@example.com')
  })

  it('still succeeds with emailSent false when email cannot be sent (e.g. Gmail not configured)', async () => {
    vi.mocked(getAccountByEmail).mockResolvedValue(null)
    vi.mocked(createAuthUser).mockResolvedValue(USER_ID)
    vi.mocked(getAccountById).mockResolvedValue(accountRow({ status: 'unverified' }))
    vi.mocked(sendVerificationEmail).mockResolvedValue(false)
    const res = await signup(signupReq())
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true, emailSent: false })
  })

  it('refreshes an unverified account instead of creating a new one', async () => {
    const existing = accountRow({ status: 'unverified', full_name: 'ชื่อเก่า' })
    const refreshed = { ...existing, full_name: 'สมชาย ใจดี' }
    vi.mocked(getAccountByEmail).mockResolvedValue(existing)
    vi.mocked(updateAccounts).mockResolvedValue([refreshed])

    const res = await signup(signupReq())
    expect(res.status).toBe(200)
    expect(createAuthUser).not.toHaveBeenCalled()
    expect(updateAccounts).toHaveBeenCalledWith({ id: `eq.${USER_ID}`, status: 'eq.unverified' }, { full_name: 'สมชาย ใจดี' })
    expect(updateAuthUserPassword).toHaveBeenCalledWith(USER_ID, 'password123')
    expect(sendVerificationEmail).toHaveBeenCalledWith(refreshed)
  })

  it('answers 429 and creates nothing when the hourly sign-up cap is reached', async () => {
    vi.mocked(getAccountByEmail).mockResolvedValue(null)
    vi.mocked(countRecentSignups).mockResolvedValue(SIGNUP_HOURLY_CAP)
    const res = await signup(signupReq())
    expect(res.status).toBe(429)
    expect((await res.json()).error).toBe(SIGNUP_BUSY_MESSAGE)
    expect(createAuthUser).not.toHaveBeenCalled()
    const since = Date.parse(vi.mocked(countRecentSignups).mock.calls[0][0])
    expect(Date.now() - since).toBeGreaterThan(59 * 60_000)
    expect(Date.now() - since).toBeLessThan(61 * 60_000)
  })

  it('does not consult the cap when refreshing an unverified account', async () => {
    const existing = accountRow({ status: 'unverified' })
    vi.mocked(getAccountByEmail).mockResolvedValue(existing)
    vi.mocked(updateAccounts).mockResolvedValue([existing])
    vi.mocked(countRecentSignups).mockResolvedValue(SIGNUP_HOURLY_CAP + 5)
    expect((await signup(signupReq())).status).toBe(200)
    expect(countRecentSignups).not.toHaveBeenCalled()
  })

  it('does not change the password if the account got verified meanwhile', async () => {
    vi.mocked(getAccountByEmail).mockResolvedValue(accountRow({ status: 'unverified' }))
    vi.mocked(updateAccounts).mockResolvedValue([])
    const res = await signup(signupReq())
    expect(res.status).toBe(409)
    expect(updateAuthUserPassword).not.toHaveBeenCalled()
  })

  it.each(['pending', 'active', 'disabled'] as const)('answers 409 for an existing %s account', async (status) => {
    vi.mocked(getAccountByEmail).mockResolvedValue(accountRow({ status }))
    expect((await signup(signupReq())).status).toBe(409)
    expect(createAuthUser).not.toHaveBeenCalled()
  })

  it('answers 409 when Supabase says the email already exists (race)', async () => {
    vi.mocked(getAccountByEmail).mockResolvedValue(null)
    vi.mocked(createAuthUser).mockRejectedValue(new AuthApiError(422, 'email_exists', 'email_exists'))
    expect((await signup(signupReq())).status).toBe(409)
  })

  it('answers 400 for invalid input', async () => {
    expect((await signup(signupReq({ ...body, password: 'short' }))).status).toBe(400)
    expect((await signup(signupReq({ ...body, email: 'nope' }))).status).toBe(400)
    expect((await signup(signupReq({ ...body, fullName: '   ' }))).status).toBe(400)
  })

  it('refuses cross-site and origin-less requests', async () => {
    expect((await signup(signupReq(body, 'https://evil.example'))).status).toBe(403)
    expect((await signup(signupReq(body, null))).status).toBe(403)
  })

  it('answers 503 when the login system is not configured', async () => {
    vi.stubEnv('DASHBOARD_SESSION_SECRET', '')
    expect((await signup(signupReq())).status).toBe(503)
  })

  it('answers 400 (not "already registered") when Supabase rejects the password as weak', async () => {
    vi.mocked(getAccountByEmail).mockResolvedValue(null)
    vi.mocked(createAuthUser).mockRejectedValue(new AuthApiError(422, 'weak_password', 'weak_password'))
    const res = await signup(signupReq())
    expect(res.status).toBe(400)
    expect((await res.json()).error).toMatch(/ข้อกำหนด/)
  })

  it('answers 500 for other Supabase Auth failures', async () => {
    vi.mocked(getAccountByEmail).mockResolvedValue(null)
    vi.mocked(createAuthUser).mockRejectedValue(new AuthApiError(500, 'Database error creating new user'))
    const logged = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect((await signup(signupReq())).status).toBe(500)
    expect(logged).toHaveBeenCalled()
    logged.mockRestore()
  })
})

describe('POST /api/auth/verify-email', () => {
  const tokenFor = (purpose: 'verify-email' | 'reset-password' = 'verify-email') =>
    signToken(SECRET, purpose, { sub: USER_ID, exp: Date.now() + 60_000 })
  const verifyReq = (b: Record<string, unknown> = {}) =>
    request('/api/auth/verify-email', { body: { token: tokenFor(), password: 'password123', ...b } })

  beforeEach(() => {
    vi.mocked(getAccountById).mockResolvedValue(accountRow({ status: 'unverified' }))
    vi.mocked(verifyPassword).mockResolvedValue(USER_ID)
  })

  it('moves unverified → pending with the right password and notifies the root admin', async () => {
    const pending = accountRow({ status: 'pending' })
    vi.mocked(updateAccounts).mockResolvedValue([pending])
    const res = await verify(verifyReq())
    expect(res.status).toBe(200)
    expect(verifyPassword).toHaveBeenCalledWith(accountRow().email, 'password123')
    const [filters, patch] = vi.mocked(updateAccounts).mock.calls[0]
    expect(filters).toEqual({ id: `eq.${USER_ID}`, status: 'eq.unverified' })
    expect(patch).toMatchObject({ status: 'pending' })
    expect(notifyRootOfSignup).toHaveBeenCalledWith(pending)
  })

  it.each([null, ROOT_ID])('answers 401 for a wrong password (verifyPassword → %s)', async (id) => {
    vi.mocked(verifyPassword).mockResolvedValue(id)
    const res = await verify(verifyReq())
    expect(res.status).toBe(401)
    expect((await res.json()).error).toBe(SIGNUP_PASSWORD_MISMATCH_MESSAGE)
    expect(updateAccounts).not.toHaveBeenCalled()
    expect(notifyRootOfSignup).not.toHaveBeenCalled()
  })

  it('answers 400 when the link was already used (account no longer unverified) without asking Supabase', async () => {
    vi.mocked(getAccountById).mockResolvedValue(accountRow({ status: 'pending' }))
    expect((await verify(verifyReq())).status).toBe(400)
    expect(verifyPassword).not.toHaveBeenCalled()
    vi.mocked(getAccountById).mockResolvedValue(null)
    expect((await verify(verifyReq())).status).toBe(400)
    expect(verifyPassword).not.toHaveBeenCalled()
  })

  it('rejects a reset-password token and garbage without touching the database', async () => {
    for (const token of [tokenFor('reset-password'), 'garbage', '']) {
      expect((await verify(verifyReq({ token }))).status).toBe(400)
    }
    expect(getAccountById).not.toHaveBeenCalled()
    expect(updateAccounts).not.toHaveBeenCalled()
  })

  it('answers 400 for an empty password without touching the database', async () => {
    const res = await verify(verifyReq({ password: '' }))
    expect(res.status).toBe(400)
    expect((await res.json()).error).toBe('กรุณากรอกรหัสผ่าน')
    expect(getAccountById).not.toHaveBeenCalled()
  })

  it('answers 400 when the conditional update misses (race)', async () => {
    vi.mocked(updateAccounts).mockResolvedValue([])
    expect((await verify(verifyReq())).status).toBe(400)
    expect(notifyRootOfSignup).not.toHaveBeenCalled()
  })

  it('answers 429 when Supabase rate-limits the password check', async () => {
    vi.mocked(verifyPassword).mockRejectedValue(new AuthApiError(429, 'over_request_rate_limit'))
    const res = await verify(verifyReq())
    expect(res.status).toBe(429)
    expect((await res.json()).error).toBe(TOO_MANY_ATTEMPTS_MESSAGE)
    expect(updateAccounts).not.toHaveBeenCalled()
  })

  it('still succeeds when notifying the root admin fails', async () => {
    vi.mocked(updateAccounts).mockResolvedValue([accountRow({ status: 'pending' })])
    vi.mocked(notifyRootOfSignup).mockRejectedValue(new Error('smtp down'))
    const logged = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect((await verify(verifyReq())).status).toBe(200)
    expect(logged).toHaveBeenCalled()
    logged.mockRestore()
  })
})

describe('POST /api/auth/resend-verification', () => {
  it('resends only for unverified accounts and always answers ok', async () => {
    vi.mocked(getAccountByEmail).mockResolvedValueOnce(accountRow({ status: 'unverified' }))
    expect((await resend(request('/api/auth/resend-verification', { body: { email: 'Somchai@example.com' } }))).status).toBe(200)
    expect(sendVerificationEmail).toHaveBeenCalledTimes(1)

    vi.mocked(getAccountByEmail).mockResolvedValueOnce(accountRow({ status: 'active' }))
    expect((await resend(request('/api/auth/resend-verification', { body: { email: 'somchai@example.com' } }))).status).toBe(200)
    vi.mocked(getAccountByEmail).mockResolvedValueOnce(null)
    expect((await resend(request('/api/auth/resend-verification', { body: { email: 'nobody@example.com' } }))).status).toBe(200)
    expect(sendVerificationEmail).toHaveBeenCalledTimes(1)
  })
})
