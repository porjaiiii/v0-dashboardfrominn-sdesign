'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

interface SidebarContextType {
  /** true = เมนูถูกพับเก็บ */
  collapsed: boolean
  toggle: () => void
  setCollapsed: (value: boolean) => void
}

const SidebarContext = createContext<SidebarContextType>({
  collapsed: false,
  toggle: () => {},
  setCollapsed: () => {},
})

/**
 * เก็บสถานะพับ/กางเมนูไว้ที่ layout เพื่อให้ค่าคงอยู่เมื่อสลับหน้า
 * (ปุ่มสามขีดอยู่บน header ของแต่ละหน้า แต่ตัว sidebar เป็นคนละ component)
 */
export function SidebarProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <SidebarContext.Provider
      value={{ collapsed, toggle: () => setCollapsed((v) => !v), setCollapsed }}
    >
      {children}
    </SidebarContext.Provider>
  )
}

export const useSidebar = () => useContext(SidebarContext)
