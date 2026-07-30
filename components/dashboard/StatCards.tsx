'use client'

import { useState, useEffect, useMemo } from 'react'
import Image from 'next/image'
import { COLORS, fontStyle } from '@/lib/design-tokens'

interface WasteRecord {
  id: string
  date: string
  subdistrict?: string
  subDistrict?: string
  tambon?: string
  wasteType: string
  weight: number
  carbon: number
}

interface StatCardsProps {
  selectedDistrict?: string // 🟢 1. รับ Prop ตำบลเข้ามา
}

interface StatCardProps {
  label: string
  value: string
  unit: string
  bgColor: string
  /** ลายน้ำจาง ๆ กลางการ์ด (ไฟล์ svg เป็นเส้นขาว opacity 0.1 อยู่แล้ว) */
  watermark: string
  watermarkSize: number
  isLoading?: boolean
}

/**
 * การ์ดสถิติตามแบบ: สูง 113px มุมมน 10 เงานุ่ม
 * เนื้อหาจัดกึ่งกลางทั้งแนวตั้ง/แนวนอน (หัวข้อ 16 / ตัวเลข 36 / หน่วย 16)
 * และมีไอคอนลายน้ำสีขาว 10% วางกลางการ์ดอยู่ด้านหลังตัวอักษร
 */
function StatCard({
  label,
  value,
  unit,
  bgColor,
  watermark,
  watermarkSize,
  isLoading,
}: StatCardProps) {
  return (
    <div
      style={{
        position: 'relative',
        flex: 1,
        minWidth: 0,
        height: 113,
        padding: 10,
        borderRadius: 10,
        backgroundColor: bgColor,
        boxShadow: '0 0 15px rgba(0,0,0,0.25)',
        overflow: 'hidden',
      }}
    >
      <Image
        src={watermark}
        alt=""
        aria-hidden
        width={watermarkSize}
        height={watermarkSize}
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
        }}
      />

      <div
        className="flex flex-col items-center justify-center"
        style={{ position: 'relative', height: '100%', gap: 5 }}
      >
        <span
          style={{
            color: COLORS.white,
            fontSize: 16,
            fontWeight: 600,
            lineHeight: '19px',
            textAlign: 'center',
            whiteSpace: 'nowrap',
            maxWidth: '100%',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            ...fontStyle,
          }}
        >
          {label}
        </span>
        <span
          style={{
            color: COLORS.white,
            fontSize: 36,
            fontWeight: 600,
            lineHeight: '45px',
            ...fontStyle,
          }}
        >
          {isLoading ? '...' : value}
        </span>
        <span
          style={{
            color: COLORS.white,
            fontSize: 16,
            fontWeight: 600,
            lineHeight: '19px',
            ...fontStyle,
          }}
        >
          {unit}
        </span>
      </div>
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

const RECYCLE_WATERMARK = '/figma/tabler-icon-recycle-2.svg'
const CO2_WATERMARK = '/figma/tabler-icon-brand-onedrive-1.svg'

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
      const c = Number(r.carbon || 0)
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

  const isAllTambon =
    !selectedDistrict || selectedDistrict === 'ทุกตำบล' || selectedDistrict === 'ทั้งหมด'

  return (
    <div className="flex flex-col" style={{ gap: 20 }}>
      {/* แถวบน: การ์ดเขียวเข้ม 2 ใบ */}
      <div className="flex" style={{ gap: 20 }}>
        <StatCard
          label={
            isAllTambon
              ? 'น้ำหนักขยะที่รวบรวมได้ทั้งหมด'
              : `น้ำหนักขยะที่รวบรวมได้ (${selectedDistrict})`
          }
          value={formatNum(stats.totalWeight)}
          unit="กิโลกรัม"
          bgColor={COLORS.green}
          watermark={RECYCLE_WATERMARK}
          watermarkSize={98}
          isLoading={isLoading}
        />
        <StatCard
          label="จำนวนการลดการปล่อย Co2 ทั้งหมด"
          value={formatNum(stats.totalCarbon)}
          unit="kgCO2"
          bgColor={COLORS.green}
          watermark={CO2_WATERMARK}
          watermarkSize={105}
          isLoading={isLoading}
        />
      </div>

      {/* แถวล่าง: การ์ดสีประจำประเภท 4 ใบ */}
      <div className="flex" style={{ gap: 20 }}>
        <StatCard
          label="น้ำหนักขยะประเภทพลาสติก"
          value={formatNum(stats.plasticWeight)}
          unit="กิโลกรัม"
          bgColor={COLORS.plastic}
          watermark={RECYCLE_WATERMARK}
          watermarkSize={98}
          isLoading={isLoading}
        />
        <StatCard
          label="น้ำหนักขยะประเภทแก้ว"
          value={formatNum(stats.glassWeight)}
          unit="กิโลกรัม"
          bgColor={COLORS.glass}
          watermark={RECYCLE_WATERMARK}
          watermarkSize={98}
          isLoading={isLoading}
        />
        <StatCard
          label="น้ำหนักขยะประเภทกระดาษ"
          value={formatNum(stats.paperWeight)}
          unit="กิโลกรัม"
          bgColor={COLORS.paper}
          watermark={RECYCLE_WATERMARK}
          watermarkSize={98}
          isLoading={isLoading}
        />
        <StatCard
          label="น้ำหนักขยะประเภทอลูมิเนียม"
          value={formatNum(stats.aluminiumWeight)}
          unit="กิโลกรัม"
          bgColor={COLORS.aluminium}
          watermark={RECYCLE_WATERMARK}
          watermarkSize={98}
          isLoading={isLoading}
        />
      </div>
    </div>
  )
}
