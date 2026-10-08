import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { stubAuthEnv, USER_ID } from '@/tests/fixtures'
import { AuthApiError, createAuthUser, deleteAuthUser, updateAuthUserPassword, verifyPassword } from './supabase-auth'

const fetchMock = vi.fn()
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status })
const call = (i = 0) => {
  const [url, init] = fetchMock.mock.calls[i] as [string, RequestInit]
  return { url: new URL(url), init, body: init.body ? JSON.parse(String(init.body)) : undefined, headers: new Headers(init.headers) }
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

describe('verifyPassword', () => {
  it('returns the user id for correct credentials and discards Supabase tokens', async () => {
    fetchMock.mockResolvedValue(json({ access_token: 'x', user: { id: USER_ID } }))
    expect(await verifyPassword('a@b.co', 'pw')).toBe(USER_ID)
    const { url, body, headers, init } = call()
    expect(url.pathname).toBe('/auth/v1/token')
    expect(url.searchParams.get('grant_type')).toBe('password')
    expect(init.method).toBe('POST')
    expect(body).toEqual({ email: 'a@b.co', password: 'pw' })
    expect(headers.get('apikey')).toBe('sb_secret_test')
  })

  it('returns null for wrong credentials (400)', async () => {
    fetchMock.mockResolvedValue(json({ code: 'invalid_credentials' }, 400))
    expect(await verifyPassword('a@b.co', 'bad')).toBeNull()
  })

  it('throws AuthApiError with status 429 when rate limited', async () => {
    fetchMock.mockResolvedValue(json({ code: 'over_request_rate_limit' }, 429))
    await expect(verifyPassword('a@b.co', 'pw')).rejects.toMatchObject({ name: 'AuthApiError', status: 429 })
  })
})

describe('admin user API', () => {
  it('creates a confirmed user tagged as a dashboard account', async () => {
    fetchMock.mockResolvedValue(json({ id: USER_ID }))
    expect(await createAuthUser({ email: 'a@b.co', password: 'password1', fullName: 'สมชาย' })).toBe(USER_ID)
    const { url, body, init } = call()
    expect(url.pathname).toBe('/auth/v1/admin/users')
    expect(init.method).toBe('POST')
    expect(body).toEqual({
      email: 'a@b.co',
      password: 'password1',
      email_confirm: true,
      app_metadata: { source: 'dashboard' },
      user_metadata: { full_name: 'สมชาย' },
    })
  })

  it('surfaces "email exists" as AuthApiError 422', async () => {
    fetchMock.mockResolvedValue(json({ code: 'email_exists' }, 422))
    const err = await createAuthUser({ email: 'a@b.co', password: 'password1', fullName: 'x' }).catch((e) => e)
    expect(err).toBeInstanceOf(AuthApiError)
    expect(err.status).toBe(422)
    expect(err.code).toBe('email_exists')
  })

  it('reads the error code from the older error_code field too', async () => {
    fetchMock.mockResolvedValue(json({ code: 422, error_code: 'weak_password', msg: 'Password is too weak' }, 422))
    const err = await createAuthUser({ email: 'a@b.co', password: 'password1', fullName: 'x' }).catch((e) => e)
    expect(err).toMatchObject({ status: 422, code: 'weak_password' })
  })

  it('updates a password and deletes a user by id', async () => {
    fetchMock.mockResolvedValueOnce(json({ id: USER_ID })).mockResolvedValueOnce(new Response(null, { status: 200 }))
    await updateAuthUserPassword(USER_ID, 'newpassword')
    await deleteAuthUser(USER_ID)
    expect(call(0).url.pathname).toBe(`/auth/v1/admin/users/${USER_ID}`)
    expect(call(0).init.method).toBe('PUT')
    expect(call(0).body).toEqual({ password: 'newpassword' })
    expect(call(1).url.pathname).toBe(`/auth/v1/admin/users/${USER_ID}`)
    expect(call(1).init.method).toBe('DELETE')
  })
})
