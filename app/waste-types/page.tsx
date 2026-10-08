'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import Sidebar from '@/components/dashboard/Sidebar'
import MenuButton from '@/components/dashboard/MenuButton'
import UserAccountMenu from '@/components/dashboard/UserAccountMenu'
import { useSession } from '@/lib/use-session'
import { WASTE_CATEGORIES, type MainCategory } from '@/lib/waste-types-data'
import SelectPill from '@/components/ui/SelectPill'
import {
  COLORS, axisTickStyle, fontStyle, pillStyle, tooltipStyle,
} from '@/lib/design-tokens'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'

const TAMBON_LIST_DATA = ['ทุกตำบล', 'บางกะเจ้า', 'บางยอ', 'บางกอบัว', 'บางกระสอบ', 'บางน้ำผึ้ง', 'ทรงคนอง']
const MONTH_NAMES = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']
const YEAR_OPTIONS = [2567, 2568, 2569, 2570]

// Interface ปรับให้ตรงกับ Response จาก API Submission + Fallback
interface WasteRecord {
  id?: string
  date?: string
  timestamp?: string
  lineUserId?: string
  user_id?: string
  userName?: string
  subdistrict?: string
  isTourist?: boolean
  wasteType?: string
  waste_type?: string
  wasteSubType?: string
  waste_subtype?: string
  weight?: number
  weight_kg?: number
  carbon?: number
  carbon_reduction?: number
  points?: number
  points_earned?: number
}

