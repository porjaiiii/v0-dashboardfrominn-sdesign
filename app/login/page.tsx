'use client'

import Link from 'next/link'
import { FormEvent, useEffect, useState } from 'react'
import { AuthButton, AuthCard, AuthField, AuthNotice, authLinkStyle } from '@/components/auth/AuthCard'
import { postJson, queryParam } from '@/lib/auth-client'
import { safeNext, type Role } from '@/lib/auth/policy'

const NOTICES: Record<string, string> = {
  verified: 'ยืนยันอีเมลแล้ว คำขอของคุณถูกส่งให้ผู้ดูแลระบบพิจารณา เราจะแจ้งทางอีเมลเมื่ออนุมัติ',
  reset: 'ตั้งรหัสผ่านใหม่แล้ว เข้าสู่ระบบด้วยรหัสผ่านใหม่ได้เลย',
}

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [unverified, setUnverified] = useState(false)

  useEffect(() => {
    const notice = queryParam('notice')
    if (notice && NOTICES[notice]) setInfo(NOTICES[notice])
    // ล็อกอินค้างอยู่แล้ว → ไปหน้าที่ควรไปเลย
    fetch('/api/auth/session', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((s: { account: { role: Role } } | null) => {
        if (s) window.location.replace(safeNext(queryParam('next'), s.account.role))
      })
      .catch(() => {})
  }, [])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    setInfo(null)
    setUnverified(false)
    const { ok, data } = await postJson<{ redirect?: string; reason?: string }>('/api/auth/login', {
      email,
      password,
      next: queryParam('next'),
    })
    if (ok && data.redirect) {
      // โหลดใหม่ทั้งหน้า เพื่อให้ cookie เซสชันถูกใช้กับทุกคำขอ
      window.location.href = data.redirect
      return
    }
    setError(data.error || 'เข้าสู่ระบบไม่สำเร็จ')
    setUnverified(data.reason === 'unverified')
    setBusy(false)
  }

  const resend = async () => {
    await postJson('/api/auth/resend-verification', { email })
    setUnverified(false)
    setError(null)
    setInfo('ส่งลิงก์ยืนยันอีกครั้งแล้ว ถ้ายังไม่ได้รับ ให้รอ 1 นาทีแล้วลองใหม่')
  }

  return (
    <AuthCard
      title="เข้าสู่ระบบ"
      subtitle="ระบบข้อมูลร่วมอนุรักษ์โลก คุ้งบางกะเจ้า"
      footer={
        <>
          <Link href="/forgot-password" style={authLinkStyle}>
            ลืมรหัสผ่าน?
          </Link>
          <span>
            ยังไม่มีบัญชี?{' '}
            <Link href="/signup" style={authLinkStyle}>
              สมัครใช้งาน
            </Link>
          </span>
        </>
      }
    >
      {info && <AuthNotice tone="info">{info}</AuthNotice>}
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <AuthField label="อีเมล" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <AuthField
          label="รหัสผ่าน"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <AuthNotice tone="error">{error}</AuthNotice>}
        {unverified && (
          <AuthButton variant="outline" onClick={resend}>
            ส่งลิงก์ยืนยันอีเมลอีกครั้ง
          </AuthButton>
        )}
        <AuthButton busy={busy}>{busy ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}</AuthButton>
      </form>
    </AuthCard>
  )
}
