'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import SelectPill from '@/components/ui/SelectPill'
import {
  COLORS,
  WASTE_COLORS,
  axisCaptionStyle,
  axisTickStyle,
  cardTitleStyle,
  fontStyle,
  tooltipStyle,
} from '@/lib/design-tokens'

interface WasteRecord {
  id: string
  date: string
  wasteType: string
  weight: number
}

function formatYAxis(value: number) {
  if (value === 0) return '0'
  return value.toLocaleString()
}

// แปลงวันที่ (ISO/String) เป็นปี พ.ศ.
function getYearBE(dateStr: string): string {
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return ''
  return String(d.getFullYear() + 543)
}

// จำแนกประเภทขยะให้ตรงกับ 4 หมวดหลัก
function matchCategory(typeStr: string): 'plastic' | 'glass' | 'paper' | 'aluminium' | 'other' {
  const t = (typeStr || '').toLowerCase()
  if (t.includes('plastic') || t.includes('พลาสติก')) return 'plastic'
  if (t.includes('glass') || t.includes('แก้ว')) return 'glass'
  if (t.includes('paper') || t.includes('กระดาษ')) return 'paper'
  if (
    t.includes('alumi') ||
    t.includes('อลูมิเนียม') ||
    t.includes('กระป๋อง') ||
    t.includes('โลหะ')
  ) return 'aluminium'
  return 'other'
}

const TYPE_SERIES = [
  { key: 'plastic', label: 'พลาสติก', color: WASTE_COLORS['พลาสติก'] },
  { key: 'glass', label: 'แก้ว', color: WASTE_COLORS['แก้ว'] },
  { key: 'paper', label: 'กระดาษ', color: WASTE_COLORS['กระดาษ'] },
  { key: 'aluminium', label: 'อลูมิเนียม', color: WASTE_COLORS['อลูมิเนียม'] },
] as const

/** legend แบบจุดกลม จัดกึ่งกลางเหนือกราฟ ตามแบบ */
function ChartLegend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <div className="flex items-center justify-center" style={{ gap: 20, flexWrap: 'wrap' }}>
      {items.map(({ label, color }) => (
        <div key={label} className="flex items-center" style={{ gap: 7 }}>
          <span
            style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: color, flexShrink: 0 }}
          />
          <span style={{ color: COLORS.green, fontSize: 15, fontWeight: 600, ...fontStyle }}>
            {label}
          </span>
        </div>
      ))}
    </div>
  )
}

