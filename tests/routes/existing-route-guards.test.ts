import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { PATCH as patchFormulas } from '@/app/api/admin/formulas/route'
import { GET as wasteDashboard } from '@/app/api/waste/dashboard/route'
import { GET as wasteDashboardLegacy } from '@/app/api/waste-dashboard/route'
import { getAccountById } from '@/lib/auth/accounts'
import { request, stubAuthEnv } from '@/tests/fixtures'

vi.mock('@/lib/auth/accounts', async (orig) => ({
  ...(await orig<typeof import('@/lib/auth/accounts')>()),
  getAccountById: vi.fn(),
}))

beforeEach(() => {
  stubAuthEnv()
  vi.resetAllMocks()
})
afterEach(() => vi.unstubAllEnvs())

describe('guards on existing routes', () => {
  it.each([
    ['/api/waste-dashboard', wasteDashboardLegacy],
    ['/api/waste/dashboard', wasteDashboard],
  ])('GET %s without a session answers 401', async (path, GET) => {
    expect((await GET(request(path))).status).toBe(401)
    expect(getAccountById).not.toHaveBeenCalled()
  })

  it('PATCH /api/admin/formulas from another origin answers 403', async () => {
    const res = await patchFormulas(request('/api/admin/formulas', { method: 'PATCH', body: {}, origin: 'https://evil.example' }))
    expect(res.status).toBe(403)
  })

  it('PATCH /api/admin/formulas from the site itself still needs a session (401)', async () => {
    const res = await patchFormulas(request('/api/admin/formulas', { method: 'PATCH', body: {} }))
    expect(res.status).toBe(401)
  })
})
