'use client'

import Image from 'next/image'
import { useSidebar } from '@/lib/sidebar-context'

/** ปุ่มสามขีดบน header — กดเพื่อพับ/กางเมนูด้านซ้าย */
export default function MenuButton({ size = 30 }: { size?: number }) {
  const { collapsed, toggle } = useSidebar()

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={collapsed ? 'เปิดเมนู' : 'ย่อเมนู'}
      aria-expanded={!collapsed}
      className="flex items-center justify-center"
      style={{
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: 6,
        marginLeft: -6,
        borderRadius: 8,
        flexShrink: 0,
      }}
    >
      <Image src="/figma/tabler-icon-menu-2.svg" alt="" aria-hidden width={size} height={size} />
    </button>
  )
}
