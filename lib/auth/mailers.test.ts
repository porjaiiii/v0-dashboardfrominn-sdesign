import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { sendMail } from '@/lib/email'
import { accountRow, ORIGIN, ROOT_ID, SECRET, stubAuthEnv } from '@/tests/fixtures'
import { claimEmailSlot, getRootAccount } from './accounts'
import { notifyRootOfSignup, sendDecisionEmail, sendPasswordResetEmail, sendVerificationEmail } from './mailers'
import { verifyToken } from './tokens'

vi.mock('@/lib/email', () => ({ sendMail: vi.fn() }))
vi.mock('./accounts', () => ({ claimEmailSlot: vi.fn(), getRootAccount: vi.fn() }))

const NOW = Date.parse('2026-10-08T03:00:00.000Z')
const sent = () => vi.mocked(sendMail).mock.calls.map(([m]) => m)
const tokenIn = (text: string) => decodeURIComponent(/token=([^\s&]+)/.exec(text)![1])

beforeEach(() => {
  stubAuthEnv()
  vi.mocked(sendMail).mockReset().mockResolvedValue(true)
  vi.mocked(claimEmailSlot).mockReset().mockResolvedValue(true)
  vi.mocked(getRootAccount).mockReset()
})
afterEach(() => vi.unstubAllEnvs())

describe('sendVerificationEmail', () => {
  it('emails a 24 h verify-email link to the account', async () => {
    const account = accountRow({ status: 'unverified' })
    expect(await sendVerificationEmail(account, NOW)).toBe(true)
    const [m] = sent()
    expect(m.to).toBe(account.email)
    expect(m.text).toContain(`${ORIGIN}/verify-email?token=`)
    const claims = verifyToken(SECRET, 'verify-email', tokenIn(m.text), NOW)
    expect(claims).toMatchObject({ sub: account.id, exp: NOW + 24 * 60 * 60 * 1000 })
  })

  it('sends nothing while cooling down', async () => {
    vi.mocked(claimEmailSlot).mockResolvedValue(false)
    expect(await sendVerificationEmail(accountRow(), NOW)).toBe(false)
    expect(sendMail).not.toHaveBeenCalled()
  })

  it('sends nothing on production without APP_BASE_URL', async () => {
    vi.stubEnv('APP_BASE_URL', '')
    vi.stubEnv('NODE_ENV', 'production')
    const logged = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(await sendVerificationEmail(accountRow(), NOW)).toBe(false)
    expect(sendMail).not.toHaveBeenCalled()
    expect(logged).toHaveBeenCalled()
    logged.mockRestore()
  })
})

describe('sendPasswordResetEmail', () => {
  it('ties the 1 h reset link to the current sessions_valid_after', async () => {
    const account = accountRow()
    expect(await sendPasswordResetEmail(account, NOW)).toBe(true)
    const claims = verifyToken(SECRET, 'reset-password', tokenIn(sent()[0].text), NOW)
    expect(claims).toMatchObject({ sub: account.id, sva: Date.parse(account.sessions_valid_after), exp: NOW + 60 * 60 * 1000 })
  })
})

describe('notifyRootOfSignup', () => {
  it('emails only the root admin, linking to the pending list', async () => {
    vi.mocked(getRootAccount).mockResolvedValue(accountRow({ id: ROOT_ID, email: 'root@example.com', role: 'admin', is_root: true }))
    expect(await notifyRootOfSignup(accountRow({ status: 'pending', email: 'new@example.com' }))).toBe(true)
    const [m] = sent()
    expect(m.to).toBe('root@example.com')
    expect(m.text).toContain('new@example.com')
    expect(m.text).toContain(`${ORIGIN}/admin/accounts?status=pending`)
  })

  it('returns false when there is no root admin yet', async () => {
    vi.mocked(getRootAccount).mockResolvedValue(null)
    const logged = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(await notifyRootOfSignup(accountRow())).toBe(false)
    expect(sendMail).not.toHaveBeenCalled()
    expect(logged).toHaveBeenCalled()
    logged.mockRestore()
  })
})

describe('sendDecisionEmail', () => {
  it('sends approval with a login link, and rejection without one', async () => {
    await sendDecisionEmail(accountRow({ role: 'admin' }), 'approved')
    await sendDecisionEmail(accountRow(), 'rejected')
    const [approved, rejected] = sent()
    expect(approved.text).toContain(`${ORIGIN}/login`)
    expect(rejected.text).not.toContain('http')
  })
})
