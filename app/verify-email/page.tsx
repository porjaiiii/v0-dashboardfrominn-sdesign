'use client'

import Link from 'next/link'
import { useState } from 'react'
import { AuthButton, AuthCard, AuthNotice, authLinkStyle } from '@/components/auth/AuthCard'
import { postJson, queryParam } from '@/lib/auth-client'

/** ลิงก์ในอีเมลพามาที่นี่ — ต้องกดปุ่มเอง (POST) ตัวสแกนลิงก์ในอีเมลจึงยืนยันแทนไม่ได้ */
export default function VerifyEmailPage() {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const confirm = async () => {
    setBusy(true)
    setError(null)
    const { ok, data } = await postJson('/api/auth/verify-email', { token: queryParam('token') ?? '' })
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
      subtitle="กดปุ่มด้านล่างเพื่อยืนยันอีเมลและส่งคำขอเปิดบัญชีให้ผู้ดูแลระบบ"
      footer={
        <span>
          ลิงก์หมดอายุ?{' '}
          <Link href="/signup" style={authLinkStyle}>
            สมัครอีกครั้งด้วยอีเมลเดิม
          </Link>
        </span>
      }
    >
      {error && <AuthNotice tone="error">{error}</AuthNotice>}
      <AuthButton busy={busy} type="button" onClick={confirm}>
        {busy ? 'กำลังยืนยัน...' : 'ยืนยันอีเมล'}
      </AuthButton>
    </AuthCard>
  )
}
