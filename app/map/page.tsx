'use client'

import { useState } from 'react'
import Sidebar from '@/components/dashboard/Sidebar'
import MenuButton from '@/components/dashboard/MenuButton'
import BangKachaoMap from '@/components/dashboard/BangKachaoMap'
import WasteTypeChart from '@/components/dashboard/WasteTypeChart'
import MonthlyWasteChart from '@/components/dashboard/MonthlyWasteChart'
import MapWithPins from '@/components/dashboard/MapWithPins'
import DonationCard from '@/components/dashboard/DonationCard'
import TopContributors from '@/components/dashboard/TopContributors'
import UserAccountMenu from '@/components/dashboard/UserAccountMenu'
import { useSession } from '@/lib/use-session'
import { TAMBON_LIST } from '@/lib/map-data'

const fontStyle = {
  fontFamily: 'var(--font-ibm-plex-sans-thai), IBM Plex Sans Thai, sans-serif',
}

export default function MapPage() {
  const { account, logout } = useSession('signed-in')
  const [selectedTambon, setSelectedTambon] = useState('บางกะเจ้า')

  if (!account) return null

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

          <UserAccountMenu account={account} onLogout={logout} />
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
