'use client'

import { useState, useEffect, useMemo } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import Image from 'next/image'

const fontStyle = {
  fontFamily: 'var(--font-ibm-plex-sans-thai), IBM Plex Sans Thai, sans-serif',
}

const subdistricts = [
  'ทุกตำบล',
  'บางกะเจ้า',
  'บางยอ',
  'บางกอบัว',
  'บางกระสอบ',
  'บางน้ำผึ้ง',
  'ทรงคนอง',
]

interface WasteRecord {
  id: string
  subdistrict: string
  wasteType: string
  weight: number
}

interface WasteTypeChartProps {
  selected: string
  onSelect: (district: string) => void
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

export default function WasteTypeChart({ selected, onSelect }: WasteTypeChartProps) {
  const [open, setOpen] = useState(false)
  const [records, setRecords] = useState<WasteRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)

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
        console.error('[WasteTypeChart] Fetch error:', err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchChartData()
  }, [])

  // 2. ประมวลผลรวมน้ำหนักขยะแยกตามตำบลที่เลือก
  const { chartData, legendData } = useMemo(() => {
    const categoryTotals: Record<string, number> = {
      พลาสติก: 0,
      แก้ว: 0,
      กระดาษ: 0,
      อลูมิเนียม: 0,
    }

    records.forEach((r) => {
      const sub = (r.subdistrict || '').trim()
      
      // เช็คว่าตำบลตรงกับที่เลือกหรือไม่ (หรือเลือก 'ทุกตำบล' / 'ทั้งหมด')
      const isMatch =
        !selected ||
        selected === 'ทุกตำบล' ||
        selected === 'ทั้งหมด' ||
        sub.includes(selected) ||
        selected.includes(sub)

      if (isMatch) {
        const cat = matchCategory(r.wasteType)
        const w = r.weight || 0
        if (cat in categoryTotals) {
          categoryTotals[cat] += w
        }
      }
    })

    const colors: Record<string, string> = {
      พลาสติก: '#6fc060',
      แก้ว: '#89b9ea',
      กระดาษ: '#c06060',
      อลูมิเนียม: '#d7ce56',
    }

    const legendList = [
      { name: 'พลาสติก', value: Math.round(categoryTotals['พลาสติก'] * 100) / 100, color: colors['พลาสติก'] },
      { name: 'แก้ว', value: Math.round(categoryTotals['แก้ว'] * 100) / 100, color: colors['แก้ว'] },
      { name: 'กระดาษ', value: Math.round(categoryTotals['กระดาษ'] * 100) / 100, color: colors['กระดาษ'] },
      { name: 'อลูมิเนียม', value: Math.round(categoryTotals['อลูมิเนียม'] * 100) / 100, color: colors['อลูมิเนียม'] },
    ]

    // กรองเฉพาะหมวดที่มีค่าน้ำหนักมากกว่า 0 ไปวาดกราฟวงกลม
    const activeChartData = legendList.filter((item) => item.value > 0)

    return {
      chartData: activeChartData,
      legendData: legendList,
    }
  }, [records, selected])

  // แสดงผลปุ่ม Dropdown
  const displaySelected = selected === 'ทุกตำบล' || selected === 'ทั้งหมด' || !selected
    ? 'ทุกตำบล'
    : selected.startsWith('ตำบล') ? selected : 'ตำบล ' + selected

  return (
    <div
      style={{
        border: '2px solid rgba(0,0,0,0.2)',
        borderRadius: 10,
        padding: '10px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
        flex: 1,
      }}
    >
      {/* Header */}
      <div style={{ height: 40, display: 'flex', alignItems: 'center' }}>
        <span
          style={{
            color: '#154212',
            fontSize: 24,
            fontWeight: 600,
            lineHeight: '39.6px',
            ...fontStyle,
          }}
        >
          ปริมาณขยะแยกประเภท (KG)
        </span>
      </div>

      {/* Dropdown */}
      <div style={{ position: 'relative', alignSelf: 'center' }}>
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center"
          style={{
            gap: 10,
            padding: '5px 20px',
            border: '2px solid #154212',
            borderRadius: 10,
            backgroundColor: 'rgba(255,255,255,0.25)',
            backdropFilter: 'blur(40px)',
            cursor: 'pointer',
            ...fontStyle,
            fontSize: 16,
            fontWeight: 600,
            color: '#154212',
          }}
        >
          <span>{displaySelected}</span>
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
              overflow: 'hidden',
              minWidth: 180,
            }}
          >
            {subdistricts.map((s) => {
              const label = s === 'ทุกตำบล' ? s : 'ตำบล ' + s
              const isSelected = selected === s || (s === 'ทุกตำบล' && selected === 'ทั้งหมด')
              return (
                <button
                  key={s}
                  onClick={() => {
                    onSelect(s)
                    setOpen(false)
                  }}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '6px 20px',
                    textAlign: 'left',
                    backgroundColor: isSelected ? '#154212' : '#ffffff',
                    color: isSelected ? '#ffffff' : '#154212',
                    border: 'none',
                    cursor: 'pointer',
                    ...fontStyle,
                    fontSize: 16,
                    fontWeight: 600,
                  }}
                >
                  {label}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Content Section */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-[#154212] font-semibold" style={fontStyle}>
          กำลังโหลดข้อมูลขยะประจำตำบล...
        </div>
      ) : (
        <div className="flex items-center justify-center" style={{ gap: 20, flex: 1, minHeight: 250 }}>
          {/* Donut chart */}
          <div style={{ width: 250, height: 250, position: 'relative', flexShrink: 0 }}>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={120}
                    dataKey="value"
                    startAngle={90}
                    endAngle={-270}
                    strokeWidth={0}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any, name: any) => [
                      `${Number(value || 0).toLocaleString()} KG`,
                      String(name || ''),
                    ]}
                    contentStyle={{ fontFamily: 'IBM Plex Sans Thai, sans-serif' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-sm text-gray-500 font-semibold text-center" style={fontStyle}>
                ไม่มีข้อมูลขยะ
                <br />
                ในตำบลนี้
              </div>
            )}
          </div>

          {/* Legend */}
          <div className="flex flex-col" style={{ gap: 15, minWidth: 180 }}>
            {legendData.map(({ name, value, color }) => (
              <div key={name} className="flex items-center" style={{ gap: 8 }}>
                <div
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: '50%',
                    backgroundColor: color,
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    color: '#154212',
                    fontSize: 17.8,
                    fontWeight: 600,
                    ...fontStyle,
                    flex: 1,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {name}
                </span>
                <span
                  style={{
                    color: '#154212',
                    fontSize: 17.8,
                    fontWeight: 600,
                    ...fontStyle,
                    minWidth: 70,
                    textAlign: 'right',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {value.toLocaleString()} KG
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}