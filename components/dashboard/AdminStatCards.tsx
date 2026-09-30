'use client'

import { fontStyle } from '@/lib/design-tokens'
import { ADMIN_COLORS } from '@/lib/admin-tokens'
import { GridIcon } from './AdminSidebar'

const STATS = [
  { label: 'ผู้ใช้งานทั้งหมด', value: '500', unit: '' },
  { label: 'ขยะสะสม', value: '6,767', unit: 'kg' },
  { label: 'ลด CO₂', value: '2,456', unit: 'kgCO₂' },
  { label: 'คะแนนที่แจกทั้งหมด', value: '99,546', unit: '' },
]

export default function AdminStatCards() {
  return (
    <div className="flex" style={{ gap: 20 }}>
      {STATS.map((s) => (
        <div
          key={s.label}
          style={{
            position: 'relative',
            flex: 1,
            minWidth: 0,
            height: 80,
            padding: '8px 10px',
            borderRadius: 8,
            backgroundColor: ADMIN_COLORS.cardBg,
            border: `1px solid ${ADMIN_COLORS.cardBorder}`,
            color: '#000',
            ...fontStyle,
          }}
        >
          <div style={{ fontSize: 15, fontWeight: 600, lineHeight: '22px' }}>{s.label}</div>
          <div className="flex items-baseline" style={{ gap: 8, marginTop: 2 }}>
            <span style={{ fontSize: 32, fontWeight: 600, lineHeight: '40px' }}>{s.value}</span>
            {s.unit && <span style={{ fontSize: 15, fontWeight: 600 }}>{s.unit}</span>}
          </div>
          <div
            className="flex items-center justify-center"
            style={{
              position: 'absolute',
              top: 12,
              right: 10,
              width: 34,
              height: 34,
              borderRadius: 6,
              backgroundColor: ADMIN_COLORS.cardIcon,
            }}
          >
            <GridIcon size={22} />
          </div>
        </div>
      ))}
    </div>
  )
}
