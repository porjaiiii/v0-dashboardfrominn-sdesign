'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Sidebar from '@/components/dashboard/Sidebar'
import { useAuth } from '@/lib/auth-context'
import { useLiff } from '@/lib/liff-context'
import { WASTE_CATEGORIES, type MainCategory } from '@/lib/waste-types-data'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer,
} from 'recharts'

const font = { fontFamily: 'var(--font-ibm-plex-sans-thai), IBM Plex Sans Thai, sans-serif' }
const TAMBON_LIST_DATA = ['บางกะเจ้า', 'บางยอ', 'บางกอบัว', 'บางกระสอบ', 'บางน้ำผึ้ง', 'ทรงคนอง']
const MONTH_NAMES = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']

// Interface ตรงตามของคุณ + แปะ subdistrict ที่มาจาก API route
interface WasteRecord {
  timestamp: string
  user_id: string
  waste_type: string        // เช่น 'plastic', 'paper', 'glass', 'other'
  waste_subtype: string     // เช่น 'pet', 'hdpe'
  weight_kg: number
  image_urls: string[]
  carbon_reduction: number
  points_earned: number
  status: string
  subdistrict?: string      // ได้มาจากการ Lookup ฝั่ง Server
}

// Icon Component
function CategoryIcon({ cat, size = 20 }: { cat: MainCategory; size?: number }) {
  const stroke = WASTE_CATEGORIES.find(c => c.id === cat)?.color ?? '#333'
  if (cat === 'plastic') return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18" />
    </svg>
  )
  if (cat === 'paper') return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14,2 14,8 20,8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10,9 9,9 8,9" />
    </svg>
  )
  if (cat === 'glass') return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 2l-1 7H3l4 6v7h10v-7l4-6h-4L16 2H8z" />
    </svg>
  )
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M8 12h8M12 8v8" />
    </svg>
  )
}

