'use client'

import { useEffect, useState } from 'react'
import type { DashboardData } from '@/lib/db/types'
import { handleAuthFailure } from '@/lib/auth-client'

/**
 * โหลดข้อมูล /api/admin/dashboard ของปีที่ระบุ (ไม่ระบุ = ปีปัจจุบัน)
 * การ์ดหลายใบในหน้าเดียวกันเรียกพร้อมกันได้ — คำขอปีเดียวกันถูกรวมเป็นครั้งเดียวและแคชไว้ในหน้า
 */
const cache = new Map<number, Promise<DashboardData>>()

function load(year: number | undefined): Promise<DashboardData> {
  const k = year ?? 0
  const hit = cache.get(k)
  if (hit) return hit
  const p = fetch(`/api/admin/dashboard${year ? `?year=${year}` : ''}`, { cache: 'no-store' })
    .then(async (res) => {
      if (handleAuthFailure(res.status)) throw new Error('กรุณาเข้าสู่ระบบใหม่')
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`)
      return json as DashboardData
    })
    .catch((e) => {
      cache.delete(k) // ให้ลองใหม่ได้ครั้งหน้า
      throw e
    })
  cache.set(k, p)
  return p
}

export function useDashboard(year?: number) {
  const [state, setState] = useState<{ year?: number; data: DashboardData | null; error: string | null }>({
    year,
    data: null,
    error: null,
  })

  useEffect(() => {
    let cancelled = false
    load(year)
      .then((data) => !cancelled && setState({ year, data, error: null }))
      .catch((e) => !cancelled && setState({ year, data: null, error: e instanceof Error ? e.message : 'โหลดข้อมูลไม่สำเร็จ' }))
    return () => {
      cancelled = true
    }
  }, [year])

  // ระหว่างโหลดปีใหม่ ยังคงข้อมูลชุดก่อนไว้ (หน้าจอไม่กระพริบว่าง) แล้วให้ UI หรี่ลงตาม loading
  return { data: state.data, error: state.error, loading: state.year !== year || (!state.data && !state.error) }
}
