'use client'

import { useEffect, useMemo, useState } from 'react'
import AdminShell from '@/components/dashboard/AdminShell'
import AnnualWasteChart from '@/components/dashboard/AnnualWasteChart'
import MapCard from '@/components/dashboard/MapCard'
import WasteTypeChart from '@/components/dashboard/WasteTypeChart'
import { CsvButton, SummaryCard, downloadCsv } from '@/components/dashboard/admin-ui'
import { ADMIN_COLORS } from '@/lib/admin-tokens'
import { COLORS, cardStyle, fontStyle } from '@/lib/design-tokens'

interface WasteRecord {
  date: string
  wasteType: string
  weight: number
  carbon: number
  subdistrict?: string
}

type Category = 'plastic' | 'glass' | 'paper' | 'aluminium'

function categoryOf(typeStr: string): Category | null {
  const t = (typeStr || '').toLowerCase()
  if (t.includes('plastic') || t.includes('พลาสติก')) return 'plastic'
  if (t.includes('glass') || t.includes('แก้ว')) return 'glass'
  if (t.includes('paper') || t.includes('กระดาษ')) return 'paper'
  if (t.includes('alumi') || t.includes('อลูมิเนียม') || t.includes('กระป๋อง') || t.includes('โลหะ')) return 'aluminium'
  return null
}

const TYPE_CARDS: { key: Category; label: string; color: string }[] = [
  { key: 'plastic', label: 'น้ำหนักขยะประเภทพลาสติก', color: COLORS.plastic },
  { key: 'glass', label: 'น้ำหนักขยะประเภทแก้ว', color: COLORS.glass },
  { key: 'paper', label: 'น้ำหนักขยะประเภทกระดาษ', color: COLORS.paper },
  { key: 'aluminium', label: 'น้ำหนักขยะประเภทอลูมิเนียม', color: COLORS.aluminium },
]

const fmt = (n: number) => n.toLocaleString('th-TH', { maximumFractionDigits: 1 })

export default function WasteDataPage() {
  const [records, setRecords] = useState<WasteRecord[]>([])
  const [district, setDistrict] = useState('ทุกตำบล')

  useEffect(() => {
    fetch('/api/waste/dashboard')
      .then((res) => (res.ok ? res.json() : { records: [] }))
      .then((json) => setRecords(json.records || []))
      .catch((err) => console.error('[WasteData] Fetch error:', err))
  }, [])

  const totals = useMemo(() => {
    const byType: Record<Category, number> = { plastic: 0, glass: 0, paper: 0, aluminium: 0 }
    let weight = 0
    let carbon = 0
    records.forEach((r) => {
      const w = Number(r.weight || 0)
      weight += w
      carbon += Number(r.carbon || 0)
      const c = categoryOf(r.wasteType)
      if (c) byType[c] += w
    })
    return { byType, weight, carbon }
  }, [records])

  const exportCsv = () =>
    downloadCsv(
      'waste-data.csv',
      ['date', 'wasteType', 'subdistrict', 'weight_kg', 'carbon'],
      records.map((r) => [r.date, r.wasteType, r.subdistrict ?? '', r.weight, r.carbon]),
    )

  return (
    <AdminShell activeHref="/admin/waste-data">
      <div className="flex items-center justify-between" style={{ margin: '10px 0 12px' }}>
        <h1 style={{ color: ADMIN_COLORS.navy, fontSize: 26, fontWeight: 600, margin: 0, ...fontStyle }}>
          ข้อมูลร่วมอนุรักษ์โลก
        </h1>
        <CsvButton onClick={exportCsv} />
      </div>

      <div className="flex" style={{ gap: 26 }}>
        <SummaryCard label="ขยะสะสม" value={fmt(totals.weight)} unit="kg" inline height={126} />
        <SummaryCard label="ลด CO₂" value={fmt(totals.carbon)} unit="kgCO₂" inline height={126} />
      </div>

      <div className="flex" style={{ gap: 20, margin: '14px 0 18px' }}>
        {TYPE_CARDS.map((c) => (
          <div
            key={c.key}
            className="flex flex-col items-center justify-center"
            style={{
              flex: 1,
              minWidth: 0,
              height: 112,
              borderRadius: 8,
              backgroundColor: c.color,
              boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
              color: '#ffffff',
              fontWeight: 600,
              textAlign: 'center',
              ...fontStyle,
            }}
          >
            <div style={{ fontSize: 15 }}>{c.label}</div>
            <div style={{ fontSize: 38, lineHeight: '46px' }}>{fmt(totals.byType[c.key])}</div>
            <div style={{ fontSize: 15 }}>กิโลกรัม</div>
          </div>
        ))}
      </div>

      <div style={{ ...cardStyle, padding: '10px 20px 20px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        <AnnualWasteChart />
        <div className="flex" style={{ gap: 20 }}>
          <MapCard selectedDistrict={district} onSelect={setDistrict} />
          <WasteTypeChart selected={district} onSelect={setDistrict} />
        </div>
      </div>
    </AdminShell>
  )
}