export default function WasteTypesPage() {
  const router = useRouter()
  const { emailUser } = useAuth()
  const { isLiffReady, isLoggedIn: liffLoggedIn, profile: liffProfile, liffLogout } = useLiff()

  const [tambon, setTambon] = useState('บางกะเจ้า')
  const [activeCat, setActiveCat] = useState<MainCategory>('plastic')
  const [year] = useState(2569)
  const [profileOpen, setProfileOpen] = useState(false)

  // State เก็บข้อมูลจริง
  const [rawRecords, setRawRecords] = useState<WasteRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const isAuthenticated = !!emailUser || liffLoggedIn

  useEffect(() => {
    if (isLiffReady && !isAuthenticated) router.push('/login')
  }, [isLiffReady, isAuthenticated, router])

  // 1. ดึงโปรไฟล์ผู้ใช้ปัจจุบันเพื่อเลือกตำบลเริ่มต้นให้อัตโนมัติ
  useEffect(() => {
    async function fetchUserProfile() {
      if (!liffProfile?.userId) return
      try {
        const res = await fetch(`/api/user/${liffProfile.userId}`)
        if (res.ok) {
          const data = await res.json()
          if (data.subdistrict && TAMBON_LIST_DATA.includes(data.subdistrict)) {
            setTambon(data.subdistrict)
          }
        }
      } catch (err) {
        console.error('Error fetching user profile:', err)
      }
    }
    if (liffLoggedIn && liffProfile?.userId) {
      fetchUserProfile()
    }
  }, [liffLoggedIn, liffProfile])

  // 2. ดึงข้อมูลขยะจาก API Route
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
    if (isAuthenticated) {
      fetchWasteRecords()
    }
  }, [isAuthenticated, fetchWasteRecords])

  const activeCatInfo = useMemo(() => {
    return WASTE_CATEGORIES.find(c => c.id === activeCat)!
  }, [activeCat])

  // 3. รวมน้ำหนักขยะตาม ตำบล + waste_type + waste_subtype + รายเดือน
  const { totals, monthlyMap } = useMemo(() => {
    const subtypeTotals: Record<string, number> = {}
    activeCatInfo.subtypes.forEach(s => { subtypeTotals[s.id] = 0 })

    const monthlyDataMap: Record<number, Record<string, number>> = {}
    for (let m = 0; m < 12; m++) {
      monthlyDataMap[m] = {}
      activeCatInfo.subtypes.forEach(s => { monthlyDataMap[m][s.id] = 0 })
    }

    rawRecords.forEach(rec => {
      const weight = Number(rec.weight_kg || 0)
      
      // กรองเฉพาะตำบลและหมวดหมู่ที่เลือก
      if (rec.subdistrict === tambon && rec.waste_type === activeCat && rec.waste_subtype) {
        // ยอดรวมตามชนิดย่อย
        if (subtypeTotals[rec.waste_subtype] !== undefined) {
          subtypeTotals[rec.waste_subtype] += weight
        }

        // ยอดรวมรายเดือนจาก timestamp
        if (rec.timestamp) {
          const recDate = new Date(rec.timestamp)
          if (!isNaN(recDate.getTime())) {
            const monthIdx = recDate.getMonth()
            if (monthlyDataMap[monthIdx]?.[rec.waste_subtype] !== undefined) {
              monthlyDataMap[monthIdx][rec.waste_subtype] += weight
            }
          }
        }
      }
    })

    return { totals: subtypeTotals, monthlyMap: monthlyDataMap }
  }, [rawRecords, tambon, activeCat, activeCatInfo])

  // ฟอร์แมตข้อมูลส่งเข้า BarChart
  const chartData = useMemo(() => {
    return MONTH_NAMES.map((mName, idx) => {
      const row: Record<string, string | number> = { month: mName }
      activeCatInfo.subtypes.forEach(sub => {
        row[sub.id] = monthlyMap[idx]?.[sub.id] || 0
      })
      return row
    })
  }, [monthlyMap, activeCatInfo])

  // รวมยอดน้ำหนักตามหมวดหมู่ใหญ่สำหรับการ์ดสรุปปุ่มด้านล่าง
  const categoryGrandTotals = useMemo(() => {
    const catTotals: Record<string, number> = { plastic: 0, paper: 0, glass: 0, other: 0 }
    rawRecords.forEach(rec => {
      const weight = Number(rec.weight_kg || 0)
      if (rec.subdistrict === tambon && rec.waste_type && catTotals[rec.waste_type] !== undefined) {
        catTotals[rec.waste_type] += weight
      }
    })
    return catTotals
  }, [rawRecords, tambon])

  const grandTotal = Object.values(totals).reduce((a, b) => a + b, 0)

  if (!isAuthenticated) return null

  const displayName = liffLoggedIn ? liffProfile?.displayName ?? '' : emailUser?.name ?? ''
  const avatarUrl = liffLoggedIn ? liffProfile?.pictureUrl : null

  const handleLogout = () => {
    if (liffLoggedIn) liffLogout()
    router.push('/login')
  }

  return (
    <div className="flex" style={{ minHeight: '100vh', backgroundColor: '#f8faf8' }}>
      <Sidebar activePage="waste-types" />

      <div className="flex flex-col" style={{ flex: 1, minWidth: 0 }}>
        {/* Top header */}
        <div
          className="flex items-center justify-between"
          style={{ height: 70, backgroundColor: '#ffffff', borderBottom: '1px solid rgba(0,0,0,0.15)', padding: '0 28px', flexShrink: 0 }}
        >
          <Image src="/figma/tabler-icon-menu-2.svg" alt="menu" width={28} height={28} />
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center"
              style={{ gap: 10, background: 'none', border: 'none', cursor: 'pointer', padding: '6px 10px', borderRadius: 8 }}
            >
              {avatarUrl ? (
                <Image src={avatarUrl} alt="profile" width={34} height={34} style={{ borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                <div style={{
                  width: 34, height: 34, borderRadius: '50%', backgroundColor: '#154212',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontSize: 14, fontWeight: 700, ...font, flexShrink: 0,
                }}>
                  {displayName ? (
                    displayName.charAt(0)
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="8" r="4" />
                      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                    </svg>
                  )}
                </div>
              )}
              <span style={{ color: '#154212', fontSize: 14, fontWeight: 600, ...font, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {displayName}
              </span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#154212" strokeWidth="2.5"><path d="M6 9l6 6 6-6" /></svg>
            </button>
            {profileOpen && (
              <div style={{
                position: 'absolute', top: '110%', right: 0, backgroundColor: '#fff',
                border: '1.5px solid #e5e7eb', borderRadius: 10,
                boxShadow: '0 4px 16px rgba(0,0,0,0.10)', minWidth: 180, zIndex: 50, overflow: 'hidden',
              }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid #f3f4f6' }}>
                  <p style={{ color: '#154212', fontSize: 14, fontWeight: 700, margin: 0, ...font, textAlign: 'center' }}>{displayName}</p>
                  {emailUser && <p style={{ color: '#9ca3af', fontSize: 12, margin: '2px 0 0', ...font, textAlign: 'center' }}>{emailUser.email}</p>}
                </div>
                <button onClick={handleLogout} style={{
                  display: 'block', width: '100%', padding: '10px 16px', textAlign: 'left',
                  background: 'none', border: 'none', cursor: 'pointer', color: '#c06060', fontSize: 14, fontWeight: 600, ...font,
                }}>ออกจากระบบ</button>
              </div>
            )}
          </div>
        </div>

        {/* Page content */}
        <main style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Title row */}
          <div className="flex items-center justify-between" style={{ flexWrap: 'wrap', gap: 12 }}>
            <div className="flex items-center" style={{ gap: 12 }}>
              <h1 style={{ color: '#154212', fontSize: 28, fontWeight: 700, margin: 0, ...font }}>
                ปริมาณขยะแยกตามประเภท
              </h1>
              {isLoading && (
                <span style={{ fontSize: 13, color: '#6b7280', ...font }}>กำลังโหลดข้อมูลขยะ...</span>
              )}
            </div>

            {/* Tambon selector pills */}
            <div className="flex" style={{ gap: 8, flexWrap: 'wrap' }}>
              {TAMBON_LIST_DATA.map(t => (
                <button
                  key={t}
                  onClick={() => setTambon(t)}
                  style={{
                    padding: '6px 16px', borderRadius: 20, fontSize: 13, fontWeight: tambon === t ? 700 : 400,
                    border: `1.5px solid ${tambon === t ? '#154212' : '#c8d8c4'}`,
                    backgroundColor: tambon === t ? '#154212' : '#ffffff',
                    color: tambon === t ? '#ffffff' : '#154212',
                    cursor: 'pointer', transition: 'all 0.15s', ...font,
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Category tab row */}
          <div className="flex" style={{ gap: 12, flexWrap: 'wrap' }}>
            {WASTE_CATEGORIES.map(cat => {
              const isActive = activeCat === cat.id
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCat(cat.id as MainCategory)}
                  className="flex items-center"
                  style={{
                    gap: 8, padding: '10px 20px', borderRadius: 10, cursor: 'pointer',
                    border: `2px solid ${isActive ? cat.color : cat.borderColor}`,
                    backgroundColor: isActive ? cat.color : cat.bgColor,
                    color: isActive ? '#ffffff' : cat.color,
                    fontWeight: isActive ? 700 : 500, fontSize: 14, ...font,
                    transition: 'all 0.15s',
                  }}
                >
                  <CategoryIcon cat={cat.id as MainCategory} size={18} />
                  {cat.label}
                </button>
              )
            })}
          </div>

          {/* Sub-type insight cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
            {activeCatInfo.subtypes.map(sub => {
              const kg = totals[sub.id] ?? 0
              const pct = grandTotal > 0 ? Math.round((kg / grandTotal) * 100) : 0
              return (
                <div
                  key={sub.id}
                  style={{
                    backgroundColor: '#ffffff',
                    border: `2px solid ${activeCatInfo.borderColor}`,
                    borderRadius: 14,
                    padding: '18px 20px',
                    display: 'flex', flexDirection: 'column', gap: 10,
                  }}
                >
                  <div className="flex items-center" style={{ gap: 8 }}>
                    <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: sub.color, flexShrink: 0 }} />
                    <div>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#154212', lineHeight: '18px', ...font }}>{sub.name}</p>
                      <p style={{ margin: 0, fontSize: 11, color: '#888', ...font }}>{sub.description}</p>
                    </div>
                  </div>

                  <div>
                    <span style={{ fontSize: 28, fontWeight: 700, color: activeCatInfo.color, ...font }}>{kg.toLocaleString()}</span>
                    <span style={{ fontSize: 13, color: '#666', marginLeft: 4, ...font }}>KG</span>
                  </div>

                  <div>
                    <div style={{ height: 6, backgroundColor: '#f0f0f0', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, backgroundColor: sub.color, borderRadius: 3, transition: 'width 0.4s ease' }} />
                    </div>
                    <p style={{ margin: '4px 0 0', fontSize: 11, color: '#888', ...font }}>{pct}% ของรวมทั้งประเภท</p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Monthly horizontal bar chart */}
          <div
            style={{
              backgroundColor: '#ffffff',
              border: '1.5px solid rgba(0,0,0,0.10)',
              borderRadius: 14,
              padding: '24px 28px',
            }}
          >
            <div className="flex items-center" style={{ gap: 12, marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#154212', ...font }}>
                รายงานน้ำหนักขยะจำแนกประเภทรายเดือน (ตำบล{tambon})
              </h2>
              <span style={{
                padding: '4px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600,
                border: '1.5px solid #c8d8c4', color: '#154212', ...font,
              }}>
                {year}
              </span>
            </div>

            <ResponsiveContainer width="100%" height={380}>
              <BarChart
                layout="vertical"
                data={chartData}
                margin={{ top: 0, right: 30, left: 20, bottom: 10 }}
                barSize={18}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e8e8e8" />
                <XAxis
                  type="number"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: '#888', fontFamily: font.fontFamily }}
                  label={{ value: 'น้ำหนัก (KG)', position: 'insideBottom', offset: -4, fontSize: 12, fill: '#666', fontFamily: font.fontFamily }}
                />
                <YAxis
                  type="category"
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: '#666', fontFamily: font.fontFamily }}
                  width={60}
                />
                <Tooltip
                  formatter={(v, name) => [`${v} KG`, name]}
                  contentStyle={{ borderRadius: 8, fontSize: 13, fontFamily: font.fontFamily }}
                />
                <Legend
                  iconType="circle"
                  iconSize={10}
                  wrapperStyle={{ fontSize: 13, fontFamily: font.fontFamily, paddingTop: 12 }}
                />
                {activeCatInfo.subtypes.map((sub, index) => (
                  <Bar
                    key={sub.id}
                    dataKey={sub.id}
                    name={sub.name}
                    stackId="a"
                    fill={sub.color}
                    radius={index === activeCatInfo.subtypes.length - 1 ? [0, 3, 3, 0] : [0, 0, 0, 0]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Summary totals row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
            {WASTE_CATEGORIES.map(cat => {
              const total = categoryGrandTotals[cat.id] || 0
              const isActive = activeCat === cat.id
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCat(cat.id as MainCategory)}
                  style={{
                    backgroundColor: isActive ? cat.color : '#ffffff',
                    border: `2px solid ${isActive ? cat.color : cat.borderColor}`,
                    borderRadius: 14, padding: '18px 20px', cursor: 'pointer',
                    textAlign: 'left', transition: 'all 0.15s',
                  }}
                >
                  <div className="flex items-center" style={{ gap: 8, marginBottom: 8 }}>
                    <CategoryIcon cat={cat.id as MainCategory} size={20} />
                    <span style={{ fontSize: 14, fontWeight: 600, color: isActive ? '#ffffff' : cat.color, ...font }}>{cat.label}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: 26, fontWeight: 700, color: isActive ? '#ffffff' : cat.color, ...font }}>
                    {total.toLocaleString()}
                  </p>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: isActive ? 'rgba(255,255,255,0.8)' : '#888', ...font }}>กิโลกรัม รวมปี {year}</p>
                </button>
              )
            })}
          </div>
        </main>
      </div>
    </div>
  )
}