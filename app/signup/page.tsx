'use client'

import Link from 'next/link'
import { FormEvent, useState } from 'react'
import { AuthButton, AuthCard, AuthField, AuthNotice, authLinkStyle } from '@/components/auth/AuthCard'
import { postJson } from '@/lib/auth-client'
import { PASSWORD_MIN_LENGTH } from '@/lib/auth/policy'

export default function SignupPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<{ emailSent: boolean } | null>(null)
  const [resent, setResent] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (password !== confirm) return setError('รหัสผ่านทั้งสองช่องไม่ตรงกัน')
    setBusy(true)
    setError(null)
    const { ok, data } = await postJson<{ emailSent?: boolean }>('/api/auth/signup', { fullName, email, password })
    setBusy(false)
    if (ok) setDone({ emailSent: !!data.emailSent })
    else setError(data.error || 'สมัครใช้งานไม่สำเร็จ')
  }

  const resend = async () => {
    await postJson('/api/auth/resend-verification', { email })
    setResent(true)
  }

  const backToLogin = (
    <Link href="/login" style={authLinkStyle}>
      กลับไปหน้าเข้าสู่ระบบ
    </Link>
  )

  if (done) {
    return (
      <AuthCard title="ตรวจสอบอีเมลของคุณ" footer={backToLogin}>
        {done.emailSent ? (
          <AuthNotice tone="info">
            เราส่งลิงก์ยืนยันไปที่ {email} แล้ว กดลิงก์ภายใน 24 ชั่วโมง จากนั้นผู้ดูแลระบบจะพิจารณาอนุมัติบัญชีและแจ้งผลทางอีเมล
          </AuthNotice>
        ) : (
          <AuthNotice tone="error">สร้างบัญชีแล้ว แต่ส่งอีเมลยืนยันไม่สำเร็จ กดปุ่มด้านล่างเพื่อส่งอีกครั้ง</AuthNotice>
        )}
        {resent && <AuthNotice tone="info">ส่งอีกครั้งแล้ว ถ้ายังไม่ได้รับ ให้รอ 1 นาทีแล้วลองใหม่</AuthNotice>}
        <AuthButton variant="outline" onClick={resend}>
          ส่งลิงก์ยืนยันอีกครั้ง
        </AuthButton>
      </AuthCard>
    )
  }

  return (
    <AuthCard
      title="สมัครใช้งานแดชบอร์ด"
      subtitle="หลังยืนยันอีเมล ผู้ดูแลระบบจะพิจารณาอนุมัติบัญชีของคุณ"
      footer={
        <span>
          มีบัญชีแล้ว?{' '}
          <Link href="/login" style={authLinkStyle}>
            เข้าสู่ระบบ
          </Link>
        </span>
      }
    >
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <AuthField label="ชื่อ-นามสกุล" autoComplete="name" required maxLength={100} value={fullName} onChange={(e) => setFullName(e.target.value)} />
        <AuthField label="อีเมล" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <AuthField
          label={`รหัสผ่าน (อย่างน้อย ${PASSWORD_MIN_LENGTH} ตัวอักษร)`}
          type="password"
          autoComplete="new-password"
          required
          minLength={PASSWORD_MIN_LENGTH}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <AuthField
          label="ยืนยันรหัสผ่าน"
          type="password"
          autoComplete="new-password"
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
        {error && <AuthNotice tone="error">{error}</AuthNotice>}
        <AuthButton busy={busy}>{busy ? 'กำลังสมัคร...' : 'สมัครใช้งาน'}</AuthButton>
      </form>
    </AuthCard>
  )
}
