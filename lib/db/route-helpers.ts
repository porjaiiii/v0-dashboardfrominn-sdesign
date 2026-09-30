import { NextRequest, NextResponse } from 'next/server'
import { SESSION_COOKIE, authMode, verifySessionToken } from './admin-session'
import { PAGE_SIZE } from './constants'
import type { ListParams, Page } from './types'

/**
 * ป้องกัน API แอดมิน — ดู ./admin-session
 * 401 = ยังไม่ล็อกอิน / เซสชันหมดอายุ, 501 = เชื่อม Supabase แล้วแต่ยังไม่ได้ตั้ง ADMIN_PASSWORD
 */
export function guardAdmin(req: NextRequest): NextResponse | null {
  const mode = authMode()
  if (mode === 'open') return null
  if (mode === 'unconfigured') {
    return NextResponse.json(
      { error: 'ยังไม่ได้ตั้งค่า ADMIN_PASSWORD บนเซิร์ฟเวอร์ (ดู .env.example)' },
      { status: 501 },
    )
  }
  if (verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value)) return null
  return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบแอดมิน' }, { status: 401 })
}

const clampInt = (v: string | null, fallback: number, min: number, max: number) => {
  const n = Number(v)
  return Number.isInteger(n) ? Math.min(max, Math.max(min, n)) : fallback
}

export function parseListParams(req: NextRequest): ListParams {
  const sp = req.nextUrl.searchParams
  const text = (k: string) => sp.get(k)?.trim().slice(0, 100) || undefined
  return {
    page: clampInt(sp.get('page'), 1, 1, 100000),
    pageSize: clampInt(sp.get('pageSize'), PAGE_SIZE, 1, 100),
    q: text('q'),
    sort: text('sort'),
    subdistrict: text('subdistrict'),
    status: text('status'),
  }
}

/** ห่อ handler ให้ตรวจสิทธิ์ + จับ error เป็น JSON เหมือนกันทุก route */
export function handle<T>(fn: (req: NextRequest) => Promise<T>) {
  return async (req: NextRequest) => {
    const denied = guardAdmin(req)
    if (denied) return denied
    try {
      return NextResponse.json(await fn(req), { headers: { 'Cache-Control': 'no-store' } })
    } catch (err) {
      console.error(`[api${req.nextUrl.pathname}]`, err)
      return NextResponse.json({ error: err instanceof Error ? err.message : 'เกิดข้อผิดพลาด' }, { status: 500 })
    }
  }
}

export const listRoute = <T>(fn: (p: ListParams) => Promise<Page<T>>) =>
  handle((req) => fn(parseListParams(req)))
