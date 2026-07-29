'use client'

import BangKachaoMap from './BangKachaoMap'

const fontStyle = {
  fontFamily: 'var(--font-ibm-plex-sans-thai), IBM Plex Sans Thai, sans-serif',
}

interface MapCardProps {
  selectedDistrict: string
  onSelect?: (district: string) => void
}

export default function MapCard({ selectedDistrict, onSelect }: MapCardProps) {
  return (
    <div
      style={{
        border: '2px solid rgba(0,0,0,0.2)',
        borderRadius: 10,
        padding: '10px 20px 20px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        flex: 1,
      }}
    >
      <div style={{ height: 40, display: 'flex', alignItems: 'center' }}>
        <span
          style={{
            color: '#154212',
            fontSize: 20,
            fontWeight: 600,
            lineHeight: '33px',
            ...fontStyle,
          }}
        >
          แผนที่แสดงพื้นที่แต่ละตำบล
        </span>
      </div>

      <div
        style={{
          borderRadius: 4,
          overflow: 'hidden',
          flex: 1,
          minHeight: 280,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <BangKachaoMap selectedDistrict={selectedDistrict} onSelect={onSelect} />
      </div>
    </div>
  )
}
