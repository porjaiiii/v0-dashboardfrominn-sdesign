'use client'

import { useState, useEffect, useMemo } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import SelectPill from '@/components/ui/SelectPill'
import {
  COLORS,
  WASTE_COLORS,
  cardStyle,
  cardTitleStyle,
  fontStyle,
  tooltipStyle,
} from '@/lib/design-tokens'

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

    records.forEach((r: any) => {
      // 🟢 1. เช็กกรณีเลือก 'ทุกตำบล' หรือ 'ทั้งหมด'
      const isAll = !selected || selected === 'ทุกตำบล' || selected === 'ทั้งหมด'

      let isMatch = false

      if (isAll) {
        isMatch = true
      } else {
        // 🟢 2. ดึงชื่อตำบลรองรับทุก Key (`subdistrict`, `subDistrict`, `tambon`)
        const sub = (r.subdistrict || r.subDistrict || r.tambon || '').trim()

        // 🟢 3. ป้องกัน Bug: รายการไม่มีชื่อตำบล ห้ามเอามารวมในตำบลเฉพาะ
        if (sub) {
          const cleanSub = sub.replace(/^ตำบล/, '').trim()
          const cleanTarget = selected.replace(/^ตำบล/, '').trim()
          isMatch = cleanSub.includes(cleanTarget) || cleanTarget.includes(cleanSub)
        }
      }

      if (isMatch) {
        const cat = matchCategory(r.wasteType)
        const w = Number(r.weight) || 0
        if (cat in categoryTotals) {
          categoryTotals[cat] += w
        }
      }
    })

    const legendList = (['พลาสติก', 'แก้ว', 'กระดาษ', 'อลูมิเนียม'] as const).map((name) => ({
      name,
      value: Math.round(categoryTotals[name] * 100) / 100,
      color: WASTE_COLORS[name],
    }))

    // กรองเฉพาะหมวดที่มีค่าน้ำหนักมากกว่า 0 ไปวาดกราฟวงกลม
    return {
      chartData: legendList.filter((item) => item.value > 0),
      legendData: legendList,
    }
  }, [records, selected])

  // ตัวเลือกใน dropdown ตามแบบ: "ทั้งหมด" แล้วตามด้วย "ตำบล …"
  const options = subdistricts.map((s) =>
    s === 'ทุกตำบล' ? { value: s, label: 'ทั้งหมด' } : { value: s, label: `ตำบล ${s}` },
  )
  const currentValue = !selected || selected === 'ทั้งหมด' ? 'ทุกตำบล' : selected

  return (
    <div
      style={{
        ...cardStyle,
        padding: '10px 20px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        flex: 1,
        minWidth: 0,
      }}
    >
      <h3 style={cardTitleStyle}>ปริมาณขยะแยกประเภท (KG)</h3>

      {/* dropdown เลือกตำบล — จัดกึ่งกลางตามแบบ */}
      <div className="flex justify-center" style={{ paddingTop: 10 }}>
        <SelectPill value={currentValue} options={options} onChange={onSelect} minWidth={182} />
      </div>

      {isLoading ? (
        <div
          className="flex items-center justify-center"
          style={{ flex: 1, minHeight: 260, color: COLORS.green, fontWeight: 600, ...fontStyle }}
        >
          กำลังโหลดข้อมูลขยะประจำตำบล...
        </div>
      ) : (
        <div
          className="flex items-center justify-center"
          style={{ gap: 24, flex: 1, minHeight: 260, flexWrap: 'wrap' }}
        >
          {/* กราฟโดนัท */}
          <div style={{ width: 260, height: 260, flexShrink: 0 }}>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={54}
                    outerRadius={126}
                    dataKey="value"
                    startAngle={90}
                    endAngle={-270}
                    stroke={COLORS.white}
                    strokeWidth={4}
                    isAnimationActive={false}
                  >
                    {chartData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any, name: any) => [
                      `${Number(value || 0).toLocaleString()} KG`,
                      String(name || ''),
                    ]}
                    contentStyle={tooltipStyle}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div
                className="flex items-center justify-center text-center"
                style={{ height: '100%', color: COLORS.green, fontWeight: 600, ...fontStyle }}
              >
                ไม่มีข้อมูลขยะ
                <br />
                ในตำบลนี้
              </div>
            )}
          </div>

          {/* คำอธิบายสี + ตัวเลข */}
          <div className="flex flex-col" style={{ gap: 18, width: 207, maxWidth: '100%' }}>
            {legendData.map(({ name, value, color }) => (
              <div key={name} className="flex items-center" style={{ gap: 8 }}>
                <span
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
                    color: COLORS.green,
                    fontSize: 18,
                    fontWeight: 600,
                    flex: 1,
                    whiteSpace: 'nowrap',
                    ...fontStyle,
                  }}
                >
                  {name}
                </span>
                <span
                  style={{
                    color: COLORS.green,
                    fontSize: 18,
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    ...fontStyle,
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
