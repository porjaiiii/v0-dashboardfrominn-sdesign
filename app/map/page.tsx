'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Sidebar from '@/components/dashboard/Sidebar'
import MenuButton from '@/components/dashboard/MenuButton'
import BangKachaoMap from '@/components/dashboard/BangKachaoMap'
import WasteTypeChart from '@/components/dashboard/WasteTypeChart'
import MonthlyWasteChart from '@/components/dashboard/MonthlyWasteChart'
import MapWithPins from '@/components/dashboard/MapWithPins'
import DonationCard from '@/components/dashboard/DonationCard'
import TopContributors from '@/components/dashboard/TopContributors'
import { useAuth } from '@/lib/auth-context'
import { useLiff } from '@/lib/liff-context'
import { TAMBON_LIST } from '@/lib/map-data'

const fontStyle = {
  fontFamily: 'var(--font-ibm-plex-sans-thai), IBM Plex Sans Thai, sans-serif',
}

export default function MapPage() {
  const router = useRouter()
  const { emailUser, emailLogout } = useAuth()
  const { isLiffReady, isLoggedIn: liffLoggedIn, profile: liffProfile, liffLogout } = useLiff()

  const [selectedTambon, setSelectedTambon] = useState('บางกะเจ้า')
  const [profileOpen, setProfileOpen] = useState(false)

  const isAuthenticated = !!emailUser || liffLoggedIn

  useEffect(() => {
    if (isLiffReady && !isAuthenticated) {
      router.push('/login')
    }
  }, [isLiffReady, isAuthenticated, router])

  if (!isAuthenticated) return null

  const displayName = liffLoggedIn
    ? liffProfile?.displayName ?? ''
    : emailUser?.name ?? ''
  const avatarUrl = liffLoggedIn ? liffProfile?.pictureUrl : null

  const handleLogout = () => {
    if (liffLoggedIn) liffLogout()
    else emailLogout()
    router.push('/login')
  }

  return (
    <div className="flex" style={{ minHeight: '100vh', backgroundColor: '#ffffff' }}>
      <Sidebar activePage="map" />

      <div className="flex flex-col" style={{ flex: 1, minWidth: 0 }}>

        {/* ── Top header — identical to main page ── */}
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
          <MenuButton />

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
                    flexShrink: 0,
                  }}
                >
                  {displayName ? (
                    <span style={{ color: '#ffffff', fontSize: 15, fontWeight: 700, ...fontStyle }}>
                      {displayName.charAt(0)}
                    </span>
                  ) : (
                    /* Default user SVG icon */
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="8" r="4" />
                      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                    </svg>
                  )}
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

        {/* ── Main scrollable content ── */}
        <main
          style={{
            flex: 1,
            padding: '24px 28px',
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
            overflowY: 'auto',
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
            แผนที่คุ้งบางกะเจ้า
          </h1>

          {/* Tambon Selector */}
          <div className="flex items-center" style={{ gap: 10, flexWrap: 'wrap' }}>
            <span style={{ color: '#154212', fontSize: 14, fontWeight: 600, ...fontStyle }}>
              เลือกตำบล:
            </span>
            {TAMBON_LIST.map((t) => (
              <button
                key={t}
                onClick={() => setSelectedTambon(t)}
                style={{
                  padding: '6px 18px',
                  borderRadius: 20,
                  border: '2px solid',
                  borderColor: selectedTambon === t ? '#154212' : '#b8d8b2',
                  backgroundColor: selectedTambon === t ? '#154212' : '#ffffff',
                  color: selectedTambon === t ? '#ffffff' : '#154212',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  ...fontStyle,
                }}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Row 1: Map + Donut + Monthly Chart */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: 16, alignItems: 'stretch' }}>
            <div style={{ border: '2px solid rgba(0,0,0,0.12)', borderRadius: 12, padding: '14px 16px', backgroundColor: '#ffffff' }}>
              <h3 style={{ color: '#154212', fontSize: 14, fontWeight: 700, margin: '0 0 10px 0', ...fontStyle }}>
                แผนที่แสดงสถานที่กำจัดขยะ
              </h3>
              <BangKachaoMap selectedDistrict={selectedTambon} />
            </div>
            <WasteTypeChart selected={selectedTambon} onSelect={setSelectedTambon} />
            <MonthlyWasteChart tambon={selectedTambon} />
          </div>

          {/* Row 2: Map with Pins + Donations + Top Contributors */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', gap: 16, alignItems: 'start' }}>
            <MapWithPins tambon={selectedTambon} />
            <DonationCard tambon={selectedTambon} />
            <TopContributors tambon={selectedTambon} />
          </div>
        </main>
      </div>
    </div>
  )
}
