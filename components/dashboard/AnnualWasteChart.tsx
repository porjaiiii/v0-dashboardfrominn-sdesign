'use client'

import { useState } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import Image from 'next/image'

const yearlyData = [
  { year: '2564', total: 0, plastic: 0, glass: 0, paper: 0, aluminium: 0 },
  { year: '2565', total: 80000, plastic: 10000, glass: 60000, paper: 2000, aluminium: 8000 },
  { year: '2566', total: 170000, plastic: 25000, glass: 130000, paper: 5000, aluminium: 15000 },
  { year: '2567', total: 260000, plastic: 50000, glass: 190000, paper: 10000, aluminium: 25000 },
  { year: '2568', total: 360000, plastic: 130000, glass: 310000, paper: 40000, aluminium: 90000 },
  { year: '2569', total: 456480, plastic: 420000, glass: 420000, paper: 380000, aluminium: 410000 },
]

const fontStyle = {
  fontFamily: 'var(--font-ibm-plex-sans-thai), IBM Plex Sans Thai, sans-serif',
}

function formatYAxis(value: number) {
  if (value === 0) return '0'
  return value.toLocaleString()
}

export default function AnnualWasteChart() {
  const [selectedYear, setSelectedYear] = useState('แสดงทุกปี')
  const [open, setOpen] = useState(false)

  const yearOptions = ['แสดงทุกปี', '2564', '2565', '2566', '2567', '2568', '2569']

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
          ปริมาณขยะประจำปี
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
                overflow: 'hidden',
              }}
            >
              {yearOptions.map((y) => (
                <button
                  key={y}
                  onClick={() => { setSelectedYear(y); setOpen(false) }}
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

      {/* Chart 1: Total waste line */}
      <div style={{ paddingTop: 20, paddingBottom: 20 }}>
        {/* Legend */}
        <div className="flex items-center" style={{ gap: 6, marginBottom: 8 }}>
          <div style={{ width: 11, height: 11, borderRadius: '50%', backgroundColor: '#154212' }} />
          <span style={{ color: '#154212', fontSize: 14.88, fontWeight: 600, ...fontStyle }}>
            ขยะทั้งหมด
          </span>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={yearlyData} margin={{ top: 10, right: 10, left: 50, bottom: 0 }}>
            <CartesianGrid strokeDasharray="" stroke="rgba(0,0,0,0.35)" strokeWidth={0.88} vertical={true} horizontal={true} />
            <XAxis
              dataKey="year"
              tick={{ fill: '#154212', fontSize: 12.3, fontWeight: 600, fontFamily: 'IBM Plex Sans Thai, sans-serif' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={formatYAxis}
              tick={{ fill: '#154212', fontSize: 12.3, fontWeight: 600, fontFamily: 'IBM Plex Sans Thai, sans-serif' }}
              axisLine={false}
              tickLine={false}
              domain={[0, 500000]}
              ticks={[0, 100000, 200000, 300000, 400000, 500000]}
              width={55}
            />
            <Tooltip
              formatter={(value: number) => [value.toLocaleString(), 'ขยะทั้งหมด']}
              contentStyle={{ fontFamily: 'IBM Plex Sans Thai, sans-serif' }}
            />
            <Line
              type="monotone"
              dataKey="total"
              stroke="#154212"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Chart 2: By type */}
      <div style={{ paddingTop: 20, paddingBottom: 20 }}>
        {/* Legend */}
        <div className="flex items-center" style={{ gap: 12 }}>
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
          <LineChart data={yearlyData} margin={{ top: 10, right: 10, left: 50, bottom: 0 }}>
            <CartesianGrid strokeDasharray="" stroke="rgba(0,0,0,0.35)" strokeWidth={0.88} />
            <XAxis
              dataKey="year"
              tick={{ fill: '#154212', fontSize: 12.3, fontWeight: 600, fontFamily: 'IBM Plex Sans Thai, sans-serif' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={formatYAxis}
              tick={{ fill: '#154212', fontSize: 12.3, fontWeight: 600, fontFamily: 'IBM Plex Sans Thai, sans-serif' }}
              axisLine={false}
              tickLine={false}
              domain={[0, 500000]}
              ticks={[0, 100000, 200000, 300000, 400000, 500000]}
              width={55}
            />
            <Tooltip
              formatter={(value: number, name: string) => {
                const labels: Record<string, string> = {
                  plastic: 'พลาสติก',
                  glass: 'แก้ว',
                  paper: 'กระดาษ',
                  aluminium: 'อลูมิเนียม',
                }
                return [value.toLocaleString(), labels[name] || name]
              }}
              contentStyle={{ fontFamily: 'IBM Plex Sans Thai, sans-serif' }}
            />
            <Line type="monotone" dataKey="plastic" stroke="#6fc060" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
            <Line type="monotone" dataKey="glass" stroke="#89b9ea" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
            <Line type="monotone" dataKey="paper" stroke="#c06060" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
            <Line type="monotone" dataKey="aluminium" stroke="#d7ce56" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
