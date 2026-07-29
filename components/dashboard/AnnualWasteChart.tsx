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
import Image from 'next/image'

interface WasteRecord {
  id: string
  date: string
  wasteType: string
  weight: number
}

const fontStyle = {
  fontFamily: 'var(--font-ibm-plex-sans-thai), IBM Plex Sans Thai, sans-serif',
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

export default function AnnualWasteChart() {
  const [records, setRecords] = useState<WasteRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedYear, setSelectedYear] = useState('แสดงทุกปี')
  const [open, setOpen] = useState(false)

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
    const sortedYears = Array.from(yearsSet).sort((a, b) => Number(a) - Number(b))
    return ['แสดงทุกปี', ...sortedYears]
  }, [records])

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

  return (
    <div
      style={{
        border: '2px solid rgba(0,0,0,0.2)',
        borderRadius: 10,
        padding: '10px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      {/* Header row */}
      <div className="flex items-center" style={{ gap: 10 }}>
        <span
          style={{
            color: '#154212',
            fontSize: 24,
            fontWeight: 600,
            lineHeight: '39.6px',
            flex: 1,
            ...fontStyle,
          }}
        >
          {selectedYear === 'แสดงทุกปี' ? 'ปริมาณขยะประจำปี' : `ปริมาณขยะประจำปี ${selectedYear}`}
        </span>

        {/* Dropdown button */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setOpen(!open)}
            className="flex items-center"
            style={{
              gap: 10,
              padding: '5px 20px',
              border: '2px solid #154212',
              borderRadius: 10,
              backgroundColor: '#ffffff',
              cursor: 'pointer',
              ...fontStyle,
              fontSize: 16,
              fontWeight: 600,
              color: '#154212',
            }}
          >
            <span>{selectedYear}</span>
            <Image src="/figma/tabler-icon-chevron-down.svg" alt="chevron" width={24} height={24} />
          </button>
          {open && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                backgroundColor: '#ffffff',
                border: '2px solid #154212',
                borderRadius: 10,
                zIndex: 10,
                maxHeight: 200,
                overflowY: 'auto',
              }}
            >
              {yearOptions.map((y) => (
                <button
                  key={y}
                  onClick={() => {
                    setSelectedYear(y)
                    setOpen(false)
                  }}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '6px 20px',
                    textAlign: 'left',
                    backgroundColor: selectedYear === y ? '#154212' : '#ffffff',
                    color: selectedYear === y ? '#ffffff' : '#154212',
                    border: 'none',
                    cursor: 'pointer',
                    ...fontStyle,
                    fontSize: 16,
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

      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-[#154212] font-semibold" style={fontStyle}>
          กำลังโหลดข้อมูลกราฟ...
        </div>
      ) : (
        <>
          {/* Chart 1: Total waste line */}
          <div style={{ paddingTop: 20, paddingBottom: 20 }}>
            {/* Legend */}
            <div className="flex items-center" style={{ gap: 6, marginBottom: 8 }}>
              <div style={{ width: 11, height: 11, borderRadius: '50%', backgroundColor: '#154212' }} />
              <span style={{ color: '#154212', fontSize: 14.88, fontWeight: 600, ...fontStyle }}>
                ขยะทั้งหมด (kg)
              </span>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="" stroke="rgba(0,0,0,0.35)" strokeWidth={0.88} vertical={true} horizontal={true} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: '#154212', fontSize: 12.3, fontWeight: 600, fontFamily: 'IBM Plex Sans Thai, sans-serif' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={formatYAxis}
                  tick={{ fill: '#154212', fontSize: 12.3, fontWeight: 600, fontFamily: 'IBM Plex Sans Thai, sans-serif' }}
                  axisLine={false}
                  tickLine={false}
                  domain={[0, 'auto']}
                  width={60}
                />
                <Tooltip
                  formatter={(value: number) => [`${value.toLocaleString()} kg`, 'ขยะทั้งหมด']}
                  contentStyle={{ fontFamily: 'IBM Plex Sans Thai, sans-serif' }}
                />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="#154212"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Chart 2: By type */}
          <div style={{ paddingTop: 20, paddingBottom: 20 }}>
            {/* Legend */}
            <div className="flex items-center" style={{ gap: 12, marginBottom: 8 }}>
              {[
                { label: 'พลาสติก', color: '#6fc060' },
                { label: 'แก้ว', color: '#89b9ea' },
                { label: 'กระดาษ', color: '#c06060' },
                { label: 'อลูมิเนียม', color: '#d7ce56' },
              ].map(({ label, color }) => (
                <div key={label} className="flex items-center" style={{ gap: 6 }}>
                  <div style={{ width: 11, height: 11, borderRadius: '50%', backgroundColor: color }} />
                  <span style={{ color: '#154212', fontSize: 14.88, fontWeight: 600, ...fontStyle }}>
                    {label}
                  </span>
                </div>
              ))}
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="" stroke="rgba(0,0,0,0.35)" strokeWidth={0.88} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: '#154212', fontSize: 12.3, fontWeight: 600, fontFamily: 'IBM Plex Sans Thai, sans-serif' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={formatYAxis}
                  tick={{ fill: '#154212', fontSize: 12.3, fontWeight: 600, fontFamily: 'IBM Plex Sans Thai, sans-serif' }}
                  axisLine={false}
                  tickLine={false}
                  domain={[0, 'auto']}
                  width={60}
                />
                <Tooltip
                  formatter={(value: number, name: string) => {
                    const labels: Record<string, string> = {
                      plastic: 'พลาสติก',
                      glass: 'แก้ว',
                      paper: 'กระดาษ',
                      aluminium: 'อลูมิเนียม',
                    }
                    return [`${value.toLocaleString()} kg`, labels[name] || name]
                  }}
                  contentStyle={{ fontFamily: 'IBM Plex Sans Thai, sans-serif' }}
                />
                <Line type="monotone" dataKey="plastic" stroke="#6fc060" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                <Line type="monotone" dataKey="glass" stroke="#89b9ea" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                <Line type="monotone" dataKey="paper" stroke="#c06060" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                <Line type="monotone" dataKey="aluminium" stroke="#d7ce56" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  )
  
}