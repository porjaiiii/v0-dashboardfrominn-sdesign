'use client'

import Link from 'next/link'
import { ReactNode, useState } from 'react'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ADMIN_COLORS } from '@/lib/admin-tokens'
import { fontStyle } from '@/lib/design-tokens'
import type { DashboardData } from '@/lib/db/types'
import { useDashboard } from '@/lib/use-dashboard'
import { Chevron } from './admin-ui'
import { GridIcon } from './AdminSidebar'

/** ชุดสีของแต่ละหมวด: ผู้ใช้ = น้ำเงิน, ขยะ/CO₂ = เขียว, คะแนน = ม่วง */
const TONES = {
  users: { bg: '#dfe3fb', border: '#b8c3f5', icon: '#4f6df5', main: '#4f6df5' },
  waste: { bg: '#d6ece3', border: '#a9d6c4', icon: '#2f9e6b', main: '#3a9d77' },
  co2: { bg: '#d6ece3', border: '#a9d6c4', icon: '#2f9e6b', main: '#2f9e6b' },
  points: { bg: '#e2dcf6', border: '#c5b9ee', icon: '#7a64d6', main: '#8a74e0' },
} as const
type Tone = keyof typeof TONES

const TH_SHORT = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']
const num = (n: number | null | undefined, digits = 0) =>
  n === null || n === undefined ? '—' : n.toLocaleString('th-TH', { maximumFractionDigits: digits })

/* ───────────── ชิ้นส่วนเล็ก ───────────── */

function IconBox({ tone, size = 36 }: { tone: Tone; size?: number }) {
  return (
    <span
      className="flex shrink-0 items-center justify-center"
      style={{ width: size, height: size, borderRadius: 8, backgroundColor: TONES[tone].icon }}
    >
      <GridIcon size={size * 0.62} />
    </span>
  )
}

/**
 * pill เทียบเดือนก่อน: เขียว = เพิ่มขึ้น, แดง = ลดลง
 * - แบบปกติ: "+17.5% จากเดือนก่อน" (ไม่มีข้อมูลเดือนก่อนให้เทียบ = ไม่แสดง)
 * - แบบมี lead: "+42 คน (12.5%) จากเดือนก่อน" (lead = จำนวนที่เพิ่มในเดือนนี้)
 */
function ChangePill({ value, lead }: { value: number | null | undefined; lead?: string }) {
  if (!lead && (value === null || value === undefined)) return null
  const up = value === null || value === undefined || value >= 0
  const pctText = value === null || value === undefined ? '' : ` (${Math.abs(value).toLocaleString('th-TH', { maximumFractionDigits: 1 })}%)`
  const text = lead
    ? `${lead}${pctText} จากเดือนก่อน`
    : `${up ? '+' : ''}${(value as number).toLocaleString('th-TH', { maximumFractionDigits: 1 })}% จากเดือนก่อน`
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 12px',
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 600,
        backgroundColor: up ? '#dcf2e6' : '#fde6e3',
        border: `1px solid ${up ? '#8fcfae' : '#f0a9a0'}`,
        color: up ? '#1f7a4d' : '#b02e0d',
        ...fontStyle,
      }}
    >
      {text}
    </span>
  )
}

