/**
 * cookie เซสชันของแดชบอร์ด (dash_session) — เก็บแค่ { sub, iat, exp } ที่เซ็นด้วย HMAC
 * ทุกคำขออ่านแถว dashboard.accounts ใหม่ ปิดใช้งาน/ลบ/ลดสิทธิ์/รีเซ็ตรหัสผ่านจึงมีผลทันที
 */

import type { NextRequest, NextResponse } from 'next/server'
import { getAccountById, type AccountRow } from './accounts'
import { sessionSecret } from './config'
import type { Role } from './policy'
import { signToken, verifyToken } from './tokens'

export const SESSION_COOKIE = 'dash_session'
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 12

export interface SessionAccount {
  id: string
  email: string
  fullName: string
  role: Role
  isRoot: boolean
}

const toSessionAccount = (row: AccountRow): SessionAccount => ({
  id: row.id,
  email: row.email,
  fullName: row.full_name,
  role: row.role,
  isRoot: row.is_root,
})

export function setSessionCookie(res: NextResponse, accountId: string, now = Date.now()): void {
  const secret = sessionSecret()
  if (!secret) throw new Error('DASHBOARD_SESSION_SECRET is not set (or is under 32 chars)')
  const token = signToken(secret, 'session', { sub: accountId, iat: now, exp: now + SESSION_MAX_AGE_SECONDS * 1000 })
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
  })
}

export function clearSessionCookie(res: NextResponse): void {
  res.cookies.set(SESSION_COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 })
}

export async function getSessionAccount(req: NextRequest, now = Date.now()): Promise<SessionAccount | null> {
  const secret = sessionSecret()
  if (!secret) return null
  const claims = verifyToken(secret, 'session', req.cookies.get(SESSION_COOKIE)?.value, now)
  if (!claims || typeof claims.iat !== 'number') return null

  const row = await getAccountById(claims.sub)
  if (!row || row.status !== 'active') return null
  // ออก token ก่อนการรีเซ็ตรหัสผ่านครั้งล่าสุด = ใช้ไม่ได้
  if (claims.iat <= Date.parse(row.sessions_valid_after)) return null
  return toSessionAccount(row)
}
