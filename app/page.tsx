'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Sidebar from '@/components/dashboard/Sidebar'
import StatCards from '@/components/dashboard/StatCards'
import AnnualWasteChart from '@/components/dashboard/AnnualWasteChart'
import MapCard from '@/components/dashboard/MapCard'
import WasteTypeChart from '@/components/dashboard/WasteTypeChart'
import MonthlyWasteChart from '@/components/dashboard/MonthlyWasteChart'
import { useAuth } from '@/lib/auth-context'
import { useLiff } from '@/lib/liff-context'

const fontStyle = {
  fontFamily: 'var(--font-ibm-plex-sans-thai), IBM Plex Sans Thai, sans-serif',
}

export default function Home() {
  const router = useRouter()
  const { emailUser, emailLogout } = useAuth()
  const { isLiffReady, isLoggedIn: liffLoggedIn, profile: liffProfile, liffLogout } = useLiff()

  const [selectedDistrict, setSelectedDistrict] = useState('บางกะเจ้า')
  const [profileOpen, setProfileOpen] = useState(false)

  const [chartType, setChartType] = useState<'donut' | 'bar'>('donut')

  // Derived auth state
  const isAuthenticated = !!emailUser || liffLoggedIn

  // Redirect to login if not authenticated
  useEffect(() => {
    if (isLiffReady && !isAuthenticated) {
      router.push('/login')
    }
  }, [isLiffReady, isAuthenticated, router])

  if (!isAuthenticated) return null

  // Determine display name and avatar
  const displayName = liffLoggedIn
    ? liffProfile?.displayName ?? ''
    : emailUser?.name ?? ''
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
      {/* Sidebar */}
      <Sidebar />

      {/* Main content */}
      <div className="flex flex-col" style={{ flex: 1, minWidth: 0 }}>
        {/* Top header bar */}
        <div
          className="flex items-center justify-between"
          style={{
            height: 70,
            backgroundColor: '#ffffff',
            borderBottom: '1px solid rgba(0,0,0,0.2)',
            padding: '0 20px',
            flexShrink: 0,
          }}
        >
          <Image
            src="/figma/tabler-icon-menu-2.svg"
            alt="menu"
            width={30}
            height={30}
          />

          {/* User profile top-right */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center"
              style={{
                gap: 10,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '6px 10px',
                borderRadius: 8,
              }}
            >
              {/* Avatar */}
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt="profile"
                  width={36}
                  height={36}
                  style={{ borderRadius: '50%', objectFit: 'cover' }}
                />
              ) : (
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    backgroundColor: '#154212',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    fontSize: 15,
                    fontWeight: 700,
                    ...fontStyle,
                    flexShrink: 0,
                  }}
                >
                  {displayName.charAt(0)}
                </div>
              )}
              <span
                style={{
                  color: '#154212',
                  fontSize: 14,
                  fontWeight: 600,
                  ...fontStyle,
                  maxWidth: 140,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {displayName}
              </span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#154212" strokeWidth="2.5">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>

            {profileOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '110%',
                  right: 0,
                  backgroundColor: '#ffffff',
                  border: '1.5px solid #e5e7eb',
                  borderRadius: 10,
                  boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
                  minWidth: 180,
                  zIndex: 50,
                  overflow: 'hidden',
                }}
              >
                <div style={{ padding: '12px 16px', borderBottom: '1px solid #f3f4f6' }}>
                  {avatarUrl && (
                    <div className="flex justify-center" style={{ marginBottom: 8 }}>
                      <Image
                        src={avatarUrl}
                        alt="profile"
                        width={52}
                        height={52}
                        style={{ borderRadius: '50%', objectFit: 'cover' }}
                      />
                    </div>
                  )}
                  <p style={{ color: '#154212', fontSize: 14, fontWeight: 700, margin: 0, ...fontStyle, textAlign: 'center' }}>
                    {displayName}
                  </p>
                  {liffLoggedIn && liffProfile?.statusMessage && (
                    <p style={{ color: '#9ca3af', fontSize: 12, margin: '2px 0 0', ...fontStyle, textAlign: 'center' }}>
                      {liffProfile.statusMessage}
                    </p>
                  )}
                  {emailUser && (
                    <p style={{ color: '#9ca3af', fontSize: 12, margin: '2px 0 0', ...fontStyle, textAlign: 'center' }}>
                      {emailUser.email}
                    </p>
                  )}
                </div>
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
                    color: '#c06060',
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
        </div>

        {/* Page content */}
        <main
          style={{
            backgroundColor: '#ffffff',
            padding: '20px 32px',
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
          }}
        >
          {/* Page title */}
          <h1
            style={{
              color: '#154212',
              fontSize: 32,
              fontWeight: 600,
              lineHeight: '52.8px',
              margin: 0,
              ...fontStyle,
            }}
          >
            ข้อมูลร่วมอนุรักษ์โลก
          </h1>

          {/* Stat cards */}
          <StatCards />

          {/* Annual waste chart */}
          <AnnualWasteChart />
          {/* Section Header + Toggle Switch Button */}
          <div className="flex items-center justify-between" style={{ marginTop: 10 }}>
            <span
              style={{
                color: '#154212',
                fontSize: 22,
                fontWeight: 600,
                ...fontStyle,
              }}
            >
              สถิติขยะแยกตามพื้นที่และประเภท
            </span>

            {/* ปุ่ม Toggle สลับมุมมอง */}
            <div
              style={{
                display: 'flex',
                backgroundColor: '#ffffff',
                border: '2px solid #154212',
                borderRadius: 10,
                padding: 3,
                gap: 4,
              }}
            >
              <button
                onClick={() => setChartType('donut')}
                style={{
                  padding: '6px 14px',
                  borderRadius: 7,
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 600,
                  backgroundColor: chartType === 'donut' ? '#154212' : 'transparent',
                  color: chartType === 'donut' ? '#ffffff' : '#154212',
                  transition: 'all 0.2s ease',
                  ...fontStyle,
                }}
              >
                กราฟโดนัท 
              </button>
              <button
                onClick={() => setChartType('bar')}
                style={{
                  padding: '6px 14px',
                  borderRadius: 7,
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 600,
                  backgroundColor: chartType === 'bar' ? '#154212' : 'transparent',
                  color: chartType === 'bar' ? '#ffffff' : '#154212',
                  transition: 'all 0.2s ease',
                  ...fontStyle,
                }}
              >
                กราฟแท่ง 
              </button>
            </div>
          </div>

          {/* Dynamic Layout ตามประเภทกราฟที่เลือก */}
{chartType === 'donut' ? (
  /* 1. โหมดกราฟโดนัท: แสดงแผนที่ และ โดนัทเคียงข้างกัน (ขนาดปกติ) */
  <div className="flex" style={{ gap: 20 }}>
    <MapCard selectedDistrict={selectedDistrict} onSelect={setSelectedDistrict} />
    <WasteTypeChart
      selected={selectedDistrict}
      onSelect={setSelectedDistrict}
    />
  </div>
) : (
  /* 2. โหมดกราฟแท่ง: คุมความสูงแผนที่ให้อยู่ในกรอบผืนผ้าใบแนวนอน (ไม่สูงเทอะทะ) */
  <div className="flex flex-col" style={{ gap: 20 }}>
    <div style={{ maxHeight: 320, overflow: 'hidden', borderRadius: 12, display: 'flex' }}>
      <MapCard selectedDistrict={selectedDistrict} onSelect={setSelectedDistrict} />
    </div>
    <MonthlyWasteChart tambon={selectedDistrict} />
  </div>
)}
        </main>
      </div>
    </div>
  )
}
