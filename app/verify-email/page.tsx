'use client'

import Link from 'next/link'
import { FormEvent, useState } from 'react'
import { AuthButton, AuthCard, AuthField, AuthNotice, authLinkStyle } from '@/components/auth/AuthCard'
import { postJson, queryParam } from '@/lib/auth-client'

/** ลิงก์ในอีเมลพามาที่นี่ — ต้องกรอกรหัสผ่านตอนสมัครแล้วกดปุ่มเอง (POST) ตัวสแกนลิงก์จึงยืนยันแทนไม่ได้ */
export default function VerifyEmailPage() {
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const confirm = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const { ok, data } = await postJson('/api/auth/verify-email', { token: queryParam('token') ?? '', password })
    if (ok) {
      window.location.href = '/login?notice=verified'
      return
    }
    setError(data.error || 'ยืนยันอีเมลไม่สำเร็จ')
    setBusy(false)
  }

  return (
    <AuthCard
      title="ยืนยันอีเมล"
      subtitle="กรอกรหัสผ่านที่ตั้งไว้ตอนสมัคร แล้วกดยืนยัน เพื่อส่งคำขอเปิดบัญชีให้ผู้ดูแลระบบ"
      footer={
        <span>
          ลืมรหัสผ่านหรือลิงก์หมดอายุ?{' '}
          <Link href="/signup" style={authLinkStyle}>
            สมัครอีกครั้งด้วยอีเมลเดิม
          </Link>
        </span>
      }
    >
      <form onSubmit={confirm} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <AuthField
          label="รหัสผ่านที่ตั้งไว้ตอนสมัคร"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <AuthNotice tone="error">{error}</AuthNotice>}
        <AuthButton busy={busy}>{busy ? 'กำลังยืนยัน...' : 'ยืนยันอีเมล'}</AuthButton>
      </form>
    </AuthCard>
  )
}
