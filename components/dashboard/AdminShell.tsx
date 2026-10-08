'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
import Image from 'next/image'
import AdminSidebar from '@/components/dashboard/AdminSidebar'
import { useSession, type SessionAccount } from '@/lib/use-session'
import { fontStyle } from '@/lib/design-tokens'
import { ADMIN_COLORS } from '@/lib/admin-tokens'

const CurrentAccountContext = createContext<SessionAccount | null>(null)

/** บัญชีแอดมินที่ล็อกอินอยู่ — ใช้ได้ในคอมโพเนนต์ที่อยู่ภายใน AdminShell */
export const useCurrentAccount = () => useContext(CurrentAccountContext)

/**
 * โครงหน้าแอดมิน: sidebar + header (โปรไฟล์/โลโก้) + เนื้อหา
 * ตรวจการล็อกอินจาก /api/auth/session — ผู้ใช้ที่ไม่ใช่แอดมินจะถูกส่งไปหน้าแดชบอร์ดผู้ใช้
 */
export default function AdminShell({
  activeHref,
  children,
}: {
  activeHref: string
  children: ReactNode
}) {
  const { account, logout } = useSession('admin')
  const [profileOpen, setProfileOpen] = useState(false)

  if (!account) return null

  return (
    <div className="flex" style={{ minHeight: '100vh', backgroundColor: '#ffffff' }}>
      <AdminSidebar activeHref={activeHref} />

      <div className="flex flex-col" style={{ flex: 1, minWidth: 0 }}>
        <div
          className="flex items-center justify-between"
          style={{
            height: 49,
            backgroundColor: '#ffffff',
            borderBottom: `1px solid ${ADMIN_COLORS.border}`,
            padding: '0 20px',
            flexShrink: 0,
          }}
        >
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center"
              style={{ gap: 8, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: '50%',
                  backgroundColor: ADMIN_COLORS.navyHeader,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  fontSize: 14,
                  fontWeight: 700,
                  ...fontStyle,
                }}
              >
                {account.fullName.charAt(0)}
              </div>
              <span style={{ color: ADMIN_COLORS.navy, fontSize: 14, fontWeight: 600, ...fontStyle }}>{account.fullName}</span>
            </button>

            {profileOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '120%',
                  left: 0,
                  backgroundColor: '#ffffff',
                  border: '1.5px solid #e5e7eb',
                  borderRadius: 10,
                  boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
                  minWidth: 220,
                  zIndex: 50,
                  overflow: 'hidden',
                }}
              >
                <p style={{ margin: 0, padding: '10px 16px', color: '#6b7280', fontSize: 13, borderBottom: '1px solid #f3f4f6', ...fontStyle }}>
                  {account.email}
                </p>
                <button
                  onClick={logout}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '10px 16px',
                    textAlign: 'left',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: ADMIN_COLORS.navy,
                    fontSize: 14,
                    fontWeight: 600,
                    ...fontStyle,
                  }}
                >
                  ออกจากระบบ
                </button>
              </div>
            )}
          </div>

          <Image src="/mascot-icon.png" alt="โลโก้" width={26} height={32} />
        </div>

        <main style={{ padding: '0 20px 30px', display: 'flex', flexDirection: 'column' }}>
          <CurrentAccountContext.Provider value={account}>{children}</CurrentAccountContext.Provider>
        </main>
      </div>
    </div>
  )
}