function YearSelect({ years, value, onChange }: { years: number[]; value: number; onChange: (y: number) => void }) {
  return (
    <label
      className="inline-flex items-center"
      style={{
        position: 'relative',
        gap: 14,
        height: 38,
        padding: '0 12px 0 18px',
        borderRadius: 8,
        border: `1.5px solid ${ADMIN_COLORS.navy}`,
        color: ADMIN_COLORS.navy,
        fontSize: 16,
        fontWeight: 600,
        cursor: 'pointer',
        backgroundColor: '#ffffff',
        ...fontStyle,
      }}
    >
      <span>{value}</span>
      <Chevron size={18} />
      <select
        aria-label="เลือกปี"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%' }}
      >
        {years.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
    </label>
  )
}

/** การ์ดตัวเลขสีตามหมวด (แถวบนสุดและแถว "สรุปประจำเดือน") */
function StatTile({
  tone,
  label,
  value,
  unit,
  pill,
  height,
}: {
  tone: Tone
  label: string
  value: string
  unit?: string
  pill?: ReactNode
  height: number
}) {
  const t = TONES[tone]
  return (
    <div
      className="relative min-w-0"
      style={{ height, padding: '8px 12px', borderRadius: 10, backgroundColor: t.bg, border: `1px solid ${t.border}`, color: '#000', ...fontStyle }}
    >
      <div style={{ fontSize: 15, fontWeight: 600, lineHeight: '22px', paddingRight: 44 }}>{label}</div>
      <div className="flex items-baseline" style={{ gap: 8, marginTop: 2 }}>
        <span style={{ fontSize: 32, fontWeight: 600, lineHeight: '40px' }}>{value}</span>
        {unit && <span style={{ fontSize: 15, fontWeight: 600 }}>{unit}</span>}
      </div>
      {pill && <div style={{ marginTop: 4 }}>{pill}</div>}
      <span className="absolute" style={{ top: 10, right: 10 }}>
        <IconBox tone={tone} size={34} />
      </span>
    </div>
  )
}

function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <section
      className={`min-w-0 ${className}`}
      style={{ border: '1.5px solid #cfd5e8', borderRadius: 12, padding: '14px 18px 16px', backgroundColor: '#ffffff', ...fontStyle }}
    >
      {children}
    </section>
  )
}

function CardTitle({ tone, children }: { tone: Tone; children: ReactNode }) {
  return (
    <div className="flex items-center" style={{ gap: 12 }}>
      <IconBox tone={tone} />
      <h2 style={{ color: ADMIN_COLORS.navy, fontSize: 22, fontWeight: 600, margin: 0, lineHeight: '30px' }}>{children}</h2>
    </div>
  )
}

function ErrorNote({ error }: { error: string | null }) {
  if (!error) return null
  return (
    <p role="alert" style={{ color: '#b02e0d', fontWeight: 600, margin: '0 0 12px', ...fontStyle }}>
      โหลดข้อมูลไม่สำเร็จ: {error}
    </p>
  )
}

/* ───────────── กราฟ ───────────── */

const axisTick = { fontSize: 11, fill: '#222', fontFamily: 'IBM Plex Sans Thai, sans-serif' }

function MonthlyChart({
  kind,
  data,
  dataKey,
  color,
  unit,
  gradientId,
}: {
  kind: 'area' | 'bar'
  data: { name: string; value: number | null }[]
  dataKey: string
  color: string
  unit: string
  gradientId: string
}) {
  const rows = data.map((d) => ({ name: d.name, [dataKey]: d.value }))
  const common = { data: rows, margin: { top: 8, right: 12, left: 0, bottom: 0 } }
  const axes = (
    <>
      <CartesianGrid vertical={false} stroke="#e3e6f0" />
      <XAxis dataKey="name" tick={axisTick} tickLine={false} axisLine={{ stroke: '#222' }} interval={0} />
      <YAxis tick={axisTick} tickLine={false} axisLine={{ stroke: '#222' }} width={44} />
      <Tooltip
        formatter={(v) => [`${Number(v).toLocaleString('th-TH')} ${unit}`, '']}
        separator=""
        contentStyle={{ borderRadius: 8, fontFamily: 'IBM Plex Sans Thai, sans-serif', fontSize: 13 }}
      />
    </>
  )
  return (
    <div style={{ width: '100%', height: 210 }}>
      <ResponsiveContainer>
        {kind === 'area' ? (
          <AreaChart {...common}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.5} />
                <stop offset="100%" stopColor={color} stopOpacity={0.04} />
              </linearGradient>
            </defs>
            {axes}
            <Area type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} fill={`url(#${gradientId})`} dot={{ r: 3, fill: color, strokeWidth: 0 }} connectNulls={false} />
          </AreaChart>
        ) : (
          <BarChart {...common}>
            {axes}
            <Bar dataKey={dataKey} fill={color} radius={[2, 2, 0, 0]} maxBarSize={22} />
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  )
}

