'use client'

import { useState } from 'react'
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
import { getMonthlyData, WASTE_COLORS } from '@/lib/map-data'

const fontStyle = {
  fontFamily: 'var(--font-ibm-plex-sans-thai), IBM Plex Sans Thai, sans-serif',
}

const YEARS = [2569, 2568, 2567]
const WASTE_TYPES = ['พลาสติก', 'แก้ว', 'กระดาษ', 'อลูมิเนียม'] as const

interface MonthlyWasteChartProps {
  tambon: string
}

export default function MonthlyWasteChart({ tambon }: MonthlyWasteChartProps) {
  const [year, setYear] = useState(2569)
  const [yearOpen, setYearOpen] = useState(false)

  const data = getMonthlyData(tambon, year)
    .filter((row) => row.พลาสติก > 0 || row.แก้ว > 0 || row.กระดาษ > 0 || row.อลูมิเนียม > 0)
    .reverse()

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
      {/* Header */}
      <div className="flex items-center" style={{ gap: 16, marginBottom: 20 }}>
        <h2
          style={{
            color: '#154212',
            fontSize: 20,
            fontWeight: 700,
            margin: 0,
            ...fontStyle,
          }}
        >
          รายงานน้ำหนักขยะจำแนกประเภทรายเดือน
        </h2>

        {/* Year dropdown */}
        <div style={{ position: 'relative', marginLeft: 4 }}>
          <button
            onClick={() => setYearOpen(!yearOpen)}
            className="flex items-center"
            style={{
              gap: 8,
              padding: '5px 14px',
              border: '2px solid #154212',
              borderRadius: 8,
              backgroundColor: '#ffffff',
              cursor: 'pointer',
              ...fontStyle,
              fontSize: 15,
              fontWeight: 600,
              color: '#154212',
            }}
          >
            <span>{year}</span>
            <Image src="/figma/tabler-icon-chevron-down.svg" alt="chevron" width={18} height={18} />
          </button>
          {yearOpen && (
            <div
              style={{
                position: 'absolute',
                top: '110%',
                left: 0,
                backgroundColor: '#ffffff',
                border: '2px solid #154212',
                borderRadius: 8,
                zIndex: 20,
                overflow: 'hidden',
                minWidth: 90,
              }}
            >
              {YEARS.map((y) => (
                <button
                  key={y}
                  onClick={() => { setYear(y); setYearOpen(false) }}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '6px 14px',
                    textAlign: 'left',
                    backgroundColor: year === y ? '#154212' : '#ffffff',
                    color: year === y ? '#ffffff' : '#154212',
                    border: 'none',
                    cursor: 'pointer',
                    ...fontStyle,
                    fontSize: 15,
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

      {/* Chart */}
      <ResponsiveContainer width="100%" height={320}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 20, left: 20, bottom: 4 }}
          barCategoryGap="30%"
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
            width={62}
            label={{
              value: 'ปี-เดือน',
              angle: -90,
              position: 'insideLeft',
              offset: 10,
              style: { fontFamily: 'IBM Plex Sans Thai, sans-serif', fontSize: 12, fill: '#666' },
            }}
          />
          <Tooltip
            contentStyle={{ fontFamily: 'IBM Plex Sans Thai, sans-serif', fontSize: 13, borderRadius: 8 }}
            formatter={(value: number, name: string) => [`${value.toLocaleString()} KG`, name]}
          />
          <Legend
            wrapperStyle={{ fontFamily: 'IBM Plex Sans Thai, sans-serif', fontSize: 13, paddingTop: 8 }}
          />
          {WASTE_TYPES.map((type) => (
            <Bar key={type} dataKey={type} stackId="a" fill={WASTE_COLORS[type]} radius={type === 'อลูมิเนียม' ? [0, 4, 4, 0] : [0, 0, 0, 0]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
