/** ตัวช่วยของ route handler ระบบบัญชี: รูปแบบคำตอบ, same-origin, ตรวจสิทธิ์ */

import { NextRequest, NextResponse } from 'next/server'
import { appBaseUrl, authConfigured } from './config'
import { getSessionAccount, type SessionAccount } from './session'

export const NO_STORE = { 'Cache-Control': 'no-store' }
export const FOREIGN_ORIGIN_MESSAGE = 'คำขอไม่ได้มาจากเว็บไซต์นี้'
const NOT_CONFIGURED = 'ระบบเข้าสู่ระบบยังไม่ได้ตั้งค่า (ดู .env.example)'
const FAILED = 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง'

/** หน่วงเวลาเมื่อรหัสผิด ให้การเดารหัสช้าลง */
export const WRONG_CREDENTIALS_DELAY_MS = 800
export const wrongCredentialsDelay = () => new Promise((r) => setTimeout(r, WRONG_CREDENTIALS_DELAY_MS))

export const ok = (data: Record<string, unknown> = {}) => NextResponse.json({ ok: true, ...data }, { headers: NO_STORE })

export const jsonError = (error: string, status: number, extra: Record<string, unknown> = {}) =>
  NextResponse.json({ error, ...extra }, { status, headers: NO_STORE })

/** กัน CSRF: คำขอที่เปลี่ยนข้อมูลต้องมาจากเว็บนี้เท่านั้น (เบราว์เซอร์ส่ง Origin กับ POST/PATCH/DELETE เสมอ) */
export function isSameOrigin(req: NextRequest): boolean {
  const origin = req.headers.get('origin')
  if (!origin) return false
  const base = appBaseUrl()
  return origin === req.nextUrl.origin || (!!base && origin === new URL(base).origin)
}

export async function readBody(req: NextRequest): Promise<Record<string, unknown>> {
  const body: unknown = await req.json().catch(() => null)
  return body && typeof body === 'object' && !Array.isArray(body) ? (body as Record<string, unknown>) : {}
}

export const field = (body: Record<string, unknown>, key: string): string =>
  typeof body[key] === 'string' ? (body[key] as string) : ''

export type Need = 'signed-in' | 'admin'

/** 503 = ยังไม่ได้ตั้งค่า, 401 = ยังไม่ล็อกอิน/เซสชันใช้ไม่ได้, 403 = ไม่ใช่แอดมิน */
export async function requireAccount(
  req: NextRequest,
  need: Need,
): Promise<{ account: SessionAccount } | { denied: NextResponse }> {
  if (!authConfigured()) return { denied: jsonError(NOT_CONFIGURED, 503) }
  let account: SessionAccount | null
  try {
    account = await getSessionAccount(req)
  } catch (err) {
    console.error('[auth] ตรวจเซสชันไม่สำเร็จ:', err)
    return { denied: jsonError(FAILED, 500) }
  }
  if (!account) return { denied: jsonError('กรุณาเข้าสู่ระบบ', 401) }
  if (need === 'admin' && account.role !== 'admin') return { denied: jsonError('สำหรับผู้ดูแลระบบเท่านั้น', 403) }
  return { account }
}

async function run(req: NextRequest, fn: () => Promise<NextResponse>): Promise<NextResponse> {
  try {
    return await fn()
  } catch (err) {
    console.error(`[api${req.nextUrl.pathname}]`, err)
    return jsonError(FAILED, 500)
  }
}

/** route สาธารณะของระบบล็อกอินที่เปลี่ยนข้อมูล (POST): ตรวจการตั้งค่า + same-origin + จับ error */
export function publicAuthRoute(fn: (req: NextRequest) => Promise<NextResponse>) {
  return async (req: NextRequest) => {
    if (!authConfigured()) return jsonError(NOT_CONFIGURED, 503)
    if (!isSameOrigin(req)) return jsonError(FOREIGN_ORIGIN_MESSAGE, 403)
    return run(req, () => fn(req))
  }
}

/** route ของแอดมินที่เปลี่ยนข้อมูล — ส่งบัญชีผู้เรียกให้ handler (ใช้กันแก้บัญชีตัวเอง) */
export function adminActionRoute<C>(fn: (req: NextRequest, actor: SessionAccount, ctx: C) => Promise<NextResponse>) {
  return async (req: NextRequest, ctx: C) => {
    if (!isSameOrigin(req)) return jsonError(FOREIGN_ORIGIN_MESSAGE, 403)
    const result = await requireAccount(req, 'admin')
    if ('denied' in result) return result.denied
    return run(req, () => fn(req, result.account, ctx))
  }
}
