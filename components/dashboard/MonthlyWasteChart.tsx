'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  BarChart,
  Bar,
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
  WASTE_TYPE_ORDER,
  axisTickStyle,
  cardStyle,
  cardTitleStyle,
  fontStyle,
  pillStyle,
  tooltipStyle,
} from '@/lib/design-tokens'

const WASTE_TYPES = WASTE_TYPE_ORDER

const MONTH_NAMES = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.',
]

const FULL_MONTH_NAMES = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
]

interface WasteRecord {
  id: string
  date: string
  subdistrict: string
  wasteType: string
  weight: number
}

/** แถวข้อมูลกราฟ ใช้ร่วมกันทั้งโหมดรายเดือนและรายวัน */
interface ChartRow {
  month?: string
  monthIndex?: number
  dayLabel?: string
  day?: number
  พลาสติก: number
  แก้ว: number
  กระดาษ: number
  อลูมิเนียม: number
  total: number
}

interface MonthlyWasteChartProps {
  tambon: string
}

// จำแนกประเภทขยะให้ตรงกับ 4 หมวดหลัก
function matchCategory(typeStr: string): 'พลาสติก' | 'แก้ว' | 'กระดาษ' | 'อลูมิเนียม' | 'อื่น ๆ' {
  const t = (typeStr || '').toLowerCase()
  if (t.includes('plastic') || t.includes('พลาสติก')) return 'พลาสติก'
  if (t.includes('glass') || t.includes('แก้ว')) return 'แก้ว'
  if (t.includes('paper') || t.includes('กระดาษ')) return 'กระดาษ'
  if (
    t.includes('alumi') ||
    t.includes('อลูมิเนียม') ||
    t.includes('กระป๋อง') ||
    t.includes('โลหะ')
  ) return 'อลูมิเนียม'
  return 'อื่น ๆ'
}

