import { NextRequest } from 'next/server'
import { vi } from 'vitest'
import type { AccountRow } from '@/lib/auth/accounts'
import { signToken } from '@/lib/auth/tokens'

export const ORIGIN = 'http://localhost:3000'
export const SECRET = 's'.repeat(40)
export const USER_ID = '11111111-1111-4111-8111-111111111111'
export const ADMIN_ID = '22222222-2222-4222-8222-222222222222'
export const ROOT_ID = '33333333-3333-4333-8333-333333333333'

export function accountRow(over: Partial<AccountRow> = {}): AccountRow {
  return {
    id: USER_ID,
    email: 'somchai@example.com',
    full_name: 'สมชาย ใจดี',
    role: 'user',
    status: 'active',
    is_root: false,
    email_verified_at: '2026-01-01T00:00:00+00:00',
    approved_at: '2026-01-02T00:00:00+00:00',
    approved_by: ROOT_ID,
    sessions_valid_after: '2026-01-01T00:00:00.123456+00:00',
    last_email_sent_at: null,
    created_at: '2026-01-01T00:00:00+00:00',
    updated_at: '2026-01-01T00:00:00+00:00',
    ...over,
  }
}

export function stubAuthEnv() {
  vi.stubEnv('SUPABASE_URL', 'https://sb.test')
  vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'sb_secret_test')
  vi.stubEnv('DASHBOARD_SESSION_SECRET', SECRET)
  vi.stubEnv('APP_BASE_URL', ORIGIN)
}

/** ค่า header cookie ของเซสชันที่ถูกต้อง */
export function sessionCookie(id: string, iat = Date.now()) {
  return `dash_session=${signToken(SECRET, 'session', { sub: id, iat, exp: iat + 3_600_000 })}`
}

export function request(
  path: string,
  init: { method?: string; body?: unknown; origin?: string | null; cookie?: string } = {},
): NextRequest {
  const headers = new Headers()
  if (init.body !== undefined) headers.set('content-type', 'application/json')
  if (init.origin !== null) headers.set('origin', init.origin ?? ORIGIN)
  if (init.cookie) headers.set('cookie', init.cookie)
  return new NextRequest(`${ORIGIN}${path}`, {
    method: init.method ?? (init.body === undefined ? 'GET' : 'POST'),
    headers,
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  })
}
