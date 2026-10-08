'use client'

import { useCallback, useEffect, useState } from 'react'
import type { SessionAccount } from '@/lib/auth/session'
import { redirectToLogin } from '@/lib/auth-client'

export type { SessionAccount }

/**
 * บัญชีที่ล็อกอินอยู่ — ยังไม่ล็อกอินจะถูกส่งไป /login, ผู้ใช้ทั่วไปที่เปิดหน้าแอดมินจะถูกส่งไป /map
 * (แค่เพื่อประสบการณ์ใช้งาน — API ทุกตัวตรวจสิทธิ์เองอีกชั้น)
 */
export function useSession(need: 'signed-in' | 'admin') {
  const [account, setAccount] = useState<SessionAccount | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch('/api/auth/session', { cache: 'no-store' })
      .then(async (res) => {
        if (cancelled) return
        if (!res.ok) return redirectToLogin()
        const { account } = (await res.json()) as { account: SessionAccount }
        if (need === 'admin' && account.role !== 'admin') return window.location.replace('/map')
        setAccount(account)
      })
      .catch(() => !cancelled && redirectToLogin())
    return () => {
      cancelled = true
    }
  }, [need])

  const logout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {})
    window.location.href = '/login'
  }, [])

  return { account, logout }
}
