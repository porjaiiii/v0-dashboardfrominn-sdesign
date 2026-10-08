'use client'

import Image from 'next/image'
import Link from 'next/link'
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react'
import { fontStyle } from '@/lib/design-tokens'

/** ชิ้นส่วน UI ของหน้าเข้าสู่ระบบ/สมัคร/ลืมรหัสผ่าน (การ์ดเขียวแบบหน้า /login เดิม) */

const GREEN = '#154212'

export const authLinkStyle = { color: GREEN, fontWeight: 600, textDecoration: 'underline' } as const

export function AuthCard({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string
  subtitle?: string
  children: ReactNode
  footer?: ReactNode
}) {
  return (
    <div className="flex items-center justify-center" style={{ minHeight: '100vh', backgroundColor: '#f4f7f4', padding: 16, ...fontStyle }}>
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: 16,
          padding: '36px 32px',
          width: '100%',
          maxWidth: 440,
          boxShadow: '0 4px 32px rgba(21,66,18,0.10)',
          display: 'flex',
          flexDirection: 'column',
          gap: 22,
        }}
      >
        <div className="flex flex-col items-center" style={{ gap: 10 }}>
          <Link href="/" aria-label="หน้าหลัก">
            <Image src="/logo-mascot.png" alt="โลโก้" width={64} height={78} priority style={{ objectFit: 'contain' }} />
          </Link>
          <h1 style={{ color: GREEN, fontSize: 24, fontWeight: 700, margin: 0, textAlign: 'center' }}>{title}</h1>
          {subtitle && <p style={{ color: '#6b7280', fontSize: 14, margin: 0, textAlign: 'center' }}>{subtitle}</p>}
        </div>
        {children}
        {footer && (
          <div className="flex flex-col items-center" style={{ gap: 6, color: '#6b7280', fontSize: 14 }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

export function AuthField({ label, ...input }: { label: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6, color: GREEN, fontSize: 14, fontWeight: 600 }}>
      {label}
      <input
        {...input}
        style={{ border: '1.5px solid #d1d5db', borderRadius: 8, padding: '10px 14px', fontSize: 15, color: GREEN, ...fontStyle }}
      />
    </label>
  )
}

export function AuthButton({
  busy = false,
  variant = 'solid',
  children,
  ...rest
}: { busy?: boolean; variant?: 'solid' | 'outline'; children: ReactNode } & ButtonHTMLAttributes<HTMLButtonElement>) {
  const solid = variant === 'solid'
  return (
    <button
      type={solid ? 'submit' : 'button'}
      disabled={busy || rest.disabled}
      {...rest}
      style={{
        backgroundColor: solid ? GREEN : '#ffffff',
        color: solid ? '#ffffff' : GREEN,
        border: `1.5px solid ${GREEN}`,
        borderRadius: 8,
        padding: 12,
        fontSize: 15,
        fontWeight: 600,
        cursor: busy ? 'not-allowed' : 'pointer',
        opacity: busy ? 0.7 : 1,
        ...fontStyle,
      }}
    >
      {children}
    </button>
  )
}

export function AuthNotice({ tone, children }: { tone: 'error' | 'info'; children: ReactNode }) {
  const c = tone === 'error' ? { bg: '#fdecea', fg: '#b02e0d' } : { bg: '#e8f3e6', fg: GREEN }
  return (
    <p
      role={tone === 'error' ? 'alert' : 'status'}
      style={{ margin: 0, padding: '10px 12px', borderRadius: 8, backgroundColor: c.bg, color: c.fg, fontSize: 14, fontWeight: 600 }}
    >
      {children}
    </p>
  )
}
