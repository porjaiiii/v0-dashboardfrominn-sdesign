import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DELETE as remove, PATCH as patch } from '@/app/api/admin/accounts/[id]/route'
import { GET as list } from '@/app/api/admin/accounts/route'
import { getAccountById, listAccounts, updateAccounts, type AccountRow } from '@/lib/auth/accounts'
import { sendDecisionEmail } from '@/lib/auth/mailers'
import { deleteAuthUser } from '@/lib/auth/supabase-auth'
import { accountRow, ADMIN_ID, request, ROOT_ID, sessionCookie, stubAuthEnv, USER_ID } from '@/tests/fixtures'

vi.mock('@/lib/auth/accounts', async (orig) => ({
  ...(await orig<typeof import('@/lib/auth/accounts')>()),
  getAccountById: vi.fn(),
  listAccounts: vi.fn(),
  updateAccounts: vi.fn(),
}))
vi.mock('@/lib/auth/supabase-auth', async (orig) => ({
  ...(await orig<typeof import('@/lib/auth/supabase-auth')>()),
  deleteAuthUser: vi.fn(),
}))
vi.mock('@/lib/auth/mailers', () => ({ sendDecisionEmail: vi.fn() }))

const rows: Record<string, AccountRow> = {}
const ctx = (id: string) => ({ params: Promise.resolve({ id }) })
const asAdmin = { cookie: sessionCookie(ADMIN_ID) }

beforeEach(() => {
  stubAuthEnv()
  vi.resetAllMocks()
  rows[ADMIN_ID] = accountRow({ id: ADMIN_ID, email: 'admin@example.com', role: 'admin' })
  rows[ROOT_ID] = accountRow({ id: ROOT_ID, email: 'root@example.com', role: 'admin', is_root: true })
  rows[USER_ID] = accountRow({ id: USER_ID, status: 'pending', approved_at: null, approved_by: null })
  vi.mocked(getAccountById).mockImplementation(async (id) => rows[id] ?? null)
  vi.mocked(sendDecisionEmail).mockResolvedValue(true)
})
afterEach(() => vi.unstubAllEnvs())

describe('access', () => {
  it('answers 401 without a session and 403 for a user', async () => {
    expect((await list(request('/api/admin/accounts'))).status).toBe(401)
    rows[USER_ID] = accountRow({ id: USER_ID, role: 'user', status: 'active' })
    expect((await list(request('/api/admin/accounts', { cookie: sessionCookie(USER_ID) }))).status).toBe(403)
    const res = await patch(request(`/api/admin/accounts/${ADMIN_ID}`, { method: 'PATCH', body: { action: 'disable' }, cookie: sessionCookie(USER_ID) }), ctx(ADMIN_ID))
    expect(res.status).toBe(403)
    expect(updateAccounts).not.toHaveBeenCalled()
  })

  it('lists accounts for an admin', async () => {
    vi.mocked(listAccounts).mockResolvedValue({ rows: [], total: 0 })
    const res = await list(request('/api/admin/accounts?status=pending&page=1', asAdmin))
    expect(res.status).toBe(200)
    expect(vi.mocked(listAccounts).mock.calls[0][0]).toMatchObject({ status: 'pending', page: 1 })
  })
})

describe('PATCH /api/admin/accounts/:id', () => {
  const act = (id: string, body: unknown, origin?: string) =>
    patch(request(`/api/admin/accounts/${id}`, { method: 'PATCH', body, origin, ...asAdmin }), ctx(id))

  it('approves a pending account as admin with a conditional update and emails the person', async () => {
    const approved = { ...rows[USER_ID], status: 'active' as const, role: 'admin' as const }
    vi.mocked(updateAccounts).mockResolvedValue([approved])
    const res = await act(USER_ID, { action: 'approve', role: 'admin' })
    expect(res.status).toBe(200)
    expect(await res.json()).toMatchObject({ emailSent: true, account: { status: 'active', role: 'admin' } })
    const [filters, patchBody] = vi.mocked(updateAccounts).mock.calls[0]
    expect(filters).toEqual({ id: `eq.${USER_ID}`, status: 'eq.pending', is_root: 'is.false' })
    expect(patchBody).toMatchObject({ status: 'active', role: 'admin', approved_by: ADMIN_ID })
    expect(sendDecisionEmail).toHaveBeenCalledWith(approved, 'approved')
  })

  it('reports emailSent false when the decision email fails, but keeps the change', async () => {
    vi.mocked(updateAccounts).mockResolvedValue([{ ...rows[USER_ID], status: 'disabled' }])
    vi.mocked(sendDecisionEmail).mockResolvedValue(false)
    const res = await act(USER_ID, { action: 'reject' })
    expect(res.status).toBe(200)
    expect((await res.json()).emailSent).toBe(false)
  })

  it('answers 409 when another admin changed the account first', async () => {
    vi.mocked(updateAccounts).mockResolvedValue([])
    const res = await act(USER_ID, { action: 'approve', role: 'user' })
    expect(res.status).toBe(409)
    expect(sendDecisionEmail).not.toHaveBeenCalled()
  })

  it('refuses to change the root account or your own account', async () => {
    expect((await act(ROOT_ID, { action: 'disable' })).status).toBe(403)
    expect((await act(ADMIN_ID, { action: 'set-role', role: 'user' })).status).toBe(403)
    expect(updateAccounts).not.toHaveBeenCalled()
  })

  it('answers 404 for an unknown account, 400 for a bad action, 403 cross-site', async () => {
    expect((await act('44444444-4444-4444-8444-444444444444', { action: 'disable' })).status).toBe(404)
    expect((await act(USER_ID, { action: 'nuke' })).status).toBe(400)
    expect((await act(USER_ID, { action: 'reject' }, 'https://evil.example')).status).toBe(403)
  })
})

describe('DELETE /api/admin/accounts/:id', () => {
  const del = (id: string) => remove(request(`/api/admin/accounts/${id}`, { method: 'DELETE', ...asAdmin }), ctx(id))

  it('deletes the Supabase Auth user (the row cascades)', async () => {
    expect((await del(USER_ID)).status).toBe(200)
    expect(deleteAuthUser).toHaveBeenCalledWith(USER_ID)
  })

  it('refuses root and self, and answers 404 for unknown ids', async () => {
    expect((await del(ROOT_ID)).status).toBe(403)
    expect((await del(ADMIN_ID)).status).toBe(403)
    expect((await del('44444444-4444-4444-8444-444444444444')).status).toBe(404)
    expect(deleteAuthUser).not.toHaveBeenCalled()
  })
})