export default function AnnualWasteChart() {
  const [records, setRecords] = useState<WasteRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedYear, setSelectedYear] = useState('แสดงทุกปี')
  /** true เมื่อผู้ใช้เลือกปีเอง — หลังจากนั้นจะไม่ตั้งค่าอัตโนมัติอีก */
  const [yearPicked, setYearPicked] = useState(false)

  // 1. ดึงข้อมูลจริงจาก API
  useEffect(() => {
    const fetchChartData = async () => {
      try {
        setIsLoading(true)
        const res = await fetch('/api/waste/dashboard')
        if (res.ok) {
          const result = await res.json()
          setRecords(result.records || [])
        }
      } catch (err) {
        console.error('[AnnualWasteChart] Fetch error:', err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchChartData()
  }, [])

  // 2. ดึงรายการปี พ.ศ. ทั้งหมดที่มีอยู่ในข้อมูลจริงแบบ Dynamic
  const yearOptions = useMemo(() => {
    const yearsSet = new Set<string>()
    records.forEach((r) => {
      const y = getYearBE(r.date)
      if (y) yearsSet.add(y)
    })
    const sortedYears = Array.from(yearsSet).sort((a, b) => Number(b) - Number(a))
    return ['แสดงทุกปี', ...sortedYears]
  }, [records])

  // เมื่อข้อมูลโหลดเสร็จ ให้เลือกปีล่าสุดเป็นค่าเริ่มต้น (กราฟรายเดือนอ่านง่ายกว่าจุดเดียวต่อปี)
  useEffect(() => {
    if (yearPicked) return
    const years = yearOptions.slice(1) // เรียงจากใหม่ไปเก่า
    if (years.length > 0) setSelectedYear(years[0])
  }, [yearOptions, yearPicked])

  // 3. ประมวลผลข้อมูลกราฟ (แยกตาม 'แสดงทุกปี' หรือ 'เลือกเฉพาะปี')
  const chartData = useMemo(() => {
    if (records.length === 0) return []

    if (selectedYear === 'แสดงทุกปี') {
      // ─── กรณี: แสดงทุกปี (แกน X เป็น ปี พ.ศ.) ───
      const map: Record<string, { label: string; total: number; plastic: number; glass: number; paper: number; aluminium: number }> = {}

      records.forEach((r) => {
        const y = getYearBE(r.date)
        if (!y) return

        if (!map[y]) {
          map[y] = { label: y, total: 0, plastic: 0, glass: 0, paper: 0, aluminium: 0 }
        }

        const cat = matchCategory(r.wasteType)
        const w = r.weight || 0

        map[y].total += w
        if (cat === 'plastic') map[y].plastic += w
        else if (cat === 'glass') map[y].glass += w
        else if (cat === 'paper') map[y].paper += w
        else if (cat === 'aluminium') map[y].aluminium += w
      })

      return Object.values(map)
        .sort((a, b) => Number(a.label) - Number(b.label))
        .map((item) => ({
          ...item,
          total: Math.round(item.total * 100) / 100,
          plastic: Math.round(item.plastic * 100) / 100,
          glass: Math.round(item.glass * 100) / 100,
          paper: Math.round(item.paper * 100) / 100,
          aluminium: Math.round(item.aluminium * 100) / 100,
        }))
    } else {
      // ─── กรณี: เลือกเฉพาะปี (แกน X เป็น ม.ค. - ธ.ค. ของปีนั้น) ───
      const monthsList = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']
      const monthMap = monthsList.map((m) => ({
        label: m,
        total: 0,
        plastic: 0,
        glass: 0,
        paper: 0,
        aluminium: 0,
      }))

      records.forEach((r) => {
        const y = getYearBE(r.date)
        if (y !== selectedYear) return

        const d = new Date(r.date)
        if (isNaN(d.getTime())) return
        const mIdx = d.getMonth()

        const cat = matchCategory(r.wasteType)
        const w = r.weight || 0

        monthMap[mIdx].total += w
        if (cat === 'plastic') monthMap[mIdx].plastic += w
        else if (cat === 'glass') monthMap[mIdx].glass += w
        else if (cat === 'paper') monthMap[mIdx].paper += w
        else if (cat === 'aluminium') monthMap[mIdx].aluminium += w
      })

      return monthMap.map((item) => ({
        ...item,
        total: Math.round(item.total * 100) / 100,
        plastic: Math.round(item.plastic * 100) / 100,
        glass: Math.round(item.glass * 100) / 100,
        paper: Math.round(item.paper * 100) / 100,
        aluminium: Math.round(item.aluminium * 100) / 100,
      }))
    }
  }, [records, selectedYear])

  const gridProps = {
    stroke: COLORS.grid,
    strokeWidth: 1,
    vertical: true,
    horizontal: true,
  }

  return (
    <div className="flex flex-col" style={{ gap: 10 }}>
      {/* หัวข้อ + dropdown เลือกปี */}
      <div className="flex items-center" style={{ gap: 14 }}>
        <h2 style={cardTitleStyle}>ปริมาณขยะประจำปี</h2>
        <SelectPill
          value={selectedYear}
          options={yearOptions}
          onChange={(y) => {
            setYearPicked(true)
            setSelectedYear(y)
          }}
        />
      </div>

      {isLoading ? (
        <div
          className="flex items-center justify-center"
          style={{ height: 300, color: COLORS.green, fontWeight: 600, ...fontStyle }}
        >
          กำลังโหลดข้อมูลกราฟ...
        </div>
      ) : (
        <>
          {/* กราฟที่ 1: ขยะทั้งหมด */}
          <div style={{ paddingTop: 20 }}>
            <ChartLegend items={[{ label: 'ขยะทั้งหมด', color: COLORS.green }]} />
            <div style={{ ...axisCaptionStyle, marginTop: 16, marginBottom: 2 }}>น้ำหนัก (KG)</div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: 20, bottom: 0 }}>
                <CartesianGrid {...gridProps} />
                <XAxis dataKey="label" tick={axisTickStyle} axisLine={false} tickLine={false} />
                <YAxis
                  tickFormatter={formatYAxis}
                  tick={axisTickStyle}
                  axisLine={false}
                  tickLine={false}
                  domain={[0, 'auto']}
                  width={60}
                />
                <Tooltip
                  formatter={(value: any) => [
                    `${Number(value || 0).toLocaleString()} KG`,
                    'ขยะทั้งหมด',
                  ]}
                  contentStyle={tooltipStyle}
                />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke={COLORS.green}
                  strokeWidth={2}
                  dot={{ r: 3, strokeWidth: 0, fill: COLORS.green }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* กราฟที่ 2: แยกตามประเภท */}
          <div style={{ paddingTop: 40 }}>
            <ChartLegend items={TYPE_SERIES.map((s) => ({ label: s.label, color: s.color }))} />
            <div style={{ ...axisCaptionStyle, marginTop: 16, marginBottom: 2 }}>น้ำหนัก (KG)</div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: 20, bottom: 0 }}>
                <CartesianGrid {...gridProps} />
                <XAxis dataKey="label" tick={axisTickStyle} axisLine={false} tickLine={false} />
                <YAxis
                  tickFormatter={formatYAxis}
                  tick={axisTickStyle}
                  axisLine={false}
                  tickLine={false}
                  domain={[0, 'auto']}
                  width={60}
                />
                <Tooltip
                  formatter={(value: any, name: any) => {
                    const labels: Record<string, string> = {
                      plastic: 'พลาสติก',
                      glass: 'แก้ว',
                      paper: 'กระดาษ',
                      aluminium: 'อลูมิเนียม',
                    }
                    const key = String(name || '')
                    return [`${Number(value || 0).toLocaleString()} KG`, labels[key] || key]
                  }}
                  contentStyle={tooltipStyle}
                />
                {TYPE_SERIES.map((s) => (
                  <Line
                    key={s.key}
                    type="monotone"
                    dataKey={s.key}
                    stroke={s.color}
                    strokeWidth={2}
                    dot={{ r: 3, strokeWidth: 0, fill: s.color }}
                    activeDot={{ r: 5 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  )
}
