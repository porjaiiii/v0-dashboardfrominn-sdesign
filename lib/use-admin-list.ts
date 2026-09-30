'use client'

import { useCallback, useEffect, useState } from 'react'
import type { Page } from '@/lib/db/types'

type Params = Record<string, string | number | undefined>

/** เซสชันหมดอายุ/ยังไม่ล็อกอิน → กลับไปหน้าเข้าสู่ระบบแล้วกลับมาหน้าเดิมหลังล็อกอิน */
function redirectToLogin() {
  window.location.href = `/admin/login?next=${encodeURIComponent(window.location.pathname)}`
}

/**
 * โหลดรายการจาก /api/admin/* (แบ่งหน้าฝั่งเซิร์ฟเวอร์)
 * - ค่า q จะหน่วง 300ms ก่อนยิงคำขอ เพื่อไม่ให้ยิงทุกตัวอักษร
 * - คำขอเก่าที่ตอบช้ากว่าคำขอใหม่จะถูกทิ้ง
 */
export function useAdminList<T>(endpoint: string, params: Params) {
  const [data, setData] = useState<Page<T>>({ rows: [], total: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

  const key = JSON.stringify(params)

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      setLoading(true)
      const qs = new URLSearchParams()
      Object.entries(JSON.parse(key) as Params).forEach(([k, v]) => {
        if (v !== undefined && v !== '') qs.set(k, String(v))
      })
      try {
        const res = await fetch(`${endpoint}?${qs}`)
        if (res.status === 401) return redirectToLogin()
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`)
        if (!cancelled) {
          setData(json as Page<T>)
          setError(null)
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'โหลดข้อมูลไม่สำเร็จ')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    const t = setTimeout(run, JSON.parse(key).q ? 300 : 0)
    return () => {
      cancelled = true
      clearTimeout(t)
    }
  }, [endpoint, key, tick])

  const reload = useCallback(() => setTick((n) => n + 1), [])
  return { ...data, loading, error, reload }
}

/** โหลดออบเจ็กต์เดี่ยว (เช่น summary) */
export function useAdminFetch<T>(endpoint: string) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    let cancelled = false
    fetch(endpoint)
      .then(async (res) => {
        if (res.status === 401) return redirectToLogin()
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`)
        if (!cancelled) setData(json as T)
      })
      .catch((e) => !cancelled && setError(e instanceof Error ? e.message : 'โหลดข้อมูลไม่สำเร็จ'))
    return () => {
      cancelled = true
    }
  }, [endpoint])
  return { data, error }
}

/** ISO → "2567-01-12" (พ.ศ.) */
export function toBuDate(iso: string | null | undefined): string {
  if (!iso) return '-'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return '-'
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear() + 543}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

/** ISO → "2567-01-12 09:30" (พ.ศ.) */
export function toBuDateTime(iso: string | null | undefined): string {
  if (!iso) return '-'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return '-'
  const p = (n: number) => String(n).padStart(2, '0')
  return `${toBuDate(iso)} ${p(d.getHours())}:${p(d.getMinutes())}`
}

/**
 * ดึงข้อมูลทั้งหมดตามตัวกรอง (ทีละ 1,000 แถว สูงสุด 50,000 แถว) ใช้ตอนส่งออก CSV
 * ต่างจาก useAdminList ตรงที่ไม่ผูกกับหน้าที่แสดงอยู่ในตาราง
 */
export async function fetchAllRows<T>(endpoint: string, params: Params): Promise<T[]> {
  const out: T[] = []
  for (let page = 1; page <= 50; page++) {
    const qs = new URLSearchParams({ export: '1', pageSize: '1000', page: String(page) })
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== '') qs.set(k, String(v))
    })
    const res = await fetch(`${endpoint}?${qs}`)
    if (res.status === 401) {
      redirectToLogin()
      throw new Error('กรุณาเข้าสู่ระบบใหม่')
    }
    const json = (await res.json()) as Page<T> & { error?: string }
    if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`)
    out.push(...json.rows)
    if (json.rows.length === 0 || out.length >= json.total) break
  }
  return out
}
