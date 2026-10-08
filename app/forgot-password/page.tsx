'use client'

import Link from 'next/link'
import { FormEvent, useState } from 'react'
import { AuthButton, AuthCard, AuthField, AuthNotice, authLinkStyle } from '@/components/auth/AuthCard'
import { postJson } from '@/lib/auth-client'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const { ok, data } = await postJson('/api/auth/forgot-password', { email })
    setBusy(false)
    if (ok) setSent(true)
    else setError(data.error || 'ส่งคำขอไม่สำเร็จ')
  }

  return (
    <AuthCard
      title="ลืมรหัสผ่าน"
      subtitle="กรอกอีเมลของบัญชี เราจะส่งลิงก์สำหรับตั้งรหัสผ่านใหม่ให้"
      footer={
        <Link href="/login" style={authLinkStyle}>
          กลับไปหน้าเข้าสู่ระบบ
        </Link>
      }
    >
      {sent ? (
        <AuthNotice tone="info">ถ้ามีบัญชีที่ใช้อีเมลนี้ เราได้ส่งลิงก์ตั้งรหัสผ่านใหม่ไปแล้ว (ใช้ได้ภายใน 1 ชั่วโมง)</AuthNotice>
      ) : (
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <AuthField label="อีเมล" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          {error && <AuthNotice tone="error">{error}</AuthNotice>}
          <AuthButton busy={busy}>{busy ? 'กำลังส่ง...' : 'ส่งลิงก์ตั้งรหัสผ่านใหม่'}</AuthButton>
        </form>
      )}
    </AuthCard>
  )
}
