'use client'

import { useState, useEffect, useMemo } from 'react'
import Image from 'next/image'

interface WasteRecord {
  id: string
  date: string
  subdistrict?: string
  subDistrict?: string
  tambon?: string
  wasteType: string
  weight: number
  carbonReduce?: number
}

interface StatCardsProps {
  selectedDistrict?: string // 🟢 1. รับ Prop ตำบลเข้ามา
}

interface StatCardProps {
  label: string
  value: string
  unit: string
  bgColor: string
  icon: string
  iconAlt: string
  isLoading?: boolean
}

function StatCard({ label, value, unit, bgColor, icon, iconAlt, isLoading }: StatCardProps) {
  return (
    <div
      className="flex items-center justify-center overflow-hidden"
      style={{
        backgroundColor: bgColor,
        borderRadius: 10,
        padding: 10,
        gap: 15,
        boxShadow: '0 0 15px rgba(0,0,0,0.25)',
        flex: 1,
        minHeight: 113,
      }}
    >
      <div className="flex flex-col items-center" style={{ gap: 15, flex: 1, minWidth: 0 }}>
        <span
          className="text-center"
          style={{
            color: '#ffffff',
            fontSize: 16,
            fontWeight: 600,
            lineHeight: '19px',
            fontFamily: 'var(--font-ibm-plex-sans-thai), IBM Plex Sans Thai, sans-serif',
            whiteSpace: 'nowrap',
          }}
        >
          {label}
        </span>
        <span
          style={{
            color: '#ffffff',
            fontSize: 36,
            fontWeight: 600,
            lineHeight: '59.4px',
            fontFamily: 'var(--font-ibm-plex-sans-thai), IBM Plex Sans Thai, sans-serif',
          }}
        >
          {isLoading ? '...' : value}
        </span>
        <span
          style={{
            color: '#ffffff',
            fontSize: 16,
            fontWeight: 600,
            lineHeight: '19px',
            fontFamily: 'var(--font-ibm-plex-sans-thai), IBM Plex Sans Thai, sans-serif',
          }}
        >
          {unit}
        </span>
      </div>
      <Image src={icon} alt={iconAlt} width={96} height={96} style={{ flexShrink: 0 }} />
    </div>
  )
}

function SmallStatCard({ label, value, unit, bgColor, icon, iconAlt, isLoading }: StatCardProps) {
  return (
    <div
      className="flex items-center justify-center overflow-hidden"
      style={{
        backgroundColor: bgColor,
        borderRadius: 10,
        padding: 10,
        gap: 15,
        boxShadow: '0 0 15px rgba(0,0,0,0.25)',
        flex: 1,
        minHeight: 113,
      }}
    >
      <div className="flex flex-col items-center" style={{ gap: 15, flex: 1, minWidth: 0 }}>
        <span
          className="text-center"
          style={{
            color: '#ffffff',
            fontSize: 14,
            fontWeight: 600,
            lineHeight: '19px',
            fontFamily: 'var(--font-ibm-plex-sans-thai), IBM Plex Sans Thai, sans-serif',
          }}
        >
          {label}
        </span>
        <span
          style={{
            color: '#ffffff',
            fontSize: 32,
            fontWeight: 600,
            lineHeight: '52px',
            fontFamily: 'var(--font-ibm-plex-sans-thai), IBM Plex Sans Thai, sans-serif',
          }}
        >
          {isLoading ? '...' : value}
        </span>
        <span
          style={{
            color: '#ffffff',
            fontSize: 14,
            fontWeight: 600,
            lineHeight: '19px',
            fontFamily: 'var(--font-ibm-plex-sans-thai), IBM Plex Sans Thai, sans-serif',
          }}
        >
          {unit}
        </span>
      </div>
      <Image src={icon} alt={iconAlt} width={80} height={80} style={{ flexShrink: 0 }} />
    </div>
  )
}

// จำแนกประเภทขยะให้ตรงหมวด
function matchCategory(typeStr: string): 'plastic' | 'glass' | 'paper' | 'aluminium' | 'other' {
  const t = (typeStr || '').toLowerCase()
  if (t.includes('plastic') || t.includes('พลาสติก')) return 'plastic'
  if (t.includes('glass') || t.includes('แก้ว')) return 'glass'
  if (t.includes('paper') || t.includes('กระดาษ')) return 'paper'
  if (t.includes('alumi') || t.includes('อลูมิเนียม') || t.includes('กระป๋อง') || t.includes('โลหะ')) return 'aluminium'
  return 'other'
}

