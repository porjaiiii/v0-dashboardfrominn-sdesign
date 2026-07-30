'use client'

import BangKachaoMap from './BangKachaoMap'
import { cardStyle, cardTitleStyle } from '@/lib/design-tokens'

interface MapCardProps {
  selectedDistrict: string
  onSelect?: (district: string) => void
}

export default function MapCard({ selectedDistrict, onSelect }: MapCardProps) {
  return (
    <div
      style={{
        ...cardStyle,
        padding: '10px 20px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        flex: 1,
        minWidth: 0,
      }}
    >
      <h3 style={cardTitleStyle}>แผนที่ข้อมูลขยะรายตำบล</h3>

      <div
        style={{
          flex: 1,
          minHeight: 320,
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
