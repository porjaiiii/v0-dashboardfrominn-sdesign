'use client'

import { useCallback, useEffect, useState } from 'react'
import type { Page } from '@/lib/db/types'

type Params = Record<string, string | number | undefined>

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
