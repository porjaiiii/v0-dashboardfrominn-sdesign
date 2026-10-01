'use client'

import { FormEvent, useEffect, useState } from 'react'
import Image from 'next/image'
import { fontStyle } from '@/lib/design-tokens'
import { ADMIN_COLORS } from '@/lib/admin-tokens'

/** รับเฉพาะ path ภายในเว็บ กัน open redirect */
const DEFAULT_NEXT = '/admin/dashboard'

function safeNext(): string {
  const next = new URLSearchParams(window.location.search).get('next') || DEFAULT_NEXT
  return next.startsWith('/') && !next.startsWith('//') ? next : DEFAULT_NEXT
}

export default function AdminLoginPage() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  // ล็อกอินค้างอยู่แล้ว → ข้ามหน้านี้ไปเลย
  useEffect(() => {
    fetch('/api/admin/session', { cache: 'no-store' })
      .then((res) => res.json())
      .then((s: { authenticated: boolean }) => {
        if (s.authenticated) window.location.replace(safeNext())
      })
      .catch(() => {})
  }, [])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (!res.ok) throw new Error((await res.json()).error || `HTTP ${res.status}`)
      // โหลดหน้าใหม่ทั้งหน้า เพื่อให้ cookie เซสชันถูกใช้กับทุกคำขอ
      window.location.href = safeNext()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เข้าสู่ระบบไม่สำเร็จ')
      setBusy(false)
    }
  }

  return (
    <div className="flex items-center justify-center" style={{ minHeight: '100vh', backgroundColor: '#f3f5fb', padding: 16, ...fontStyle }}>
      <form
        onSubmit={submit}
        style={{ width: '100%', maxWidth: 380, backgroundColor: '#ffffff', borderRadius: 14, boxShadow: '0 4px 24px rgba(0,0,0,0.12)', overflow: 'hidden' }}
      >
        <div className="flex items-center justify-center" style={{ height: 84, backgroundColor: ADMIN_COLORS.navy }}>
          <Image src="/logo-mascot.png" alt="โลโก้" width={40} height={64} priority style={{ height: 'auto' }} />
        </div>
        <div style={{ padding: '22px 24px 26px' }}>
          <h1 style={{ color: ADMIN_COLORS.navy, fontSize: 22, fontWeight: 600, margin: 0 }}>เข้าสู่ระบบแอดมิน</h1>
          <label htmlFor="admin-password" style={{ display: 'block', color: ADMIN_COLORS.navy, fontSize: 14, fontWeight: 600, margin: '16px 0 6px' }}>
            รหัสผ่าน
          </label>
          <input
            id="admin-password"
            type="password"
            autoComplete="current-password"
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: '100%',
              height: 44,
              padding: '0 14px',
              borderRadius: 8,
              border: `1.5px solid ${ADMIN_COLORS.navy}`,
              fontSize: 15,
              outline: 'none',
              ...fontStyle,
            }}
          />
          {error && (
            <p role="alert" style={{ color: '#b02e0d', fontSize: 14, fontWeight: 600, margin: '10px 0 0' }}>
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={busy || !password}
            style={{
              width: '100%',
              height: 46,
              marginTop: 18,
              borderRadius: 10,
              border: 'none',
              backgroundColor: ADMIN_COLORS.navy,
              color: '#ffffff',
              fontSize: 16,
              fontWeight: 600,
              cursor: busy || !password ? 'default' : 'pointer',
              opacity: busy || !password ? 0.6 : 1,
              ...fontStyle,
            }}
          >
            {busy ? 'กำลังตรวจสอบ...' : 'เข้าสู่ระบบ'}
          </button>
        </div>
      </form>
    </div>
  )
}
