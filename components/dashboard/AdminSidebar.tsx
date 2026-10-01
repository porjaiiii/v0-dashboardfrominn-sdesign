'use client'

import Image from 'next/image'
import Link from 'next/link'
import { fontStyle } from '@/lib/design-tokens'
import { ADMIN_COLORS } from '@/lib/admin-tokens'
import { useSidebar } from '@/lib/sidebar-context'

const SIDEBAR_WIDTH = 258

/** เมนูย่อยที่มีหน้าจริงแล้ว */
const ITEM_HREFS: Record<string, string> = {
  ผู้ใช้งานทั้งหมด: '/admin/users',
  รายการบันทึกขยะ: '/admin/waste-records',
  'Admin / เจ้าหน้าที่': '/admin/staff',
  สต๊อกรางวัล: '/admin/reward-stock',
  รายการรางวัล: '/admin/rewards',
  ข้อมูลขยะ: '/admin/waste-data',
  ข้อมูลระบบ: '/admin/system-info',
  สูตรคะแนน: '/admin/point-formula',
  การแจ้งเตือน: '/admin/notifications',
}

interface MenuGroup {
  title: string
  items: string[]
}

const MENU: MenuGroup[] = [
  { title: 'จัดการผู้ใช้งาน', items: ['ผู้ใช้งานทั้งหมด', 'รายละเอียดผู้ใช้งาน', 'ประวัติการใช้งาน'] },
  { title: 'จัดการขยะ', items: ['รายการบันทึกขยะ', 'ตรวจสอบ/\nยืนยันการรับขยะ', 'ประวัติการรับขยะ'] },
  {
    title: 'จัดการรางวัล',
    items: ['รายการรางวัล', 'เพิ่ม/แก้ไขรางวัล', 'สต๊อกรางวัล', 'รายการแลกรางวัล'],
  },
  { title: 'จัดการการรับขยะ', items: ['ตารางรอบรับขยะ', 'นัดหมายรับขยะ', 'งานรับขยะ'] },
  { title: 'จัดการเจ้าหน้าที่', items: ['Admin / เจ้าหน้าที่', 'สิทธิ์การเข้าถึง', 'การมอบหมายพื้นที่'] },
  { title: 'จัดการพื้นที่', items: ['6 ตำบล', 'จุดรับขยะ', 'ตารางการรับขยะ'] },
  { title: 'รายงานและสถิติ', items: ['ข้อมูลขยะ', 'คะแนน', 'Carbon Footprint', 'ผู้ใช้งาน'] },
  { title: 'ตั้งค่าระบบ', items: ['ข้อมูลระบบ', 'สูตรคะแนน', 'ค่า Carbon Factor', 'การแจ้งเตือน'] },
]

/** ไอคอนตารางสี่ช่อง (ใช้ทั้งเมนูและการ์ด) */
export function GridIcon({ size = 20, color = '#ffffff' }: { size?: number; color?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="3.5" y="3.5" width="17" height="17" rx="2.5" />
      <path d="M3.5 10h17M10 10v10.5" />
    </svg>
  )
}

const rowBase = {
  display: 'flex',
  alignItems: 'center',
  width: '100%',
  padding: '8px 27px',
  color: '#ffffff',
  fontSize: 14,
  fontWeight: 600,
  lineHeight: '22px',
  textDecoration: 'none',
  ...fontStyle,
} as const

export default function AdminSidebar({ activeHref = '/' }: { activeHref?: string }) {
  const { collapsed } = useSidebar()

  return (
    <aside
      aria-hidden={collapsed}
      style={{
        width: collapsed ? 0 : SIDEBAR_WIDTH,
        minHeight: '100vh',
        backgroundColor: ADMIN_COLORS.navy,
        flexShrink: 0,
        overflow: 'hidden',
        transition: 'width 0.25s ease',
      }}
    >
      <div style={{ width: SIDEBAR_WIDTH }}>
        {/* หัว sidebar — มาสคอตชิดขวา */}
        <div
          style={{
            position: 'relative',
            height: 70,
            backgroundColor: ADMIN_COLORS.navyHeader,
            overflow: 'hidden',
          }}
        >
          <Image
            src="/mascot-sidebar.png"
            alt="โลโก้"
            width={57}
            height={59}
            priority
            style={{ position: 'absolute', right: 11, top: 11 }}
          />
        </div>

        <nav className="flex flex-col" style={{ paddingTop: 1 }}>
          {/* Dashboard (หน้าปัจจุบัน) */}
          <Link
            href="/admin/dashboard"
            style={{
              ...rowBase,
              gap: 12,
              backgroundColor: activeHref === '/admin/dashboard' ? ADMIN_COLORS.navyActive : 'transparent',
              marginBottom: 2,
            }}
          >
            <GridIcon />
            <span>Dashboard</span>
          </Link>

          {MENU.map((group) => (
            <div key={group.title}>
              {group.title === 'ตั้งค่าระบบ' ? (
                <Link href="/admin/system-info" style={{ ...rowBase, gap: 12 }}>
                  <GridIcon />
                  <span>{group.title}</span>
                </Link>
              ) : (
                <div style={{ ...rowBase, gap: 12 }}>
                  <GridIcon />
                  <span>{group.title}</span>
                </div>
              )}
              {group.items.map((item) => {
                const href = ITEM_HREFS[item]
                const style = {
                  ...rowBase,
                  paddingLeft: 60,
                  whiteSpace: 'pre-line' as const,
                  cursor: 'pointer',
                  backgroundColor: href && href === activeHref ? ADMIN_COLORS.navyActive : 'transparent',
                }
                return href ? (
                  <Link key={item} href={href} style={style}>
                    {item}
                  </Link>
                ) : (
                  <div key={item} style={style}>
                    {item}
                  </div>
                )
              })}
            </div>
          ))}
        </nav>
      </div>
    </aside>
  )
}
