/**
 * token แบบเซ็นด้วย HMAC-SHA256: base64url(JSON).signature
 * ทุก token มี purpose — token ที่ออกให้งานหนึ่ง (เช่นลิงก์ยืนยันอีเมล) ใช้แทนอีกงาน (cookie เซสชัน) ไม่ได้
 */

import { createHmac, timingSafeEqual } from 'crypto'
import { MIN_SECRET_LENGTH } from './config'

export type TokenPurpose = 'session' | 'verify-email' | 'reset-password'

export interface TokenClaims {
  sub: string
  /** epoch ms */
  exp: number
  /** epoch ms — เวลาออก token (cookie เซสชัน) */
  iat?: number
  /** epoch ms — sessions_valid_after ตอนออกลิงก์รีเซ็ตรหัสผ่าน */
  sva?: number
}

const mac = (secret: string, body: string) => createHmac('sha256', secret).update(body).digest('base64url')

export function signToken(secret: string, purpose: TokenPurpose, claims: TokenClaims): string {
  const body = Buffer.from(JSON.stringify({ ...claims, purpose })).toString('base64url')
  return `${body}.${mac(secret, body)}`
}

export function verifyToken(
  secret: string,
  purpose: TokenPurpose,
  token: string | undefined,
  now = Date.now(),
): TokenClaims | null {
  if (!token || secret.length < MIN_SECRET_LENGTH) return null
  const parts = token.split('.')
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null
  const [body, signature] = parts

  const expected = Buffer.from(mac(secret, body))
  const given = Buffer.from(signature)
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null

  let claims: Record<string, unknown>
  try {
    claims = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'))
  } catch {
    return null
  }
  if (!claims || typeof claims !== 'object') return null
  if (claims.purpose !== purpose) return null
  if (typeof claims.sub !== 'string' || !claims.sub) return null
  if (typeof claims.exp !== 'number' || claims.exp <= now) return null
  return claims as unknown as TokenClaims
}
