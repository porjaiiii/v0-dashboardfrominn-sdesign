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

// กำหนด Font Style มาตรฐานเพื่อใช้งานซ้ำได้ง่าย
const fontStyle = {
  fontFamily: 'var(--font-ibm-plex-sans-thai), IBM Plex Sans Thai, sans-serif',
}

const TAMBON_LIST_DATA = ['บางกะเจ้า', 'บางยอ', 'บางกอบัว', 'บางกระสอบ', 'บางน้ำผึ้ง', 'ทรงคนอง']
const MONTH_NAMES = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']

interface WasteRecord {
  timestamp: string
  user_id: string
  waste_type: string
  waste_subtype: string
  weight_kg: number
  image_urls: string[]
  carbon_reduction: number
  points_earned: number
  status: string
  subdistrict?: string
}

function CategoryIcon({ cat, size = 20 }: { cat: MainCategory; size?: number }) {
  const stroke = WASTE_CATEGORIES.find(c => c.id === cat)?.color ?? '#154212'
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

  const [rawRecords, setRawRecords] = useState<WasteRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const isAuthenticated = !!emailUser || liffLoggedIn

  useEffect(() => {
    if (isLiffReady && !isAuthenticated) router.push('/login')
  }, [isLiffReady, isAuthenticated, router])

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
      const recSub = (rec.subdistrict || '').trim().replace(/^ตำบล/, '')
      const currentTambon = tambon.trim().replace(/^ตำบล/, '')
      
      if ((recSub === currentTambon || recSub.includes(currentTambon)) && rec.waste_type === activeCat && rec.waste_subtype) {
        if (subtypeTotals[rec.waste_subtype] !== undefined) {
          subtypeTotals[rec.waste_subtype] += weight
        }

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

  const chartData = useMemo(() => {
    return MONTH_NAMES.map((mName, idx) => {
      const row: Record<string, string | number> = { month: mName }
      activeCatInfo.subtypes.forEach(sub => {
        row[sub.id] = monthlyMap[idx]?.[sub.id] || 0
      })
      return row
    })
  }, [monthlyMap, activeCatInfo])

  const categoryGrandTotals = useMemo(() => {
    const catTotals: Record<string, number> = { plastic: 0, paper: 0, glass: 0, other: 0 }
    rawRecords.forEach(rec => {
      const weight = Number(rec.weight_kg || 0)
      const recSub = (rec.subdistrict || '').trim().replace(/^ตำบล/, '')
      const currentTambon = tambon.trim().replace(/^ตำบล/, '')

      if ((recSub === currentTambon || recSub.includes(currentTambon)) && rec.waste_type && catTotals[rec.waste_type] !== undefined) {
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
    <div className="flex" style={{ minHeight: '100vh', backgroundColor: '#f8faf8', ...fontStyle }}>
      <Sidebar activePage="waste-types" />

      <div className="flex flex-col" style={{ flex: 1, minWidth: 0 }}>
        {/* Header */}
        <div
          className="flex items-center justify-between"
          style={{
            height: 70,
            backgroundColor: '#ffffff',
            borderBottom: '1px solid rgba(0,0,0,0.1)',
            padding: '0 32px',
            flexShrink: 0,
          }}
        >
          <Image src="/figma/tabler-icon-menu-2.svg" alt="menu" width={28} height={28} />
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center"
              style={{
                gap: 10,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '6px 12px',
                borderRadius: 10,
              }}
            >
              {avatarUrl ? (
                <Image src={avatarUrl} alt="profile" width={36} height={36} style={{ borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                <div style={{
                  width: 36, height: 36, borderRadius: '50%', backgroundColor: '#154212',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontSize: 15, fontWeight: 600, ...fontStyle, flexShrink: 0,
                }}>
                  {displayName ? displayName.charAt(0) : 'U'}
                </div>
              )}
              <span style={{ color: '#154212', fontSize: 16, fontWeight: 600, ...fontStyle, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {displayName}
              </span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#154212" strokeWidth="2.5"><path d="M6 9l6 6 6-6" /></svg>
            </button>
            {profileOpen && (
              <div style={{
                position: 'absolute', top: '110%', right: 0, backgroundColor: '#fff',
                border: '2px solid #154212', borderRadius: 10,
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)', minWidth: 180, zIndex: 50, overflow: 'hidden',
              }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0' }}>
                  <p style={{ color: '#154212', fontSize: 15, fontWeight: 600, margin: 0, ...fontStyle, textAlign: 'center' }}>{displayName}</p>
                  {emailUser && <p style={{ color: '#666', fontSize: 13, margin: '2px 0 0', ...fontStyle, textAlign: 'center' }}>{emailUser.email}</p>}
                </div>
                <button onClick={handleLogout} style={{
                  display: 'block', width: '100%', padding: '10px 16px', textAlign: 'left',
                  background: 'none', border: 'none', cursor: 'pointer', color: '#c06060', fontSize: 15, fontWeight: 600, ...fontStyle,
                }}>ออกจากระบบ</button>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <main style={{ padding: '28px 36px', display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          {/* Header Title & Tambon Selectors */}
          <div className="flex items-center justify-between" style={{ flexWrap: 'wrap', gap: 16 }}>
            <div className="flex items-center" style={{ gap: 12 }}>
              <h1 style={{ color: '#154212', fontSize: 26, fontWeight: 600, margin: 0, lineHeight: '36px', ...fontStyle }}>
                ปริมาณขยะแยกตามประเภท
              </h1>
              {isLoading && (
                <span style={{ fontSize: 14, color: '#666', fontWeight: 500, ...fontStyle }}>กำลังโหลดข้อมูล...</span>
              )}
            </div>

            {/* Tambon Pills (ปรับดีไซน์ให้เข้ากับ Theme) */}
            <div className="flex" style={{ gap: 8, flexWrap: 'wrap' }}>
              {TAMBON_LIST_DATA.map(t => {
                const isSelected = tambon === t
                return (
                  <button
                    key={t}
                    onClick={() => setTambon(t)}
                    style={{
                      padding: '6px 18px',
                      borderRadius: 10,
                      fontSize: 15,
                      fontWeight: 600,
                      border: '2px solid #154212',
                      backgroundColor: isSelected ? '#154212' : 'rgba(255,255,255,0.6)',
                      color: isSelected ? '#ffffff' : '#154212',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease-in-out',
                      ...fontStyle,
                    }}
                  >
                    ตำบล {t}
                  </button>
                )
              })}
            </div>
          </div>
          {/* Main Category Tabs */}
          <div className="flex" style={{ gap: 12, flexWrap: 'wrap' }}>
            {WASTE_CATEGORIES.map(cat => {
              const isActive = activeCat === cat.id

              // แมปสีประจำหมวดหมู่ขยะให้ตรงกับ StatCard
              const themeColor =
                cat.id === 'plastic' ? '#6fc060' :
                cat.id === 'glass' ? '#89b9ea' :
                cat.id === 'paper' ? '#c06060' : '#d7ce56'

              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCat(cat.id as MainCategory)}
                  className="flex items-center"
                  style={{
                    gap: 10,
                    padding: '10px 22px',
                    borderRadius: 10,
                    cursor: 'pointer',
                    border: `2px solid ${isActive ? themeColor : 'rgba(0,0,0,0.15)'}`,
                    backgroundColor: isActive ? themeColor : '#ffffff',
                    color: isActive ? '#ffffff' : '#154212',
                    fontWeight: 600,
                    fontSize: 16,
                    ...fontStyle,
                    transition: 'all 0.15s ease-in-out',
                    boxShadow: isActive ? '0 4px 12px rgba(0,0,0,0.1)' : 'none',
                  }}
                >
                  <CategoryIcon cat={cat.id as MainCategory} size={20} />
                  {cat.label}
                </button>
              )
            })}
          </div>

          {/* Sub-type Insight Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 16 }}>
            {activeCatInfo.subtypes.map(sub => {
              const kg = totals[sub.id] ?? 0
              const pct = grandTotal > 0 ? Math.round((kg / grandTotal) * 100) : 0

              // ดึงสีหลักตามหมวดหมู่ขยะที่เลือกอยู่
              const currentCatColor =
                activeCat === 'plastic' ? '#6fc060' :
                activeCat === 'glass' ? '#89b9ea' :
                activeCat === 'paper' ? '#c06060' : '#d7ce56'

              return (
                <div
                  key={sub.id}
                  style={{
                    backgroundColor: '#ffffff',
                    border: '2px solid rgba(0,0,0,0.12)',
                    borderRadius: 12,
                    padding: '18px 20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  }}
                >
                  <div className="flex items-center" style={{ gap: 10 }}>
                    <div
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        backgroundColor: sub.color || currentCatColor,
                        flexShrink: 0,
                      }}
                    />
                    <div>
                      <p style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#154212', lineHeight: '22px', ...fontStyle }}>
                        {sub.name}
                      </p>
                      <p style={{ margin: 0, fontSize: 13, color: '#557551', fontWeight: 500, ...fontStyle }}>
                        {sub.description}
                      </p>
                    </div>
                  </div>

                  <div>
                    <span style={{ fontSize: 32, fontWeight: 700, color: '#154212', ...fontStyle }}>
                      {kg.toLocaleString()}
                    </span>
                    <span style={{ fontSize: 15, color: '#557551', fontWeight: 600, marginLeft: 6, ...fontStyle }}>
                      กิโลกรัม
                    </span>
                  </div>

                  <div>
                    <div style={{ height: 8, backgroundColor: '#e8ece8', borderRadius: 4, overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${pct}%`,
                          backgroundColor: sub.color || currentCatColor,
                          borderRadius: 4,
                          transition: 'width 0.4s ease',
                        }}
                      />
                    </div>
                    <p style={{ margin: '6px 0 0', fontSize: 13, color: '#557551', fontWeight: 500, ...fontStyle }}>
                      {pct}% ของรวมทั้งประเภท
                    </p>
                  </div>
                </div>
              )
            })}
          </div>

         

          {/* Bar Chart Container */}
          <div
            style={{
              backgroundColor: '#ffffff',
              border: '2px solid rgba(0,0,0,0.15)',
              borderRadius: 12,
              padding: '24px 28px',
            }}
          >
            <div className="flex items-center" style={{ gap: 12, marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: '#154212', ...fontStyle }}>
                รายงานน้ำหนักขยะจำแนกประเภทรายเดือน (ตำบล {tambon})
              </h2>
              <span style={{
                padding: '4px 14px',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                border: '2px solid #154212',
                color: '#154212',
                backgroundColor: 'rgba(21, 66, 18, 0.05)',
                ...fontStyle,
              }}>
                ปี {year}
              </span>
            </div>

            <ResponsiveContainer width="100%" height={380}>
              <BarChart
                layout="vertical"
                data={chartData}
                margin={{ top: 0, right: 30, left: 10, bottom: 10 }}
                barSize={18}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
                <XAxis
                  type="number"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 13, fill: '#666', fontFamily: fontStyle.fontFamily, fontWeight: 500 }}
                  label={{ value: 'น้ำหนัก (KG)', position: 'insideBottom', offset: -4, fontSize: 13, fill: '#154212', fontFamily: fontStyle.fontFamily, fontWeight: 600 }}
                />
                <YAxis
                  type="category"
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 13, fill: '#154212', fontFamily: fontStyle.fontFamily, fontWeight: 600 }}
                  width={55}
                />
                <Tooltip
                  formatter={(v, name) => [`${Number(v || 0).toLocaleString()} KG`, String(name || '')]}
                  contentStyle={{ borderRadius: 10, fontSize: 14, fontFamily: fontStyle.fontFamily, border: '2px solid #154212' }}
                />
                <Legend
                  iconType="circle"
                  iconSize={10}
                  wrapperStyle={{ fontSize: 14, fontFamily: fontStyle.fontFamily, fontWeight: 600, color: '#154212', paddingTop: 14 }}
                />
                {activeCatInfo.subtypes.map((sub, index) => (
                  <Bar
                    key={sub.id}
                    dataKey={sub.id}
                    name={sub.name}
                    stackId="a"
                    fill={sub.color}
                    radius={index === activeCatInfo.subtypes.length - 1 ? [0, 4, 4, 0] : [0, 0, 0, 0]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>

         

        </main>
      </div>
    </div>
  )
}