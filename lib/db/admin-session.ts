/**
 * เซสชันแอดมินแบบรหัสผ่านกลาง (ชั่วคราว)
 *
 * - ตั้ง ADMIN_PASSWORD ใน env → แอดมินกรอกรหัสที่ /admin/login
 * - ล็อกอินสำเร็จ → เซิร์ฟเวอร์ออก cookie httpOnly ที่เซ็นด้วย HMAC (JavaScript ฝั่งเบราว์เซอร์อ่านไม่ได้)
 * - ทุก /api/admin/* ตรวจ cookie นี้ก่อนทำงาน
 *
 * ข้อจำกัด: ทุกคนใช้รหัสเดียวกัน จึงไม่รู้ว่าใครทำอะไร และเปลี่ยนรหัสแล้วต้องแจ้งทุกคน
 * ควรเปลี่ยนเป็นล็อกอินรายบุคคล (LINE + admin_keys หรือ Supabase Auth) เมื่อพร้อม
 */

import { createHash, createHmac, timingSafeEqual } from 'crypto'
import { readEnv } from '@/lib/google-sheets'
import { isSupabaseConfigured } from './supabase-rest'

export const SESSION_COOKIE = 'admin_session'
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 12

export type AuthMode = 'password' | 'unconfigured' | 'open'

/**
 * password     = มี ADMIN_PASSWORD → ต้องล็อกอิน
 * unconfigured = เชื่อม Supabase แล้วแต่ยังไม่ตั้ง ADMIN_PASSWORD → ปิดทุกอย่าง (กันข้อมูลรั่ว)
 * open         = ยังไม่เชื่อม Supabase (ใช้ข้อมูลตัวอย่าง) หรือเปิด ADMIN_API_ALLOW_UNAUTHENTICATED เพื่อพัฒนาในเครื่อง
 */
export function authMode(): AuthMode {
  if (readEnv('ADMIN_PASSWORD')) return 'password'
  if (isSupabaseConfigured() && readEnv('ADMIN_API_ALLOW_UNAUTHENTICATED') !== 'true') return 'unconfigured'
  return 'open'
}

const signingKey = () => readEnv('ADMIN_SESSION_SECRET') || readEnv('ADMIN_PASSWORD') || ''

const sign = (payload: string) => createHmac('sha256', signingKey()).update(payload).digest('base64url')

/** เทียบแบบเวลาคงที่ (hash ก่อนเพื่อให้ความยาวเท่ากัน) */
function safeEqual(a: string, b: string): boolean {
  const ha = createHash('sha256').update(a).digest()
  const hb = createHash('sha256').update(b).digest()
  return timingSafeEqual(ha, hb)
}

export function checkPassword(input: string): boolean {
  const expected = readEnv('ADMIN_PASSWORD')
  return !!expected && safeEqual(input, expected)
}

export function createSessionToken(): string {
  const expires = Date.now() + SESSION_MAX_AGE_SECONDS * 1000
  const payload = String(expires)
  return `${payload}.${sign(payload)}`
}

export function verifySessionToken(token: string | undefined): boolean {
  if (!token || !signingKey()) return false
  const [payload, signature] = token.split('.')
  if (!payload || !signature) return false
  if (!safeEqual(signature, sign(payload))) return false
  const expires = Number(payload)
  return Number.isFinite(expires) && expires > Date.now()
}