/** การ์ดกราฟรายเดือน (มีเลือกปีของตัวเอง) */
function ChartPanel({
  tone,
  title,
  total,
  unit,
  pill,
  kind,
  pick,
  dataKey,
  gradientId,
}: {
  tone: Tone
  title: string
  total: (d: DashboardData) => number
  unit: string
  pill: (d: DashboardData) => ReactNode
  kind: 'area' | 'bar'
  pick: (m: DashboardData['months'][number]) => number | null
  dataKey: string
  gradientId: string
}) {
  const [year, setYear] = useState<number | undefined>(undefined)
  const { data, error, loading } = useDashboard(year)
  const t = TONES[tone]

  return (
    <Card>
      <ErrorNote error={error} />
      <div className="flex items-start justify-between" style={{ gap: 12 }}>
        <div>
          <CardTitle tone={tone}>{title}</CardTitle>
          <div style={{ marginTop: 14 }}>
            {data ? <YearSelect years={data.years} value={data.year} onChange={setYear} /> : <div style={{ height: 38 }} />}
          </div>
        </div>
        <div className="flex flex-col items-end" style={{ gap: 8, paddingTop: 2 }}>
          <div style={{ color: ADMIN_COLORS.navy, fontWeight: 600, whiteSpace: 'nowrap' }}>
            <span style={{ fontSize: 14, marginRight: 8 }}>รวมทั้งหมด</span>
            <span style={{ fontSize: 22 }}>{data ? num(total(data), 1) : '—'}</span>
            <span style={{ fontSize: 14, marginLeft: 6 }}>{unit}</span>
          </div>
          {data && pill(data)}
        </div>
      </div>
      <div style={{ marginTop: 10, opacity: loading ? 0.5 : 1, transition: 'opacity .15s' }}>
        {data ? (
          <MonthlyChart
            kind={kind}
            data={data.months.map((m) => ({ name: TH_SHORT[m.month - 1], value: pick(m) }))}
            dataKey={dataKey}
            color={t.main}
            unit={unit}
            gradientId={gradientId}
          />
        ) : (
          <div style={{ height: 210 }} />
        )}
      </div>
    </Card>
  )
}

/* ───────────── แถวบนสุด: ยอดรวม ───────────── */

export function TotalsRow() {
  const { data, error } = useDashboard()
  const t = data?.totals
  return (
    <>
      <ErrorNote error={error} />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile tone="users" label="ผู้ใช้งานทั้งหมด" value={num(t?.users)} unit="คน" height={80} />
        <StatTile tone="waste" label="ขยะสะสม" value={num(t?.weightKg)} unit="kg" height={80} />
        <StatTile tone="co2" label="ลด CO₂" value={num(t?.co2Kg)} unit="kgCO₂" height={80} />
        <StatTile tone="points" label="คะแนนที่ใช้แลกรางวัล" value={num(t?.pointsSpent)} height={80} />
      </div>
    </>
  )
}

/* ───────────── กราฟ 3 ใบ ───────────── */

export function UsersChartPanel() {
  return (
    <ChartPanel
      tone="users"
      title="ผู้ใช้งานทั้งหมด"
      unit="คน"
      kind="area"
      dataKey="users"
      gradientId="g-users"
      total={(d) => d.totals.users}
      pick={(m) => m.users}
      pill={(d) => <ChangePill value={d.current.change.newUsers} lead={`+${num(d.current.newUsers)} คน`} />}
    />
  )
}

export function WasteChartPanel() {
  return (
    <ChartPanel
      tone="waste"
      title="ขยะสะสม"
      unit="kg"
      kind="bar"
      dataKey="weight"
      gradientId="g-waste"
      total={(d) => d.totals.weightKg}
      pick={(m) => m.weightKg}
      pill={() => null}
    />
  )
}

export function Co2ChartPanel() {
  return (
    <ChartPanel
      tone="co2"
      title="ลด CO2"
      unit="kgCO2"
      kind="area"
      dataKey="co2"
      gradientId="g-co2"
      total={(d) => d.totals.co2Kg}
      pick={(m) => m.co2CumKg}
      pill={(d) => <ChangePill value={d.current.change.co2Kg} />}
    />
  )
}

/* ───────────── การ์ดคะแนนที่ใช้แลกรางวัล ───────────── */

