'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

interface WasteTypeSummary {
  type: string
  weight: number
  carbon: number
  percentage: number
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

interface SmallStatCardProps {
  label: string
  value: string
  unit: string
  bgColor: string
  icon: string
  iconAlt: string
  isLoading?: boolean
}

function SmallStatCard({ label, value, unit, bgColor, icon, iconAlt, isLoading }: SmallStatCardProps) {
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

export default function StatCards() {
  const [isLoading, setIsLoading] = useState(true)
  const [data, setData] = useState<{
    totalWeight: number
    totalCarbon: number
    plasticWeight: number
    glassWeight: number
    paperWeight: number
    aluminiumWeight: number
  }>({
    totalWeight: 0,
    totalCarbon: 0,
    plasticWeight: 0,
    glassWeight: 0,
    paperWeight: 0,
    aluminiumWeight: 0,
  })

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true)
        const res = await fetch('/api/waste/dashboard')
        if (!res.ok) throw new Error('Failed to fetch waste dashboard stats')
        
        const result = await res.json()
        const summary = result.summary || { totalWeight: 0, totalCarbon: 0 }
        const breakdown: WasteTypeSummary[] = result.typeBreakdown || []

        // ฟังก์ชั่นช่วยดึงน้ำหนักตามประเภทขยะ
        const getWeight = (keywords: string[]) => {
          const matched = breakdown.find(item =>
            keywords.some(kw => item.type.toLowerCase().includes(kw.toLowerCase()))
          )
          return matched ? matched.weight : 0
        }

        setData({
          totalWeight: summary.totalWeight || 0,
          totalCarbon: summary.totalCarbon || 0,
          plasticWeight: getWeight(['พลาสติก', 'plastic']),
          glassWeight: getWeight(['แก้ว', 'glass']),
          paperWeight: getWeight(['กระดาษ', 'paper']),
          aluminiumWeight: getWeight(['อลูมิเนียม', 'โลหะ', 'กระป๋อง', 'aluminium', 'aluminum', 'can']),
        })
      } catch (error) {
        console.error('[StatCards] Fetch error:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  // ฟังก์ชั่นฟอร์แมตตัวเลขให้ใส่คอมม่า (เช่น 1,234.5 หรือ 456,480)
  const formatNum = (num: number) => {
    return num.toLocaleString('th-TH', { maximumFractionDigits: 1 })
  }

  return (
    <div className="flex flex-col" style={{ gap: 20 }}>
      {/* Top row: 2 large dark green cards */}
      <div className="flex" style={{ gap: 20 }}>
        <StatCard
          label="น้ำหนักขยะที่รวบรวมได้ทั้งหมด"
          value={formatNum(data.totalWeight)}
          unit="กิโลกรัม"
          bgColor="#154212"
          icon="/figma/tabler-icon-recycle-1.svg"
          iconAlt="recycle"
          isLoading={isLoading}
        />
        <StatCard
          label="จำนวนการลดการปล่อย CO ทั้งหมด"
          value={formatNum(data.totalCarbon)}
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
          value={formatNum(data.plasticWeight)}
          unit="กิโลกรัม"
          bgColor="#6fc060"
          icon="/figma/tabler-icon-recycle-2.svg"
          iconAlt="plastic"
          isLoading={isLoading}
        />
        <SmallStatCard
          label="น้ำหนักขยะประเภทแก้ว"
          value={formatNum(data.glassWeight)}
          unit="กิโลกรัม"
          bgColor="#89b9ea"
          icon="/figma/tabler-icon-recycle-3.svg"
          iconAlt="glass"
          isLoading={isLoading}
        />
        <SmallStatCard
          label="น้ำหนักขยะประเภทกระดาษ"
          value={formatNum(data.paperWeight)}
          unit="กิโลกรัม"
          bgColor="#c06060"
          icon="/figma/tabler-icon-recycle-4.svg"
          iconAlt="paper"
          isLoading={isLoading}
        />
        <SmallStatCard
          label="น้ำหนักขยะประเภทอลูมิเนียม"
          value={formatNum(data.aluminiumWeight)}
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