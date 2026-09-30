'use client'

import { useMemo, useState } from 'react'
import { PieChart, Pie, Cell } from 'recharts'
import AdminShell from '@/components/dashboard/AdminShell'
import { CsvButton, PageTitle, SearchInput, SectionTitle, SolidSelect, downloadCsv } from '@/components/dashboard/admin-ui'
import { RESTOCK_TARGET } from '@/lib/db/constants'
import type { RewardsOverview } from '@/lib/db/types'
import { ADMIN_COLORS } from '@/lib/admin-tokens'
import { fontStyle } from '@/lib/design-tokens'
import { useAdminFetch } from '@/lib/use-admin-list'

const TONE = { green: '#154212', blue: '#203a99', amber: '#d68900', red: '#c00000' } as const
const DONUT_COLORS = ['#1b8014', '#e4ca00', '#b02e0d', '#203a99', '#8b9bd6']
const TH_MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']

/** 6 เดือนล่าสุด: label "ก.ย. 2569" → period "2026-09" (ตรงกับ API) */
function periodOptions(): { label: string; value: string }[] {
  const now = new Date()
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    return {
      label: `${TH_MONTHS[d.getMonth()]} ${d.getFullYear() + 543}`,
      value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
    }
  })
}

function OutlineStat({
  label,
  value,
  unit,
  tone,
  valueColor,
}: {
  label: string
  value: string
  unit: string
  tone: string
  valueColor?: string
}) {
  return (
    <div
      className="flex flex-col items-center justify-center"
      style={{
        flex: 1,
        minWidth: 0,
        height: 138,
        borderRadius: 8,
        border: `1.5px solid ${tone}`,
        color: tone,
        fontWeight: 600,
        textAlign: 'center',
        ...fontStyle,
      }}
    >
      <div style={{ fontSize: 18 }}>{label}</div>
      <div style={{ fontSize: 46, lineHeight: '56px', color: valueColor ?? tone }}>{value}</div>
      <div style={{ fontSize: 18 }}>{unit}</div>
    </div>
  )
}

const outlineSmall = {
  height: 34,
  padding: '0 14px',
  borderRadius: 8,
  border: `1.5px solid ${ADMIN_COLORS.navy}`,
  backgroundColor: '#ffffff',
  color: ADMIN_COLORS.navy,
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
  ...fontStyle,
} as const

function Sparkle() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={ADMIN_COLORS.navy} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M9 4l1.8 4.7L15.5 10.5l-4.7 1.8L9 17l-1.8-4.7L2.5 10.5l4.7-1.8zM18 3v4M16 5h4M18 16v4M16 18h4" />
    </svg>
  )
}

const n = (v: number | undefined) => (v === undefined ? '...' : v.toLocaleString('th-TH'))

