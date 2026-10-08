'use client'

import Link from 'next/link'
import { useState } from 'react'
import { fontStyle } from '@/lib/design-tokens'
import type { SessionAccount } from '@/lib/use-session'

const GREEN = '#154212'

/** เมนูบัญชีมุมขวาบนของหน้าแดชบอร์ดผู้ใช้ (ชื่อ, อีเมล, ไปหน้าแอดมิน, ออกจากระบบ) */
export default function UserAccountMenu({ account, onLogout }: { account: SessionAccount; onLogout: () => void }) {
  const [open, setOpen] = useState(false)
  const item = {
    display: 'block',
    width: '100%',
    padding: '10px 16px',
    textAlign: 'left',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 600,
    textDecoration: 'none',
    ...fontStyle,
  } as const

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center"
        style={{ gap: 10, background: 'none', border: 'none', cursor: 'pointer', padding: '6px 10px', borderRadius: 8 }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            backgroundColor: GREEN,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            color: '#ffffff',
            fontSize: 15,
            fontWeight: 700,
            ...fontStyle,
          }}
        >
          {account.fullName.charAt(0)}
        </div>
        <span
          style={{
            color: GREEN,
            fontSize: 14,
            fontWeight: 600,
            maxWidth: 160,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            ...fontStyle,
          }}
        >
          {account.fullName}
        </span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={GREEN} strokeWidth="2.5" aria-hidden>
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: '110%',
            right: 0,
            backgroundColor: '#ffffff',
            border: '1.5px solid #e5e7eb',
            borderRadius: 10,
            boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
            minWidth: 200,
            zIndex: 50,
            overflow: 'hidden',
          }}
        >
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #f3f4f6', textAlign: 'center', ...fontStyle }}>
            <p style={{ color: GREEN, fontSize: 14, fontWeight: 700, margin: 0 }}>{account.fullName}</p>
            <p style={{ color: '#9ca3af', fontSize: 12, margin: '2px 0 0' }}>{account.email}</p>
          </div>
          {account.role === 'admin' && (
            <Link href="/admin/dashboard" style={{ ...item, color: GREEN }}>
              ไปหน้าแอดมิน
            </Link>
          )}
          <button onClick={onLogout} style={{ ...item, color: '#c06060' }}>
            ออกจากระบบ
          </button>
        </div>
      )}
    </div>
  )
}
