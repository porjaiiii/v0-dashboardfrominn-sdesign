import { NextRequest, NextResponse } from 'next/server'
import { readEnv } from '@/lib/google-sheets'
import { PAGE_SIZE } from './constants'
import { isSupabaseConfigured } from './supabase-rest'
import type { ListParams, Page } from './types'

/**
 * ป้องกัน API แอดมิน
 *
 * ตอนนี้ระบบล็อกอินของแดชบอร์ดยังเป็นแบบ mock ฝั่ง client (ดู lib/auth-context.tsx)
 * ฝั่งเซิร์ฟเวอร์จึงยังตรวจไม่ได้ว่าผู้เรียกเป็นแอดมินจริง และ route เหล่านี้ใช้ service-role key
 * ดังนั้นเมื่อเชื่อม Supabase แล้ว จะปฏิเสธทุกคำขอ (501) จนกว่าจะทำอย่างใดอย่างหนึ่ง:
 *   1) เพิ่มการตรวจตัวตนจริงในฟังก์ชันนี้ (เช่น ตรวจ LIFF access token / Supabase JWT แล้วเทียบกับ admin_keys)
 *   2) ตั้ง ADMIN_API_ALLOW_UNAUTHENTICATED=true เฉพาะตอนพัฒนาในเครื่อง — ห้ามตั้งบน production
 */
export function guardAdmin(): NextResponse | null {
  if (!isSupabaseConfigured()) return null
  if (readEnv('ADMIN_API_ALLOW_UNAUTHENTICATED') === 'true') return null
  return NextResponse.json(
    { error: 'ยังไม่ได้ตั้งค่าการยืนยันตัวตนแอดมินฝั่งเซิร์ฟเวอร์ (ดู lib/db/route-helpers.ts)' },
    { status: 501 },
  )
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
    const denied = guardAdmin()
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