export default function RewardsPage() {
  const periods = useMemo(periodOptions, [])
  const [periodLabel, setPeriodLabel] = useState(periods[0].label)
  const [query, setQuery] = useState('')

  const period = periods.find((p) => p.label === periodLabel)?.value ?? periods[0].value
  const { data, error } = useAdminFetch<RewardsOverview>(`/api/admin/rewards-overview?period=${period}`)

  const alerts = (data?.lowStock ?? []).filter((a) => a.name.includes(query))
  const top = (data?.topRedeemed ?? []).filter((t) => t.name.includes(query))
  const donut = top.slice(0, 5).map((t, i) => ({ ...t, color: DONUT_COLORS[i] }))

  return (
    <AdminShell activeHref="/admin/rewards">
      <PageTitle title="รายการรางวัล" subtitle="สรุปสถานะสต๊อกและรายการที่ต้องดำเนินการ" />

      <div style={{ marginBottom: 16 }}>
        <SearchInput value={query} onChange={setQuery} placeholder="ค้นหาของรางวัล" />
      </div>

      {error && (
        <p role="alert" style={{ color: '#b02e0d', fontWeight: 600 }}>
          โหลดข้อมูลไม่สำเร็จ: {error}
        </p>
      )}

      <div className="flex" style={{ gap: 16 }}>
        <OutlineStat label="ของรางวัล" value={n(data?.rewardTypes)} unit="ประเภท" tone={TONE.green} />
        <OutlineStat label="จำนวนของทั้งหมด" value={n(data?.totalStock)} unit="ชิ้น" tone={ADMIN_COLORS.navy} valueColor={TONE.blue} />
        <OutlineStat label="ของใกล้หมด" value={n(data ? data.lowStock.filter((l) => l.stock > 0).length : undefined)} unit="ประเภท" tone={TONE.amber} />
        <OutlineStat label="ของหมด" value={n(data?.outOfStock)} unit="ประเภท" tone={TONE.red} />
      </div>

      <div className="flex items-center" style={{ gap: 12, margin: '16px 0' }}>
        <span style={{ color: ADMIN_COLORS.navy, fontSize: 22, fontWeight: 600, ...fontStyle }}>ช่วงเวลา</span>
        <SolidSelect label="ช่วงเวลา" value={periodLabel} options={periods.map((p) => p.label)} onChange={setPeriodLabel} />
      </div>

      <div className="flex" style={{ gap: 16 }}>
        <OutlineStat label="ของรางวัล" value={n(data?.rewardTypes)} unit="ประเภท" tone={TONE.green} />
        <OutlineStat label="จำนวนของทั้งหมด" value={n(data?.totalStock)} unit="ชิ้น" tone={ADMIN_COLORS.navy} valueColor={TONE.blue} />
        <OutlineStat label="คะแนนที่ใช้" value={n(data?.pointsSpent)} unit="คะแนน" tone={TONE.amber} />
      </div>

      {/* โดนัท + legend */}
      <div className="flex items-center" style={{ gap: 30, margin: '16px 0 22px', minHeight: 310 }}>
        {donut.length > 0 ? (
          <>
            <PieChart width={310} height={310}>
              <Pie data={donut} dataKey="count" nameKey="name" innerRadius={70} outerRadius={155} stroke="#ffffff" strokeWidth={3} startAngle={90} endAngle={-270}>
                {donut.map((d) => (
                  <Cell key={d.name} fill={d.color} />
                ))}
              </Pie>
            </PieChart>
            <div className="flex flex-col" style={{ flex: 1, gap: 14, ...fontStyle }}>
              {donut.map((d) => (
                <div key={d.name} className="flex items-center justify-between" style={{ color: ADMIN_COLORS.navy, fontSize: 20, fontWeight: 600 }}>
                  <span className="flex items-center" style={{ gap: 12 }}>
                    <span style={{ width: 16, height: 16, borderRadius: '50%', backgroundColor: d.color }} />
                    {d.name}
                  </span>
                  <span>{d.count} ครั้ง</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <span style={{ color: '#8a8fa0', ...fontStyle }}>ยังไม่มีการแลกรางวัลในช่วงเวลานี้</span>
        )}
      </div>

      <div className="flex items-center justify-between" style={{ marginBottom: 14 }}>
        <SectionTitle>รายการที่ต้องดำเนินการ</SectionTitle>
        <button type="button" style={outlineSmall}>
          ทั้งหมด →
        </button>
      </div>

      <div className="flex flex-col" style={{ gap: 14 }}>
        {alerts.map((a) => {
          const out = a.stock <= 0
          const tone = out ? TONE.red : TONE.amber
          return (
            <div key={a.id} style={{ display: 'flex', borderRadius: 8, border: `1.5px solid ${tone}`, overflow: 'hidden', minHeight: 172, ...fontStyle }}>
              <div style={{ width: 30, backgroundColor: tone, flexShrink: 0 }} />
              <div className="flex flex-col justify-between" style={{ flex: 1, padding: '14px 24px' }}>
                <div className="flex items-start justify-between">
                  <div>
                    <div style={{ color: ADMIN_COLORS.navy, fontSize: 30, fontWeight: 600, lineHeight: '40px' }}>{a.name}</div>
                    {out ? (
                      <div className="flex items-center" style={{ gap: 10, marginTop: 4 }}>
                        <span style={{ background: TONE.red, color: '#fff', borderRadius: 999, padding: '2px 12px', fontSize: 16, fontWeight: 600 }}>สินค้าหมด</span>
                        <span style={{ color: TONE.red, fontSize: 18, fontWeight: 600 }}>สินค้าหมด</span>
                      </div>
                    ) : (
                      <div style={{ color: ADMIN_COLORS.navy, fontSize: 18, fontWeight: 600, marginTop: 4 }}>สต๊อกต่ำกว่าจำนวนขั้นต่ำ</div>
                    )}
                  </div>
                  <div style={{ color: ADMIN_COLORS.navy, fontSize: 26, fontWeight: 600 }}>เหลือ {a.stock} ชิ้น</div>
                </div>
                <div className="flex items-end justify-between">
                  <span className="flex items-center" style={{ gap: 8, color: ADMIN_COLORS.navy, fontSize: 18, fontWeight: 600 }}>
                    <Sparkle />
                    คำแนะนำ : ควรซื้อ {Math.max(1, RESTOCK_TARGET - a.stock)} ชิ้น
                  </span>
                  <a href="/admin/reward-stock" style={{ ...outlineSmall, height: 40, fontSize: 16, padding: '0 20px', display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}>
                    เติมสต๊อก
                  </a>
                </div>
              </div>
            </div>
          )
        })}
        {data && alerts.length === 0 && <span style={{ color: '#8a8fa0', ...fontStyle }}>ไม่มีรายการที่ต้องดำเนินการ</span>}
      </div>

      <div className="flex items-center justify-between" style={{ margin: '24px 0 14px' }}>
        <SectionTitle>ของรางวัลที่ถูกแลกมากที่สุดในเดือน</SectionTitle>
        <CsvButton
          compact
          onClick={() => downloadCsv('top-rewards.csv', ['ลำดับ', 'ของรางวัล', 'จำนวน (ครั้ง)'], top.map((t, i) => [i + 1, t.name, t.count]))}
        />
      </div>

      <div style={{ border: `1.5px solid ${ADMIN_COLORS.navy}`, borderRadius: 10, overflow: 'hidden', ...fontStyle }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', fontSize: 18, fontWeight: 600 }}>
          <thead>
            <tr style={{ backgroundColor: ADMIN_COLORS.navy, color: '#ffffff', height: 46 }}>
              <th style={{ width: '8%' }}>ลำดับ</th>
              <th style={{ width: '34%', borderLeft: '1px solid #fff' }}>ของรางวัล</th>
              <th style={{ borderLeft: '1px solid #fff' }}>จำนวน</th>
            </tr>
          </thead>
          <tbody>
            {top.map((t, i) => (
              <tr key={t.name} style={{ height: 48, borderTop: `1px solid ${ADMIN_COLORS.navy}`, color: ADMIN_COLORS.navy }}>
                <td>{i + 1}</td>
                <td style={{ borderLeft: `1px solid ${ADMIN_COLORS.navy}` }}>{t.name}</td>
                <td style={{ borderLeft: `1px solid ${ADMIN_COLORS.navy}` }}>{t.count} ครั้ง</td>
              </tr>
            ))}
            {top.length === 0 && (
              <tr style={{ height: 48 }}>
                <td colSpan={3} style={{ color: '#8a8fa0', fontWeight: 500 }}>
                  ไม่มีข้อมูล
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminShell>
  )
}
