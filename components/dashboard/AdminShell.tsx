'use client'

import { useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import AdminSidebar from '@/components/dashboard/AdminSidebar'
import { useAuth } from '@/lib/auth-context'
import { useLiff } from '@/lib/liff-context'
import { fontStyle } from '@/lib/design-tokens'
import { ADMIN_COLORS } from '@/lib/admin-tokens'

/** โครงหน้าแอดมิน: sidebar + header (โปรไฟล์/โลโก้) + เนื้อหา พร้อมตรวจการล็อกอิน */
export default function AdminShell({
  activeHref,
  children,
}: {
  activeHref: string
  children: ReactNode
}) {
  const router = useRouter()
  const { emailUser, emailLogout } = useAuth()
  const { isLiffReady, isLoggedIn: liffLoggedIn, profile: liffProfile, liffLogout } = useLiff()
  const [profileOpen, setProfileOpen] = useState(false)

  const isAuthenticated = !!emailUser || liffLoggedIn

  useEffect(() => {
    if (isLiffReady && !isAuthenticated) {
      router.push('/login')
    }
  }, [isLiffReady, isAuthenticated, router])

  if (!isAuthenticated) return null

  const displayName = liffLoggedIn ? liffProfile?.displayName ?? '' : emailUser?.name ?? ''
  const avatarUrl = liffLoggedIn ? liffProfile?.pictureUrl : null

  const handleLogout = () => {
    if (liffLoggedIn) {
      liffLogout()
    } else {
      emailLogout()
    }
    router.push('/login')
  }

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
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt="profile"
                  width={30}
                  height={30}
                  style={{ borderRadius: '50%', objectFit: 'cover' }}
                />
              ) : (
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
                  {displayName.charAt(0)}
                </div>
              )}
              <span style={{ color: ADMIN_COLORS.navy, fontSize: 14, fontWeight: 600, ...fontStyle }}>
                {displayName}
              </span>
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
                  minWidth: 180,
                  zIndex: 50,
                  overflow: 'hidden',
                }}
              >
                {emailUser && (
                  <p
                    style={{
                      color: '#9ca3af',
                      fontSize: 12,
                      margin: 0,
                      padding: '10px 16px',
                      borderBottom: '1px solid #f3f4f6',
                      ...fontStyle,
                    }}
                  >
                    {emailUser.email}
                  </p>
                )}
                <button
                  onClick={handleLogout}
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

          <Image src="/logo-mascot.png" alt="โลโก้" width={26} height={34} style={{ height: 'auto' }} />
        </div>

        <main style={{ padding: '0 20px 30px', display: 'flex', flexDirection: 'column' }}>
          {children}
        </main>
      </div>
    </div>
  )
}
