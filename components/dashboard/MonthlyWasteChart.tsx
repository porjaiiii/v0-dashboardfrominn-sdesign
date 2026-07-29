'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import Image from 'next/image'

const fontStyle = {
  fontFamily: 'var(--font-ibm-plex-sans-thai), IBM Plex Sans Thai, sans-serif',
}

const WASTE_COLORS: Record<string, string> = {
  พลาสติก: '#6fc060',
  แก้ว: '#89b9ea',
  กระดาษ: '#c06060',
  อลูมิเนียม: '#d7ce56',
}

const WASTE_TYPES = ['พลาสติก', 'แก้ว', 'กระดาษ', 'อลูมิเนียม'] as const

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

  // สถานะ Dropdown Open/Close
  const [yearOpen, setYearOpen] = useState(false)
  const [monthOpen, setMonthOpen] = useState(false)

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
  const chartData = useMemo(() => {
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

  return (
    <div
      style={{
        border: '2px solid rgba(0,0,0,0.12)',
        borderRadius: 12,
        padding: '20px 24px',
        backgroundColor: '#ffffff',
        ...fontStyle,
      }}
    >
      {/* Header controls */}
      <div className="flex flex-wrap items-center justify-between" style={{ gap: 12, marginBottom: 20 }}>
        <h2
          style={{
            color: '#154212',
            fontSize: 20,
            fontWeight: 700,
            margin: 0,
            ...fontStyle,
          }}
        >
          รายงานน้ำหนักขยะจำแนกประเภท ({viewMode === 'monthly' ? 'รายเดือน' : 'รายวัน'})
        </h2>

        {/* Filter Toolbar */}
        <div className="flex flex-wrap items-center" style={{ gap: 10 }}>
          {/* Mode Toggle Switch */}
          <div
            style={{
              display: 'flex',
              backgroundColor: '#f0f4f0',
              borderRadius: 8,
              padding: 2,
              border: '1px solid #154212',
            }}
          >
            <button
              onClick={() => setViewMode('monthly')}
              style={{
                padding: '4px 12px',
                borderRadius: 6,
                border: 'none',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 600,
                backgroundColor: viewMode === 'monthly' ? '#154212' : 'transparent',
                color: viewMode === 'monthly' ? '#ffffff' : '#154212',
                ...fontStyle,
              }}
            >
              รายเดือน
            </button>
            <button
              onClick={() => setViewMode('daily')}
              style={{
                padding: '4px 12px',
                borderRadius: 6,
                border: 'none',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 600,
                backgroundColor: viewMode === 'daily' ? '#154212' : 'transparent',
                color: viewMode === 'daily' ? '#ffffff' : '#154212',
                ...fontStyle,
              }}
            >
              รายวัน
            </button>
          </div>

          {/* Month Dropdown (แสดงเฉพาะเมื่ออยู่ในโหมด 'รายวัน') */}
          {viewMode === 'daily' && (
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => {
                  setMonthOpen(!monthOpen)
                  setYearOpen(false)
                }}
                className="flex items-center"
                style={{
                  gap: 6,
                  padding: '5px 12px',
                  border: '2px solid #154212',
                  borderRadius: 8,
                  backgroundColor: '#ffffff',
                  cursor: 'pointer',
                  ...fontStyle,
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#154212',
                }}
              >
                <span>{FULL_MONTH_NAMES[selectedMonth]}</span>
                <Image src="/figma/tabler-icon-chevron-down.svg" alt="chevron" width={16} height={16} />
              </button>
              {monthOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: '110%',
                    right: 0,
                    backgroundColor: '#ffffff',
                    border: '2px solid #154212',
                    borderRadius: 8,
                    zIndex: 30,
                    maxHeight: 220,
                    overflowY: 'auto',
                    minWidth: 130,
                  }}
                >
                  {FULL_MONTH_NAMES.map((mName, mIdx) => (
                    <button
                      key={mName}
                      onClick={() => {
                        setSelectedMonth(mIdx)
                        setMonthOpen(false)
                      }}
                      style={{
                        display: 'block',
                        width: '100%',
                        padding: '6px 14px',
                        textAlign: 'left',
                        backgroundColor: selectedMonth === mIdx ? '#154212' : '#ffffff',
                        color: selectedMonth === mIdx ? '#ffffff' : '#154212',
                        border: 'none',
                        cursor: 'pointer',
                        ...fontStyle,
                        fontSize: 14,
                        fontWeight: 600,
                      }}
                    >
                      {mName}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Year Dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => {
                setYearOpen(!yearOpen)
                setMonthOpen(false)
              }}
              className="flex items-center"
              style={{
                gap: 6,
                padding: '5px 12px',
                border: '2px solid #154212',
                borderRadius: 8,
                backgroundColor: '#ffffff',
                cursor: 'pointer',
                ...fontStyle,
                fontSize: 14,
                fontWeight: 600,
                color: '#154212',
              }}
            >
              <span>{selectedYear}</span>
              <Image src="/figma/tabler-icon-chevron-down.svg" alt="chevron" width={16} height={16} />
            </button>
            {yearOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '110%',
                  right: 0,
                  backgroundColor: '#ffffff',
                  border: '2px solid #154212',
                  borderRadius: 8,
                  zIndex: 30,
                  overflow: 'hidden',
                  minWidth: 90,
                }}
              >
                {availableYears.map((y) => (
                  <button
                    key={y}
                    onClick={() => {
                      setSelectedYear(y)
                      setYearOpen(false)
                    }}
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: '6px 14px',
                      textAlign: 'left',
                      backgroundColor: selectedYear === y ? '#154212' : '#ffffff',
                      color: selectedYear === y ? '#ffffff' : '#154212',
                      border: 'none',
                      cursor: 'pointer',
                      ...fontStyle,
                      fontSize: 14,
                      fontWeight: 600,
                    }}
                  >
                    {y}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Body content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-[#154212] font-semibold" style={fontStyle}>
          กำลังโหลดข้อมูลประวัติขยะ...
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={340}>
          {viewMode === 'monthly' ? (
            /* กราฟแท่งแนวนอน ( layout="vertical" ) สำหรับ รายเดือน */
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 4, right: 20, left: 10, bottom: 4 }}
              barCategoryGap="20%"
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(0,0,0,0.08)" />
              <XAxis
                type="number"
                tick={{ fontFamily: 'IBM Plex Sans Thai, sans-serif', fontSize: 12, fill: '#444' }}
                tickLine={false}
                axisLine={{ stroke: 'rgba(0,0,0,0.15)' }}
                label={{
                  value: 'น้ำหนัก (KG)',
                  position: 'insideBottom',
                  offset: -2,
                  style: { fontFamily: 'IBM Plex Sans Thai, sans-serif', fontSize: 12, fill: '#666' },
                }}
              />
              <YAxis
                type="category"
                dataKey="month"
                tick={{ fontFamily: 'IBM Plex Sans Thai, sans-serif', fontSize: 12, fill: '#444' }}
                tickLine={false}
                axisLine={false}
                width={50}
              />
              <Tooltip
                contentStyle={{ fontFamily: 'IBM Plex Sans Thai, sans-serif', fontSize: 13, borderRadius: 8 }}
                formatter={(value: any, name: any) => [
                  `${Number(value || 0).toLocaleString()} KG`,
                  String(name || ''),
                ]}
              />
              <Legend
                wrapperStyle={{ fontFamily: 'IBM Plex Sans Thai, sans-serif', fontSize: 13, paddingTop: 8 }}
              />
              {WASTE_TYPES.map((type) => (
                <Bar
                  key={type}
                  dataKey={type}
                  stackId="a"
                  fill={WASTE_COLORS[type]}
                  radius={type === 'อลูมิเนียม' ? [0, 4, 4, 0] : [0, 0, 0, 0]}
                />
              ))}
            </BarChart>
          ) : (
            /* กราฟแท่งแนวตั้ง สำหรับ รายวัน (วันที่ 1 - 31) */
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 20, left: 10, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.08)" />
              <XAxis
                dataKey="dayLabel"
                tick={{ fontFamily: 'IBM Plex Sans Thai, sans-serif', fontSize: 11, fill: '#444' }}
                tickLine={false}
                axisLine={{ stroke: 'rgba(0,0,0,0.15)' }}
                label={{
                  value: `วันที่ (เดือน ${FULL_MONTH_NAMES[selectedMonth]} ${selectedYear})`,
                  position: 'insideBottom',
                  offset: -12,
                  style: { fontFamily: 'IBM Plex Sans Thai, sans-serif', fontSize: 12, fill: '#666' },
                }}
              />
              <YAxis
                type="number"
                tick={{ fontFamily: 'IBM Plex Sans Thai, sans-serif', fontSize: 12, fill: '#444' }}
                tickLine={false}
                axisLine={false}
                width={50}
              />
              <Tooltip
                contentStyle={{ fontFamily: 'IBM Plex Sans Thai, sans-serif', fontSize: 13, borderRadius: 8 }}
                formatter={(value: any, name: any) => [
                  `${Number(value || 0).toLocaleString()} KG`,
                  String(name || ''),
                ]}
                labelFormatter={(label) =>
                  `วันที่ ${label} ${FULL_MONTH_NAMES[selectedMonth]} ${selectedYear}`
                }
              />
              <Legend
                wrapperStyle={{ fontFamily: 'IBM Plex Sans Thai, sans-serif', fontSize: 13, paddingTop: 8 }}
              />
              {WASTE_TYPES.map((type) => (
                <Bar
                  key={type}
                  dataKey={type}
                  stackId="a"
                  fill={WASTE_COLORS[type]}
                  radius={type === 'อลูมิเนียม' ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                />
              ))}
            </BarChart>
          )}
        </ResponsiveContainer>
      )}
    </div>
  )
}