export default function MonthlyWasteChart({ tambon }: MonthlyWasteChartProps) {
  const [records, setRecords] = useState<WasteRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // โหมดการมองเห็น: 'monthly' = รายเดือน, 'daily' = รายวัน
  const [viewMode, setViewMode] = useState<'monthly' | 'daily'>('monthly')

  // ตัวเลือก ปี / เดือน
  const [selectedYear, setSelectedYear] = useState<number>(2569)
  const [selectedMonth, setSelectedMonth] = useState<number>(0) // 0 = ม.ค., 11 = ธ.ค.

  // 1. ดึงข้อมูลจริงจาก API
  useEffect(() => {
    const fetchRecords = async () => {
      try {
        setIsLoading(true)
        const res = await fetch('/api/waste/dashboard')
        if (res.ok) {
          const result = await res.json()
          setRecords(result.records || [])
        }
      } catch (err) {
        console.error('[MonthlyWasteChart] Fetch error:', err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchRecords()
  }, [])

  // 2. ดึงปี พ.ศ. ทั้งหมดที่มีในข้อมูลดิบแบบ Dynamic
  const availableYears = useMemo(() => {
    const yearsSet = new Set<number>()
    records.forEach((r) => {
      const d = new Date(r.date)
      if (!isNaN(d.getTime())) {
        yearsSet.add(d.getFullYear() + 543)
      }
    })
    const list = Array.from(yearsSet).sort((a, b) => b - a)
    return list.length > 0 ? list : [2569, 2568, 2567]
  }, [records])

  // ปรับ selectedYear อัตโนมัติเมื่อข้อมูลปีโหลดมาเสร็จ
  useEffect(() => {
    if (availableYears.length > 0 && !availableYears.includes(selectedYear)) {
      setSelectedYear(availableYears[0])
    }
  }, [availableYears, selectedYear])

  // 3. กรองข้อมูลตาม ตำบล (Tambon)
  const filteredRecords = useMemo(() => {
  return records.filter((r: any) => {
    // 1. ถ้าไม่ได้เลือกตำบล หรือเลือก "ทั้งหมด" ให้ดึงทุกรายการ
    if (!tambon || tambon === 'ทุกตำบล' || tambon === 'ทั้งหมด') return true

    // 2. ดึงชื่อตำบลจาก record
    const sub = (r.subdistrict || r.subDistrict || r.tambon || '').trim()

    // 🔴 [จุดสำคัญ] ถ้า record นี้ไม่มีชื่อตำบล ให้ข้ามไปเลย (ไม่เอามารวมซ้ำ)
    if (!sub) return false

    // 3. ทำความสะอาดข้อความ (ตัดคำว่า "ตำบล" ออกเพื่อเปรียบเทียบชื่อเพียวๆ)
    const cleanSub = sub.replace(/^ตำบล/, '').trim()
    const cleanTarget = tambon.replace(/^ตำบล/, '').trim()

    // 4. เปรียบเทียบชื่อ
    return cleanSub.includes(cleanTarget) || cleanTarget.includes(cleanSub)
  })
  }, [records, tambon])

  // 4. ประมวลผลข้อมูลสำหรับแสดงในกราฟ (แยกตามโหมด 'รายเดือน' หรือ 'รายวัน')
  const chartData = useMemo<ChartRow[]>(() => {
    if (viewMode === 'monthly') {
      // ─── โหมดรายเดือน ───
      const monthlyMap = MONTH_NAMES.map((mName, mIdx) => ({
        month: mName,
        monthIndex: mIdx,
        พลาสติก: 0,
        แก้ว: 0,
        กระดาษ: 0,
        อลูมิเนียม: 0,
        total: 0,
      }))

      filteredRecords.forEach((r) => {
        const d = new Date(r.date)
        if (isNaN(d.getTime())) return
        const yBE = d.getFullYear() + 543
        if (yBE !== Number(selectedYear)) return

        const mIdx = d.getMonth()
        const cat = matchCategory(r.wasteType)
        const w = r.weight || 0

        if (cat in monthlyMap[mIdx]) {
          (monthlyMap[mIdx] as any)[cat] += w
          monthlyMap[mIdx].total += w
        }
      })

      return monthlyMap.map((item) => ({
        ...item,
        พลาสติก: Math.round(item.พลาสติก * 100) / 100,
        แก้ว: Math.round(item.แก้ว * 100) / 100,
        กระดาษ: Math.round(item.กระดาษ * 100) / 100,
        อลูมิเนียม: Math.round(item.อลูมิเนียม * 100) / 100,
      }))
    } else {
      // ─── โหมดรายวัน ───
      const yearAD = Number(selectedYear) - 543
      const daysInMonth = new Date(yearAD, selectedMonth + 1, 0).getDate()

      const dailyMap = Array.from({ length: daysInMonth }, (_, i) => ({
        dayLabel: `${i + 1}`,
        day: i + 1,
        พลาสติก: 0,
        แก้ว: 0,
        กระดาษ: 0,
        อลูมิเนียม: 0,
        total: 0,
      }))

      filteredRecords.forEach((r) => {
        const d = new Date(r.date)
        if (isNaN(d.getTime())) return
        const yBE = d.getFullYear() + 543
        if (yBE !== Number(selectedYear)) return
        if (d.getMonth() !== selectedMonth) return

        const dayIdx = d.getDate() - 1
        if (dayIdx >= 0 && dayIdx < daysInMonth) {
          const cat = matchCategory(r.wasteType)
          const w = r.weight || 0
          if (cat in dailyMap[dayIdx]) {
            (dailyMap[dayIdx] as any)[cat] += w
            dailyMap[dayIdx].total += w
          }
        }
      })

      return dailyMap.map((item) => ({
        ...item,
        พลาสติก: Math.round(item.พลาสติก * 100) / 100,
        แก้ว: Math.round(item.แก้ว * 100) / 100,
        กระดาษ: Math.round(item.กระดาษ * 100) / 100,
        อลูมิเนียม: Math.round(item.อลูมิเนียม * 100) / 100,
      }))
    }
  }, [filteredRecords, viewMode, selectedYear, selectedMonth])

  const axisLabelStyle = {
    fontFamily: 'IBM Plex Sans Thai, sans-serif',
    fontSize: 12,
    fontWeight: 600,
    fill: COLORS.green,
  }

  return (
    <div
      style={{
        ...cardStyle,
        padding: '10px 20px 20px',
        flex: 1,
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        ...fontStyle,
      }}
    >
      {/* หัวข้อ + ตัวกรอง */}
      <div className="flex flex-wrap items-center" style={{ gap: 14 }}>
        <h2 style={{ ...cardTitleStyle, minWidth: 0 }}>
          น้ำหนักขยะจำแนกประเภท{viewMode === 'monthly' ? 'รายเดือน' : 'รายวัน'}
        </h2>

        <div className="flex flex-wrap items-center" style={{ gap: 10, marginLeft: 'auto' }}>
          <button type="button" onClick={() => setViewMode('monthly')} style={pillStyle(viewMode === 'monthly')}>
            รายเดือน
          </button>
          <button type="button" onClick={() => setViewMode('daily')} style={pillStyle(viewMode === 'daily')}>
            รายวัน
          </button>

          {viewMode === 'daily' && (
            <SelectPill
              value={String(selectedMonth)}
              options={FULL_MONTH_NAMES.map((m, i) => ({ value: String(i), label: m }))}
              onChange={(v) => setSelectedMonth(Number(v))}
              minWidth={150}
              align="right"
            />
          )}

          <SelectPill
            value={String(selectedYear)}
            options={availableYears.map((y) => ({ value: String(y), label: String(y) }))}
            onChange={(v) => setSelectedYear(Number(v))}
            minWidth={110}
            align="right"
          />
        </div>
      </div>

      {isLoading ? (
        <div
          className="flex items-center justify-center"
          style={{ height: 380, color: COLORS.green, fontWeight: 600, ...fontStyle }}
        >
          กำลังโหลดข้อมูลประวัติขยะ...
        </div>
      ) : (
        <>
          {/* คำอธิบายสี — จัดกึ่งกลางเหนือกราฟ ตามแบบ */}
          <div
            className="flex items-center justify-center"
            style={{ gap: 20, flexWrap: 'wrap', paddingTop: 20, paddingBottom: 8 }}
          >
            {WASTE_TYPES.map((t) => (
              <div key={t} className="flex items-center" style={{ gap: 7 }}>
                <span
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    backgroundColor: WASTE_COLORS[t],
                    flexShrink: 0,
                  }}
                />
                <span style={{ color: COLORS.green, fontSize: 15, fontWeight: 600, ...fontStyle }}>
                  {t}
                </span>
              </div>
            ))}
          </div>

          <ResponsiveContainer width="100%" height={380}>
            {viewMode === 'monthly' ? (
              /* กราฟแท่งแนวนอน สำหรับ รายเดือน */
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 4, right: 20, left: 10, bottom: 26 }}
                barCategoryGap="22%"
              >
                <CartesianGrid stroke={COLORS.grid} strokeWidth={1} />
                <XAxis
                  type="number"
                  tick={axisTickStyle}
                  tickLine={false}
                  axisLine={false}
                  label={{
                    value: 'น้ำหนัก (KG)',
                    position: 'insideBottom',
                    offset: -16,
                    style: axisLabelStyle,
                  }}
                />
                <YAxis
                  type="category"
                  dataKey="month"
                  tick={axisTickStyle}
                  tickLine={false}
                  axisLine={false}
                  width={55}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value: any, name: any) => [
                    `${Number(value || 0).toLocaleString()} KG`,
                    String(name || ''),
                  ]}
                />
                {WASTE_TYPES.map((type) => (
                  <Bar key={type} dataKey={type} stackId="a" fill={WASTE_COLORS[type]} />
                ))}
              </BarChart>
            ) : (
              /* กราฟแท่งแนวตั้ง สำหรับ รายวัน (วันที่ 1 - 31) */
              <BarChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 30 }}>
                <CartesianGrid stroke={COLORS.grid} strokeWidth={1} />
                <XAxis
                  dataKey="dayLabel"
                  tick={axisTickStyle}
                  tickLine={false}
                  axisLine={false}
                  label={{
                    value: `วันที่ (เดือน ${FULL_MONTH_NAMES[selectedMonth]} ${selectedYear})`,
                    position: 'insideBottom',
                    offset: -20,
                    style: axisLabelStyle,
                  }}
                />
                <YAxis
                  type="number"
                  tick={axisTickStyle}
                  tickLine={false}
                  axisLine={false}
                  width={55}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value: any, name: any) => [
                    `${Number(value || 0).toLocaleString()} KG`,
                    String(name || ''),
                  ]}
                  labelFormatter={(label) =>
                    `วันที่ ${label} ${FULL_MONTH_NAMES[selectedMonth]} ${selectedYear}`
                  }
                />
                {WASTE_TYPES.map((type) => (
                  <Bar key={type} dataKey={type} stackId="a" fill={WASTE_COLORS[type]} />
                ))}
              </BarChart>
            )}
          </ResponsiveContainer>
        </>
      )}
    </div>
  )
}
