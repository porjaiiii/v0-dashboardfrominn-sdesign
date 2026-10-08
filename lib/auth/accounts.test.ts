import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { stubAuthEnv, USER_ID } from '@/tests/fixtures'
import { claimEmailSlot, getAccountByEmail, getAccountById, listAccounts } from './accounts'

const fetchMock = vi.fn()

const reply = (rows: unknown[], total = rows.length) =>
  new Response(JSON.stringify(rows), { status: 200, headers: { 'content-range': `0-${Math.max(0, rows.length - 1)}/${total}` } })

const call = (i = 0) => {
  const [url, init] = fetchMock.mock.calls[i] as [string, RequestInit]
  return { url: new URL(url), init, headers: new Headers(init.headers) }
}

beforeEach(() => {
  stubAuthEnv()
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
})
afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe('dashboard.accounts reads', () => {
  it('returns null for a non-uuid id without calling Supabase', async () => {
    expect(await getAccountById('not-a-uuid')).toBeNull()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('reads by id from the dashboard schema', async () => {
    fetchMock.mockResolvedValue(reply([{ id: USER_ID }]))
    expect(await getAccountById(USER_ID)).toEqual({ id: USER_ID })
    const { url, headers } = call()
    expect(url.pathname).toBe('/rest/v1/accounts')
    expect(url.searchParams.get('id')).toBe(`eq.${USER_ID}`)
    expect(headers.get('Accept-Profile')).toBe('dashboard')
  })

  it('normalizes the email before looking it up', async () => {
    fetchMock.mockResolvedValue(reply([]))
    expect(await getAccountByEmail('  Somchai@Example.COM ')).toBeNull()
    expect(call().url.searchParams.get('email')).toBe('eq.somchai@example.com')
  })
})

describe('claimEmailSlot', () => {
  const NOW = Date.parse('2026-10-08T03:00:00.000Z')

  it('claims only when the last email is older than 60 s, in one conditional update', async () => {
    fetchMock.mockResolvedValue(reply([{ id: USER_ID }]))
    expect(await claimEmailSlot(USER_ID, NOW)).toBe(true)
    const { url, init, headers } = call()
    expect(init.method).toBe('PATCH')
    expect(headers.get('Content-Profile')).toBe('dashboard')
    expect(url.searchParams.get('id')).toBe(`eq.${USER_ID}`)
    expect(url.searchParams.get('or')).toBe('(last_email_sent_at.is.null,last_email_sent_at.lt.2026-10-08T02:59:00.000Z)')
    expect(JSON.parse(String(init.body))).toEqual({ last_email_sent_at: '2026-10-08T03:00:00.000Z' })
  })

  it('returns false when the update matched no row (still cooling down)', async () => {
    fetchMock.mockResolvedValue(reply([]))
    expect(await claimEmailSlot(USER_ID, NOW)).toBe(false)
  })
})

describe('listAccounts', () => {
  it('filters by a known status and searches name/email', async () => {
    fetchMock.mockResolvedValue(reply([], 0))
    await listAccounts({ page: 2, pageSize: 10, status: 'pending', q: 'som(chai)' })
    const { url } = call()
    expect(url.searchParams.get('status')).toBe('eq.pending')
    expect(url.searchParams.get('or')).toBe('(full_name.ilike."*som chai*",email.ilike."*som chai*")')
    expect(url.searchParams.get('offset')).toBe('10')
    expect(url.searchParams.get('limit')).toBe('10')
  })

  it('ignores an unknown status', async () => {
    fetchMock.mockResolvedValue(reply([], 0))
    await listAccounts({ page: 1, pageSize: 10, status: 'banana' })
    expect(call().url.searchParams.has('status')).toBe(false)
  })
})
