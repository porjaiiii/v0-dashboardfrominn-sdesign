'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

const fontStyle = {
  fontFamily: 'var(--font-ibm-plex-sans-thai), IBM Plex Sans Thai, sans-serif',
}

interface SidebarProps {
  activePage?: 'home' | 'map' | 'waste-types'
}

export default function Sidebar({ activePage = 'home' }: SidebarProps) {
  const [expanded, setExpanded] = useState(true)

  return (
    <aside
      className="flex flex-col"
      style={{ width: 258, minHeight: '100vh', backgroundColor: '#154212', flexShrink: 0 }}
    >
      {/* Sidebar header white bar with logo */}
      <div
        className="flex items-center justify-center"
        style={{
          height: 70,
          backgroundColor: '#ffffff',
          borderBottom: '1px solid rgba(0,0,0,0.2)',
          flexShrink: 0,
          overflow: 'hidden',
        }}
      >
        <Image
          src="/logo-mascot.png"
          alt="โลโก้"
          width={58}
          height={70}
          style={{ objectFit: 'contain', height: 70, width: 'auto' }}
        />
      </div>

      {/* Menu */}
      <nav className="flex flex-col" style={{ gap: 5, paddingTop: 8 }}>
        {/* Parent menu item - ข้อมูลร่วมอนุรักษ์โลก */}
        <div style={{ paddingTop: 5, paddingBottom: 5, paddingLeft: 20, paddingRight: 20 }}>
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center w-full"
            style={{ gap: 10, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            <Image src="/figma/tabler-icon-recycle.svg" alt="recycle" width={22} height={22} />
            <span
              className="flex-1 text-left"
              style={{
                color: '#ffffff',
                ...fontStyle,
                fontSize: 13,
                fontWeight: 600,
                lineHeight: '22px',
              }}
            >
              ข้อมูลร่วมอนุรักษ์โลก
            </span>
            <Image
              src="/figma/tabler-icon-chevron-up.svg"
              alt="chevron"
              width={20}
              height={20}
              style={{ transform: expanded ? 'rotate(0deg)' : 'rotate(180deg)', transition: 'transform 0.2s' }}
            />
          </button>
        </div>

        {/* Children — paddingLeft: 52 = parent paddingLeft(20) + icon(22) + gap(10) */}
        {expanded && (
          <>
            <div style={{ paddingTop: 2, paddingBottom: 2, paddingLeft: 52, paddingRight: 12 }}>
              <Link
                href="/"
                style={{
                  display: 'block',
                  color: '#ffffff',
                  ...fontStyle,
                  fontSize: 13,
                  fontWeight: activePage === 'home' ? 700 : 400,
                  lineHeight: '22px',
                  textDecoration: 'none',
                  padding: '5px 10px',
                  borderRadius: 6,
                  backgroundColor: activePage === 'home' ? 'rgba(0,0,0,0.30)' : 'transparent',
                }}
              >
                ปริมาณขยะประจำปี
              </Link>
            </div>
            <div style={{ paddingTop: 2, paddingBottom: 2, paddingLeft: 52, paddingRight: 12 }}>
              <Link
                href="/map"
                style={{
                  display: 'block',
                  color: '#ffffff',
                  ...fontStyle,
                  fontSize: 13,
                  fontWeight: activePage === 'map' ? 700 : 400,
                  lineHeight: '22px',
                  textDecoration: 'none',
                  padding: '5px 10px',
                  borderRadius: 6,
                  backgroundColor: activePage === 'map' ? 'rgba(0,0,0,0.30)' : 'transparent',
                }}
              >
                แผนที่ข้อมูลขยะรายตำบล
              </Link>
            </div>
            <div style={{ paddingTop: 2, paddingBottom: 2, paddingLeft: 52, paddingRight: 12 }}>
              <Link
                href="/waste-types"
                style={{
                  display: 'block',
                  color: '#ffffff',
                  ...fontStyle,
                  fontSize: 13,
                  fontWeight: activePage === 'waste-types' ? 700 : 400,
                  lineHeight: '22px',
                  textDecoration: 'none',
                  padding: '5px 10px',
                  borderRadius: 6,
                  backgroundColor: activePage === 'waste-types' ? 'rgba(0,0,0,0.30)' : 'transparent',
                }}
              >
                ปริมาณขยะแยกตามประเภท
              </Link>
            </div>
          </>
        )}
      </nav>
    </aside>
  )
}