export function RewardsPanel() {
  const [year, setYear] = useState<number | undefined>(undefined)
  const { data, error, loading } = useDashboard(year)
  const t = TONES.points
  const top = data?.rewards.top ?? []
  const max = Math.max(1, ...top.map((r) => r.count))

  const box = (label: string, value: string, unit: string) => (
    <div style={{ flex: 1, minWidth: 0, padding: '10px 14px', borderRadius: 8, backgroundColor: t.bg, border: `1px solid ${t.border}` }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: '#111' }}>{label}</div>
      <div style={{ marginTop: 10, color: '#111' }}>
        <span style={{ fontSize: 24, fontWeight: 600 }}>{value}</span> <span style={{ fontSize: 14, fontWeight: 600 }}>{unit}</span>
      </div>
    </div>
  )

  return (
    <Card>
      <ErrorNote error={error} />
      <div className="flex items-center justify-between" style={{ gap: 12 }}>
        <CardTitle tone="points">คะแนนที่ใช้แลกรางวัล</CardTitle>
        {data && <YearSelect years={data.years} value={data.year} onChange={setYear} />}
      </div>

      <div style={{ opacity: loading ? 0.5 : 1, transition: 'opacity .15s' }}>
        <div className="flex" style={{ gap: 14, marginTop: 12 }}>
          {box('คะแนนที่ได้รับทั้งหมด', num(data?.rewards.pointsEarned), 'คะแนน')}
          {box('จำนวนของรางวัลที่ถูกแลก', num(data?.rewards.redeemedCount), 'ชิ้น')}
        </div>

        <div className="flex items-center justify-between" style={{ marginTop: 16 }}>
          <h3 style={{ color: ADMIN_COLORS.navy, fontSize: 16, fontWeight: 600, margin: 0 }}>ของรางวัลที่ถูกแลก (Top 5)</h3>
          <Link href="/admin/rewards" style={{ color: ADMIN_COLORS.navy, fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>
            ดูรายละเอียดทั้งหมด→
          </Link>
        </div>

        <ul style={{ listStyle: 'none', margin: '8px 0 0', padding: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {top.map((r) => (
            <li key={r.name} className="flex items-start" style={{ gap: 10 }}>
              <IconBox tone="points" size={26} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="flex items-center justify-between" style={{ gap: 8, fontSize: 14, fontWeight: 600, color: ADMIN_COLORS.navy }}>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</span>
                  <span style={{ whiteSpace: 'nowrap' }}>{num(r.count)} ชิ้น</span>
                </div>
                <div style={{ height: 6, borderRadius: 999, backgroundColor: '#e4defa', marginTop: 4, overflow: 'hidden' }}>
                  <div style={{ width: `${(r.count / max) * 100}%`, height: '100%', borderRadius: 999, backgroundColor: t.main }} />
                </div>
              </div>
            </li>
          ))}
          {data && top.length === 0 && <li style={{ color: '#8a8fa0', fontSize: 14 }}>ยังไม่มีการแลกรางวัลในปีนี้</li>}
        </ul>
      </div>
    </Card>
  )
}

/* ───────────── สรุปประจำเดือน ───────────── */

export function MonthlySummary() {
  const { data, error } = useDashboard()
  const c = data?.current
  return (
    <Card>
      <ErrorNote error={error} />
      <div className="flex items-center" style={{ gap: 12 }}>
        <IconBox tone="users" />
        <div>
          <h2 style={{ color: ADMIN_COLORS.navy, fontSize: 22, fontWeight: 600, margin: 0, lineHeight: '28px' }}>สรุปประจำเดือน</h2>
          <div style={{ color: ADMIN_COLORS.navy, fontSize: 14, fontWeight: 600 }}>เดือน {c?.label ?? '—'}</div>
        </div>
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4" style={{ marginTop: 14 }}>
        <StatTile tone="users" label="ผู้ใช้ใหม่" value={num(c?.newUsers)} unit="คน" height={116} pill={<ChangePill value={c?.change.newUsers} />} />
        <StatTile tone="waste" label="ขยะสะสม" value={num(c?.weightKg, 1)} unit="kg" height={116} pill={<ChangePill value={c?.change.weightKg} />} />
        <StatTile tone="co2" label="ลด CO₂" value={num(c?.co2Kg, 1)} unit="kgCO₂" height={116} pill={<ChangePill value={c?.change.co2Kg} />} />
        <StatTile tone="points" label="คะแนนที่ใช้แลกรางวัล" value={num(c?.pointsSpent)} unit="คะแนน" height={116} pill={<ChangePill value={c?.change.pointsSpent} />} />
      </div>
    </Card>
  )
}