export default function WasteTypesPage() {
  const { account, logout } = useSession('signed-in')

  const [tambon, setTambon] = useState('ทุกตำบล')
  const [activeCat, setActiveCat] = useState<MainCategory>('plastic')
  const [year, setYear] = useState<number>(2569) // 🟢 State สำหรับเลือกปี

  const [rawRecords, setRawRecords] = useState<WasteRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // ดึงข้อมูลรายการขยะทั้งหมดจาก API ก้อนเดียว
  const fetchWasteRecords = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/waste-dashboard')
      if (res.ok) {
        const data = await res.json()
        setRawRecords(data.records || [])
      }
    } catch (err) {
      console.error('Error fetching waste records:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (account) fetchWasteRecords()
  }, [account, fetchWasteRecords])

  const activeCatInfo = useMemo(() => {
    return WASTE_CATEGORIES.find(c => c.id === activeCat)!
  }, [activeCat])

  // คำนวณยอดรวมจำแนกประเภทย่อย และ ยอดรวมแยกรายเดือน (รองรับการกรองตามปีที่เลือก)
  const { totals, monthlyMap } = useMemo(() => {
    const subtypeTotals: Record<string, number> = {}
    activeCatInfo.subtypes.forEach(s => { subtypeTotals[s.id] = 0 })

    const monthlyDataMap: Record<number, Record<string, number>> = {}
    for (let m = 0; m < 12; m++) {
      monthlyDataMap[m] = {}
      activeCatInfo.subtypes.forEach(s => { monthlyDataMap[m][s.id] = 0 })
    }

    rawRecords.forEach(rec => {
      const weight = Number(rec.weight ?? rec.weight_kg ?? 0)

      // 🟢 1. เช็กปี พ.ศ. ให้ตรงกับปีที่เลือก
      const recDateStr = rec.date || rec.timestamp || ''
      if (recDateStr) {
        const recDate = new Date(recDateStr)
        if (!isNaN(recDate.getTime())) {
          const recYearBE = recDate.getFullYear() + 543 // แปลงเป็น พ.ศ.
          if (recYearBE !== year) return // ถ้าปีไม่ตรง ข้ามรายการนี้ไป
        }
      }

      // 🟢 2. เช็กกรณีเลือก 'ทุกตำบล' หรือ 'ทั้งหมด'
      const isAllTambon = !tambon || tambon === 'ทุกตำบล' || tambon === 'ทั้งหมด'
      let isTambonMatch = false

      if (isAllTambon) {
        isTambonMatch = true
      } else {
        const sub = (rec.subdistrict || '').trim()
        if (sub) {
          const cleanSub = sub.replace(/^ตำบล/, '').trim()
          const cleanTarget = tambon.replace(/^ตำบล/, '').trim()
          isTambonMatch = cleanSub.includes(cleanTarget) || cleanTarget.includes(cleanSub)
        }
      }

      const rawType = (rec.wasteType || rec.waste_type || '').toLowerCase()
      const rawSubType = rec.wasteSubType || rec.waste_subtype || ''

      // ตรวจสอบหมวดหมู่หลัก
      const isCatMatch =
        rawType === activeCat ||
        rawType.includes(activeCatInfo.id) ||
        rawType.includes(activeCatInfo.label.toLowerCase())

      if (isTambonMatch && isCatMatch && rawSubType) {
        const matchedSubtype = activeCatInfo.subtypes.find(s =>
          s.id.toLowerCase() === rawSubType.toLowerCase() ||
          s.name.toLowerCase() === rawSubType.toLowerCase() ||
          rawSubType.toLowerCase().includes(s.id.toLowerCase()) ||
          rawSubType.toLowerCase().includes(s.name.toLowerCase())
        )

        const subKey = matchedSubtype ? matchedSubtype.id : rawSubType

        if (subtypeTotals[subKey] !== undefined) {
          subtypeTotals[subKey] += weight
        }

        if (recDateStr) {
          const recDate = new Date(recDateStr)
          if (!isNaN(recDate.getTime())) {
            const monthIdx = recDate.getMonth()
            if (monthlyDataMap[monthIdx]?.[subKey] !== undefined) {
              monthlyDataMap[monthIdx][subKey] += weight
            }
          }
        }
      }
    })

    return { totals: subtypeTotals, monthlyMap: monthlyDataMap }
  }, [rawRecords, tambon, activeCat, activeCatInfo, year])

  const chartData = useMemo(() => {
    return MONTH_NAMES.map((mName, idx) => {
      const row: Record<string, string | number> = { month: mName }
      activeCatInfo.subtypes.forEach(sub => {
        row[sub.id] = monthlyMap[idx]?.[sub.id] || 0
      })
      return row
    })
  }, [monthlyMap, activeCatInfo])

  const grandTotal = Object.values(totals).reduce((a, b) => a + b, 0)

  if (!account) return null

  return (
    <div className="flex" style={{ minHeight: '100vh', backgroundColor: COLORS.white, ...fontStyle }}>
      <Sidebar activePage="waste-types" />

      <div className="flex flex-col" style={{ flex: 1, minWidth: 0 }}>
        {/* Header */}
        <div
          className="flex items-center justify-between"
          style={{
            height: 70,
            backgroundColor: '#ffffff',
            borderBottom: '1px solid rgba(0,0,0,0.2)',
            padding: '0 20px',
            flexShrink: 0,
          }}
        >
          <MenuButton />
          <UserAccountMenu account={account} onLogout={logout} />
        </div>

        {/* Content */}
        <main style={{ padding: '20px 32px', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* หัวข้อหน้า */}
          <div className="flex items-center" style={{ gap: 12 }}>
            <h1 style={{ color: COLORS.green, fontSize: 24, fontWeight: 600, margin: 0, lineHeight: '36px', ...fontStyle }}>
              ปริมาณขยะแยกตามประเภท
            </h1>
            {isLoading && (
              <span style={{ fontSize: 14, color: COLORS.green, fontWeight: 500, ...fontStyle }}>
                กำลังโหลดข้อมูล...
              </span>
            )}
          </div>

          {/* แถบเลือกตำบล — กว้างคงที่ 102px เว้นระยะ 38px ตามแบบ */}
          <div className="flex" style={{ gap: '12px 38px', flexWrap: 'wrap' }}>
            {TAMBON_LIST_DATA.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTambon(t)}
                style={pillStyle(tambon === t, COLORS.green, { minWidth: 102, paddingX: 12 })}
              >
                {t}
              </button>
            ))}
          </div>

          {/* แถบเลือกประเภทขยะ — สีปุ่มที่เลือกใช้สีประจำประเภท */}
          <div className="flex" style={{ gap: 20, flexWrap: 'wrap' }}>
            {WASTE_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCat(cat.id as MainCategory)}
                style={pillStyle(activeCat === cat.id, cat.color, { minWidth: 130 })}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* การ์ดสรุปประเภทย่อย + การ์ดรวมทั้งหมด */}
          {/* การ์ดยืดเต็มความกว้างของแถว (อย่างน้อยใบละ 222px ตามแบบ) */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(222px, 1fr))',
              gap: 20,
            }}
          >
            {activeCatInfo.subtypes.map((sub) => {
              const kg = totals[sub.id] ?? 0
              const pct = grandTotal > 0 ? Math.round((kg / grandTotal) * 100) : 0

              return (
                <InsightCard
                  key={sub.id}
                  dotColor={sub.color || activeCatInfo.color}
                  title={sub.name}
                  subtitle={sub.description}
                  value={kg}
                  barColor={sub.color || activeCatInfo.color}
                  pct={pct}
                  caption={`${pct}% ของรวมทั้งประเภท`}
                />
              )
            })}

            {/* การ์ดสรุปยอดรวมของทุกประเภทย่อย */}
            <InsightCard
              dark
              dotColor={COLORS.accent}
              title="รวมทั้งหมด"
              subtitle="ยอดรวมทุกประเภทย่อย"
              value={grandTotal}
              barColor={COLORS.accent}
              pct={100}
              caption="100% สรุปภาพรวมประเภท"
            />
          </div>

          {/* หัวข้อกราฟ + dropdown เลือกปี */}
          <div className="flex flex-wrap items-center" style={{ gap: 14, marginTop: 4 }}>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 600, color: COLORS.green, lineHeight: '32px', ...fontStyle }}>
              รายงานน้ำหนักขยะจำแนกประเภทรายเดือน (
              {tambon === 'ทุกตำบล' || tambon === 'ทั้งหมด' ? 'ภาพรวมทุกตำบล' : `ตำบล ${tambon}`})
            </h2>
            <div style={{ marginLeft: 'auto' }}>
              <SelectPill
                value={String(year)}
                options={YEAR_OPTIONS.map((y) => ({ value: String(y), label: String(y) }))}
                onChange={(v) => setYear(Number(v))}
                minWidth={143}
                align="right"
              />
            </div>
          </div>

          {/* กราฟแท่งแนวนอน */}
          <ResponsiveContainer width="100%" height={420}>
            <BarChart
              layout="vertical"
              data={chartData}
              margin={{ top: 0, right: 30, left: 10, bottom: 26 }}
              barCategoryGap="24%"
            >
              <CartesianGrid stroke={COLORS.grid} strokeWidth={1} />
              <XAxis
                type="number"
                tickLine={false}
                axisLine={false}
                tick={axisTickStyle}
                label={{
                  value: 'น้ำหนัก (KG)',
                  position: 'insideBottom',
                  offset: -16,
                  style: {
                    fontFamily: 'IBM Plex Sans Thai, sans-serif',
                    fontSize: 12,
                    fontWeight: 600,
                    fill: COLORS.green,
                  },
                }}
              />
              <YAxis
                type="category"
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tick={axisTickStyle}
                width={55}
              />
              <Tooltip
                formatter={(v, name) => [`${Number(v || 0).toLocaleString()} KG`, String(name || '')]}
                contentStyle={tooltipStyle}
              />
              {activeCatInfo.subtypes.map((sub) => (
                <Bar key={sub.id} dataKey={sub.id} name={sub.name} stackId="a" fill={sub.color} />
              ))}
            </BarChart>
          </ResponsiveContainer>

          {/* คำอธิบายสี — ใต้กราฟ จัดกึ่งกลาง ตามแบบ */}
          <div className="flex items-center justify-center" style={{ gap: 20, flexWrap: 'wrap' }}>
            {activeCatInfo.subtypes.map((sub) => (
              <div key={sub.id} className="flex items-center" style={{ gap: 7 }}>
                <span
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    backgroundColor: sub.color,
                    flexShrink: 0,
                  }}
                />
                <span style={{ color: COLORS.green, fontSize: 15, fontWeight: 600, ...fontStyle }}>
                  {sub.name}
                </span>
              </div>
            ))}
          </div>

          {/* ปุ่มส่งออก */}
          <div className="flex justify-end">
            <button type="button" onClick={() => window.print()} style={pillStyle(false)}>
              ส่งออกเป็น pdf
            </button>
          </div>
        </main>
      </div>
    </div>
  )
}