export default function StatCards({ selectedDistrict }: StatCardsProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [rawRecords, setRawRecords] = useState<WasteRecord[]>([])

  // ดึงข้อมูลดิบทั้งหมดจาก API ครั้งเดียว
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true)
        const res = await fetch('/api/waste/dashboard')
        if (!res.ok) throw new Error('Fetch failed')
        
        const result = await res.json()
        setRawRecords(result.records || [])
      } catch (error) {
        console.error('[StatCards] Fetch error:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  // 🟢 2. คำนวณสรุปผลตาม `selectedDistrict` ที่เลือกแบบ Dynamic ทันที
  const stats = useMemo(() => {
    // กรองขยะเฉพาะตำบลที่เลือก (ถ้าเลือก "ทั้งหมด" หรือไม่ระบุ ให้ใช้ทุกรายการ)
    const filtered = rawRecords.filter((r) => {
      if (!selectedDistrict || selectedDistrict === 'ทุกตำบล' || selectedDistrict === 'ทั้งหมด') return true
      const sub = (r.subdistrict || r.subDistrict || r.tambon || '').trim()
      if (!sub) return false

    // 3. ทำความสะอาดข้อความ (ตัดคำว่า "ตำบล" ออกเพื่อเปรียบเทียบชื่อเพียวๆ)
    const cleanSub = sub.replace(/^ตำบล/, '').trim()
    const cleanTarget = selectedDistrict.replace(/^ตำบล/, '').trim()

    // 4. เปรียบเทียบชื่อ
    return cleanSub.includes(cleanTarget) || cleanTarget.includes(cleanSub)
    })

    let totalWeight = 0
    let totalCarbon = 0
    let plasticWeight = 0
    let glassWeight = 0
    let paperWeight = 0
    let aluminiumWeight = 0

    filtered.forEach((r) => {
      const w = Number(r.weight || 0)
      const c = Number(r.carbonReduce || w * 0.8) // ค่าประมาณการลด CO2 ถ้าไม่มีจาก DB
      const cat = matchCategory(r.wasteType)

      totalWeight += w
      totalCarbon += c

      if (cat === 'plastic') plasticWeight += w
      if (cat === 'glass') glassWeight += w
      if (cat === 'paper') paperWeight += w
      if (cat === 'aluminium') aluminiumWeight += w
    })

    return {
      totalWeight,
      totalCarbon,
      plasticWeight,
      glassWeight,
      paperWeight,
      aluminiumWeight,
    }
  }, [rawRecords, selectedDistrict])

  const formatNum = (num: number) => {
    return num.toLocaleString('th-TH', { maximumFractionDigits: 1 })
  }

  return (
    <div className="flex flex-col" style={{ gap: 20 }}>
      {/* Top row: 2 large dark green cards */}
      <div className="flex" style={{ gap: 20 }}>
        <StatCard
          label={`น้ำหนักขยะที่รวบรวมได้ (${selectedDistrict || 'ภาพรวม'})`}
          value={formatNum(stats.totalWeight)}
          unit="กิโลกรัม"
          bgColor="#154212"
          icon="/figma/tabler-icon-recycle-1.svg"
          iconAlt="recycle"
          isLoading={isLoading}
        />
        <StatCard
          label="จำนวนการลดการปล่อย CO2 ทั้งหมด"
          value={formatNum(stats.totalCarbon)}
          unit="kgCO2"
          bgColor="#154212"
          icon="/figma/tabler-icon-brand-onedrive.svg"
          iconAlt="co2"
          isLoading={isLoading}
        />
      </div>

      {/* Bottom row: 4 colored cards */}
      <div className="flex" style={{ gap: 20 }}>
        <SmallStatCard
          label="น้ำหนักขยะประเภทพลาสติก"
          value={formatNum(stats.plasticWeight)}
          unit="กิโลกรัม"
          bgColor="#6fc060"
          icon="/figma/tabler-icon-recycle-2.svg"
          iconAlt="plastic"
          isLoading={isLoading}
        />
        <SmallStatCard
          label="น้ำหนักขยะประเภทแก้ว"
          value={formatNum(stats.glassWeight)}
          unit="กิโลกรัม"
          bgColor="#89b9ea"
          icon="/figma/tabler-icon-recycle-3.svg"
          iconAlt="glass"
          isLoading={isLoading}
        />
        <SmallStatCard
          label="น้ำหนักขยะประเภทกระดาษ"
          value={formatNum(stats.paperWeight)}
          unit="กิโลกรัม"
          bgColor="#c06060"
          icon="/figma/tabler-icon-recycle-4.svg"
          iconAlt="paper"
          isLoading={isLoading}
        />
        <SmallStatCard
          label="น้ำหนักขยะประเภทอลูมิเนียม"
          value={formatNum(stats.aluminiumWeight)}
          unit="กิโลกรัม"
          bgColor="#d7ce56"
          icon="/figma/tabler-icon-brand-onedrive-1.svg"
          iconAlt="aluminium"
          isLoading={isLoading}
        />
      </div>
    </div>
  )
}