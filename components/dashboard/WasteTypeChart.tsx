'use client'

import { useState } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import Image from 'next/image'

const fontStyle = {
  fontFamily: 'var(--font-ibm-plex-sans-thai), IBM Plex Sans Thai, sans-serif',
}

const subdistricts = [
  'บางกะเจ้า',
  'บางยอ',
  'บางกอบัว',
  'บางกระสอบ',
  'บางน้ำผึ้ง',
  'ทรงคนอง',
]

const wasteData = [
  { name: 'พลาสติก', value: 30, color: '#6fc060' },
  { name: 'แก้ว', value: 20, color: '#89b9ea' },
  { name: 'กระดาษ', value: 5, color: '#c06060' },
  { name: 'อลูมิเนียม', value: 10, color: '#d7ce56' },
]

const units: Record<string, string> = {
  พลาสติก: '30 KG',
  แก้ว: '20 KG',
  กระดาษ: '5 KG',
  อลูมิเนียม: '10 KG',
}

interface WasteTypeChartProps {
  selected: string
  onSelect: (district: string) => void
}

export default function WasteTypeChart({ selected, onSelect }: WasteTypeChartProps) {
  const [open, setOpen] = useState(false)

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
          <span>{'ตำบล ' + selected}</span>
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
            {subdistricts.map((s) => (
              <button
                key={s}
                onClick={() => { onSelect(s); setOpen(false) }}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '6px 20px',
                  textAlign: 'left',
                  backgroundColor: selected === s ? '#154212' : '#ffffff',
                  color: selected === s ? '#ffffff' : '#154212',
                  border: 'none',
                  cursor: 'pointer',
                  ...fontStyle,
                  fontSize: 16,
                  fontWeight: 600,
                }}
              >
                {'ตำบล ' + s}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Chart + legend */}
      <div
        className="flex items-center justify-center"
        style={{ gap: 20, flex: 1 }}
      >
        {/* Donut chart */}
        <div style={{ width: 250, height: 250, position: 'relative', flexShrink: 0 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={wasteData}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={120}
                dataKey="value"
                startAngle={90}
                endAngle={-270}
                strokeWidth={0}
              >
                {wasteData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number, name: string) => [`${value} KG`, name]}
                contentStyle={{ fontFamily: 'IBM Plex Sans Thai, sans-serif' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex flex-col" style={{ gap: 15, minWidth: 180 }}>
          {wasteData.map(({ name, color }) => (
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
                  minWidth: 60,
                  textAlign: 'right',
                  whiteSpace: 'nowrap',
                }}
              >
                {units[name]}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