/** จัดรูปแบบน้ำหนักแบบเดียวกับการ์ดสถิติหน้าแรก — ทศนิยมไม่เกิน 1 ตำแหน่ง */
function formatKg(value: number) {
  return value.toLocaleString('th-TH', { maximumFractionDigits: 1 })
}

interface InsightCardProps {
  dotColor: string
  title: string
  subtitle: string
  value: number
  barColor: string
  pct: number
  caption: string
  dark?: boolean
}

/** การ์ดสรุปตามแบบ: ขอบเทา 1px มุมมน 10 — จุดสี + ชื่อ/คำอธิบาย, ตัวเลข, แถบ progress, คำกำกับ */
function InsightCard({
  dotColor,
  title,
  subtitle,
  value,
  barColor,
  pct,
  caption,
  dark = false,
}: InsightCardProps) {
  const text = dark ? COLORS.white : COLORS.green
  return (
    <div
      style={{
        backgroundColor: dark ? COLORS.green : COLORS.white,
        border: `1px solid ${dark ? COLORS.green : COLORS.border}`,
        borderRadius: 10,
        padding: '15px 28px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        minWidth: 0,
        ...fontStyle,
      }}
    >
      <div className="flex items-center" style={{ gap: 18 }}>
        <span
          style={{
            width: 13,
            height: 13,
            borderRadius: '50%',
            backgroundColor: dotColor,
            flexShrink: 0,
          }}
        />
        <div style={{ minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 16, fontWeight: 600, color: text, lineHeight: '22px', ...fontStyle }}>
            {title}
          </p>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 400, color: text, lineHeight: '17px', ...fontStyle }}>
            {subtitle}
          </p>
        </div>
      </div>

      {/* flexWrap กัน "กิโลกรัม" ล้นออกนอกการ์ดเมื่อตัวเลขยาว */}
      <div className="flex items-baseline" style={{ gap: 8, flexWrap: 'wrap' }}>
        <span
          style={{
            fontSize: 36,
            fontWeight: 600,
            color: text,
            lineHeight: '36px',
            whiteSpace: 'nowrap',
            ...fontStyle,
          }}
        >
          {formatKg(value)}
        </span>
        <span style={{ fontSize: 16, fontWeight: 600, color: text, ...fontStyle }}>กิโลกรัม</span>
      </div>

      <div>
        <div
          style={{
            height: 6,
            backgroundColor: dark ? 'rgba(255,255,255,0.25)' : COLORS.track,
            borderRadius: 3,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${Math.min(100, Math.max(0, pct))}%`,
              backgroundColor: barColor,
              borderRadius: 3,
              transition: 'width 0.4s ease',
            }}
          />
        </div>
        <p style={{ margin: '6px 0 0', fontSize: 12, fontWeight: 400, color: text, ...fontStyle }}>
          {caption}
        </p>
      </div>
    </div>
  )
}
