'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useAuth } from '@/lib/auth-context'
import { useLiff } from '@/lib/liff-context'

const fontStyle = {
  fontFamily: 'var(--font-ibm-plex-sans-thai), IBM Plex Sans Thai, sans-serif',
}

export default function LoginPage() {
  const router = useRouter()
  const { emailLogin } = useAuth()
  const { isLiffReady, liffLogin } = useLiff()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const ok = await emailLogin(email, password)
    setLoading(false)
    if (ok) {
      router.push('/')
    } else {
      setError('อีเมลหรือรหัสผ่านไม่ถูกต้อง')
    }
  }

  const handleLineLogin = () => {
    liffLogin()
  }

  return (
    <div
      className="flex items-center justify-center"
      style={{ minHeight: '100vh', backgroundColor: '#f4f7f4' }}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: 16,
          padding: '40px 48px',
          width: '100%',
          maxWidth: 440,
          boxShadow: '0 4px 32px rgba(21,66,18,0.10)',
          display: 'flex',
          flexDirection: 'column',
          gap: 28,
        }}
      >
        {/* Logo + Title */}
        <div className="flex flex-col items-center" style={{ gap: 12 }}>
          <Image src="/logo-mascot.png" alt="โลโก้" width={72} height={88} style={{ objectFit: 'contain' }} />
          <h1
            style={{
              color: '#154212',
              fontSize: 26,
              fontWeight: 700,
              margin: 0,
              textAlign: 'center',
              ...fontStyle,
            }}
          >
            คุ้งบางกะเจ้า
          </h1>
          <p style={{ color: '#6b7280', fontSize: 14, margin: 0, ...fontStyle }}>
            ระบบข้อมูลร่วมอนุรักษ์โลก
          </p>
        </div>

        {/* Email login form */}
        <form onSubmit={handleEmailLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ color: '#154212', fontSize: 14, fontWeight: 600, ...fontStyle }}>
              อีเมล
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="กรอกอีเมล"
              required
              style={{
                border: '1.5px solid #d1d5db',
                borderRadius: 8,
                padding: '10px 14px',
                fontSize: 14,
                color: '#154212',
                outline: 'none',
                ...fontStyle,
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#154212')}
              onBlur={(e) => (e.target.style.borderColor = '#d1d5db')}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ color: '#154212', fontSize: 14, fontWeight: 600, ...fontStyle }}>
              รหัสผ่าน
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="กรอกรหัสผ่าน"
              required
              style={{
                border: '1.5px solid #d1d5db',
                borderRadius: 8,
                padding: '10px 14px',
                fontSize: 14,
                color: '#154212',
                outline: 'none',
                ...fontStyle,
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#154212')}
              onBlur={(e) => (e.target.style.borderColor = '#d1d5db')}
            />
          </div>

          {error && (
            <p style={{ color: '#c06060', fontSize: 13, margin: 0, ...fontStyle }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              backgroundColor: '#154212',
              color: '#ffffff',
              border: 'none',
              borderRadius: 8,
              padding: '12px',
              fontSize: 15,
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              ...fontStyle,
            }}
          >
            {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center" style={{ gap: 12 }}>
          <div style={{ flex: 1, height: 1, backgroundColor: '#e5e7eb' }} />
          <span style={{ color: '#9ca3af', fontSize: 13, ...fontStyle }}>หรือ</span>
          <div style={{ flex: 1, height: 1, backgroundColor: '#e5e7eb' }} />
        </div>

        {/* LINE Login */}
        <button
          onClick={handleLineLogin}
          disabled={!isLiffReady}
          style={{
            backgroundColor: '#06c755',
            color: '#ffffff',
            border: 'none',
            borderRadius: 8,
            padding: '12px',
            fontSize: 15,
            fontWeight: 600,
            cursor: !isLiffReady ? 'not-allowed' : 'pointer',
            opacity: !isLiffReady ? 0.6 : 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            ...fontStyle,
          }}
        >
          {/* LINE icon */}
          <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
            <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
          </svg>
          เข้าสู่ระบบด้วย LINE
        </button>

        {/* Demo hint */}
        <p style={{ color: '#9ca3af', fontSize: 12, margin: 0, textAlign: 'center', ...fontStyle }}>
          ทดสอบ: admin@bangkachao.go.th / admin1234
        </p>
      </div>
    </div>
  )
}
