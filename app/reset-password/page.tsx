'use client'

import Link from 'next/link'
import { FormEvent, useState } from 'react'
import { AuthButton, AuthCard, AuthField, AuthNotice, authLinkStyle } from '@/components/auth/AuthCard'
import { postJson, queryParam } from '@/lib/auth-client'
import { PASSWORD_MIN_LENGTH } from '@/lib/auth/policy'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (password !== confirm) return setError('รหัสผ่านทั้งสองช่องไม่ตรงกัน')
    setBusy(true)
    setError(null)
    const { ok, data } = await postJson('/api/auth/reset-password', { token: queryParam('token') ?? '', password })
    if (ok) {
      window.location.href = '/login?notice=reset'
      return
    }
    setError(data.error || 'ตั้งรหัสผ่านใหม่ไม่สำเร็จ')
    setBusy(false)
  }

  return (
    <AuthCard
      title="ตั้งรหัสผ่านใหม่"
      footer={
        <Link href="/forgot-password" style={authLinkStyle}>
          ขอลิงก์ใหม่
        </Link>
      }
    >
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <AuthField
          label={`รหัสผ่านใหม่ (อย่างน้อย ${PASSWORD_MIN_LENGTH} ตัวอักษร)`}
          type="password"
          autoComplete="new-password"
          required
          minLength={PASSWORD_MIN_LENGTH}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <AuthField
          label="ยืนยันรหัสผ่านใหม่"
          type="password"
          autoComplete="new-password"
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
        {error && <AuthNotice tone="error">{error}</AuthNotice>}
        <AuthButton busy={busy}>{busy ? 'กำลังบันทึก...' : 'บันทึกรหัสผ่านใหม่'}</AuthButton>
      </form>
    </AuthCard>
  )
}
