'use client'

import { fontStyle } from '@/lib/design-tokens'
import { ADMIN_COLORS } from '@/lib/admin-tokens'
import type { DashboardSummary } from '@/lib/db/types'
import { useAdminFetch } from '@/lib/use-admin-list'
import { GridIcon } from './AdminSidebar'

const fmt = (n: number | undefined) =>
  n === undefined ? '...' : Math.round(n).toLocaleString('th-TH')

export default function AdminStatCards() {
  const { data, error } = useAdminFetch<DashboardSummary>('/api/admin/summary')

  const stats = [
    { label: 'ผู้ใช้งานทั้งหมด', value: fmt(data?.users), unit: '' },
    { label: 'ขยะสะสม', value: fmt(data?.totalWeightKg), unit: 'kg' },
    { label: 'ลด CO₂', value: fmt(data?.totalCo2Kg), unit: 'kgCO₂' },
    { label: 'คะแนนที่แจกทั้งหมด', value: fmt(data?.pointsIssued), unit: '' },
  ]

  return (
    <>
      {error && (
        <p role="alert" style={{ color: '#b02e0d', fontWeight: 600, margin: '0 0 10px', ...fontStyle }}>
          โหลดข้อมูลไม่สำเร็จ: {error}
        </p>
      )}
      <div className="flex" style={{ gap: 20 }}>
        {stats.map((s) => (
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
    </>
  )
}
