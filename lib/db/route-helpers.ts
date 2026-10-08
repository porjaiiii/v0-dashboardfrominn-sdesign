import { NextRequest, NextResponse } from 'next/server'
import { FOREIGN_ORIGIN_MESSAGE, isSameOrigin, requireAccount } from '@/lib/auth/http'
import { PAGE_SIZE } from './constants'
import type { ListParams, Page } from './types'

/**
 * ป้องกัน API แอดมิน — ใช้เซสชันบัญชีแดชบอร์ด (ดู lib/auth/session.ts)
 * 401 = ยังไม่ล็อกอิน/เซสชันหมดอายุ, 403 = ไม่ใช่แอดมิน, 503 = ยังไม่ได้ตั้งค่าระบบล็อกอิน
 */
export async function guardAdmin(req: NextRequest): Promise<NextResponse | null> {
  const result = await requireAccount(req, 'admin')
  return 'denied' in result ? result.denied : null
}

/** ป้องกัน API ข้อมูลที่ผู้ใช้ทุกบทบาทที่ล็อกอินแล้วเห็นได้ */
export async function guardSignedIn(req: NextRequest): Promise<NextResponse | null> {
  const result = await requireAccount(req, 'signed-in')
  return 'denied' in result ? result.denied : null
}

const clampInt = (v: string | null, fallback: number, min: number, max: number) => {
  const n = Number(v)
  return Number.isInteger(n) ? Math.min(max, Math.max(min, n)) : fallback
}

export function parseListParams(req: NextRequest): ListParams {
  const sp = req.nextUrl.searchParams
  const text = (k: string) => sp.get(k)?.trim().slice(0, 100) || undefined
  const date = (k: string) => {
    const v = sp.get(k)
    return v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : undefined
  }
  // โหมดส่งออก CSV ขอทีละ 1000 แถว; โหมดปกติจำกัด 100
  const maxPageSize = sp.get('export') === '1' ? 1000 : 100
  return {
    page: clampInt(sp.get('page'), 1, 1, 100000),
    pageSize: clampInt(sp.get('pageSize'), PAGE_SIZE, 1, maxPageSize),
    from: date('from'),
    to: date('to'),
    includeDeleted: sp.get('includeDeleted') !== 'false',
    q: text('q'),
    sort: text('sort'),
    subdistrict: text('subdistrict'),
    status: text('status'),
  }
}

/** ห่อ handler ให้ตรวจสิทธิ์ + จับ error เป็น JSON เหมือนกันทุก route */
export function handle<T>(fn: (req: NextRequest) => Promise<T>) {
  return async (req: NextRequest) => {
    // กัน CSRF: คำขอที่เปลี่ยนข้อมูลต้องมาจากเว็บนี้
    if (req.method !== 'GET' && !isSameOrigin(req)) {
      return NextResponse.json({ error: FOREIGN_ORIGIN_MESSAGE }, { status: 403, headers: { 'Cache-Control': 'no-store' } })
    }
    const denied = await guardAdmin(req)
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
