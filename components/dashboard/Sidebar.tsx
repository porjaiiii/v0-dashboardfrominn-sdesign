'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { COLORS, fontStyle } from '@/lib/design-tokens'

interface SidebarProps {
  activePage?: 'home' | 'map' | 'waste-types'
}

/** ความสูงของแถวเมนู และช่องไฟระหว่างแถว ตามที่วัดจากแบบ */
const ROW_HEIGHT = 34
const ROW_GAP = 4
/** ระยะขอบซ้าย/ขวาภายในแถวเมนู */
const ROW_PADDING_X = 27

const rowBase = {
  display: 'flex',
  alignItems: 'center',
  width: '100%',
  height: ROW_HEIGHT,
  padding: `0 ${ROW_PADDING_X}px`,
  background: 'none',
  border: 'none',
  textDecoration: 'none',
  cursor: 'pointer',
  color: COLORS.white,
  fontSize: 13,
  lineHeight: '22px',
  ...fontStyle,
} as const

export default function Sidebar({ activePage }: SidebarProps) {
  const [expanded, setExpanded] = useState(true)

  const childStyle = (active: boolean) => ({
    ...rowBase,
    fontWeight: active ? 700 : 400,
    backgroundColor: active ? COLORS.greenDeep : 'transparent',
  })

  return (
    <aside
      className="flex flex-col"
      style={{ width: 258, minHeight: '100vh', backgroundColor: COLORS.green, flexShrink: 0 }}
    >
      {/* หัว sidebar — พื้นเขียวอ่อน มาสคอตชิดขวาล่างและถูกตัดขอบ */}
      <div
        style={{
          position: 'relative',
          height: 70,
          backgroundColor: COLORS.greenHeader,
          flexShrink: 0,
          overflow: 'hidden',
        }}
      >
        <Image
          src="/logo-mascot.png"
          alt="โลโก้"
          width={57}
          height={92}
          priority
          style={{
            position: 'absolute',
            right: 11,
            top: 11,
            width: 57,
            height: 'auto',
          }}
        />
      </div>

      {/* เมนู */}
      <nav className="flex flex-col" style={{ gap: ROW_GAP, paddingTop: 6 }}>
        {/* หัวข้อหลัก — ข้อมูลร่วมอนุรักษ์โลก */}
        <button
          onClick={() => setExpanded(!expanded)}
          style={{
            ...rowBase,
            fontWeight: 600,
            backgroundColor: COLORS.greenDeep,
            gap: 12,
          }}
        >
          <Image src="/figma/tabler-icon-recycle.svg" alt="" aria-hidden width={22} height={22} />
          <span className="flex-1 text-left">ข้อมูลร่วมอนุรักษ์โลก</span>
          <Image
            src="/figma/tabler-icon-chevron-up.svg"
            alt=""
            aria-hidden
            width={20}
            height={20}
            style={{
              transform: expanded ? 'rotate(0deg)' : 'rotate(180deg)',
              transition: 'transform 0.2s',
            }}
          />
        </button>

        {expanded && (
          <>
            <Link href="/" style={childStyle(activePage === 'home')}>
              ปริมาณขยะประจำปี
            </Link>

            <a
              href="#map-section"
              onClick={(e) => {
                e.preventDefault()
                document.getElementById('map-section')?.scrollIntoView({ behavior: 'smooth' })
              }}
              style={childStyle(activePage === 'map')}
            >
              แผนที่ข้อมูลขยะรายตำบล
            </a>

            <Link href="/waste-types" style={childStyle(activePage === 'waste-types')}>
              ปริมาณขยะแยกตามประเภท
            </Link>
          </>
        )}
      </nav>
    </aside>
  )
}
