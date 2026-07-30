'use client'

import { useEffect, useRef, useState } from 'react'
import { COLORS, PILL_HEIGHT, fontStyle } from '@/lib/design-tokens'

export interface SelectOption {
  value: string
  label: string
}

interface SelectPillProps {
  value: string
  options: (SelectOption | string)[]
  onChange: (value: string) => void
  /** ความกว้างขั้นต่ำของ pill (แบบใช้ 143px สำหรับ dropdown ปี) */
  minWidth?: number
  /** ให้กล่องรายการกางออกโดยชิดขวาแทนที่จะเต็มความกว้าง */
  align?: 'left' | 'right'
}

function normalise(o: SelectOption | string): SelectOption {
  return typeof o === 'string' ? { value: o, label: o } : o
}

/**
 * Dropdown ตามแบบ: pill ขอบเขียว 2px มุมมน 10 สูง 36
 * เมื่อกางออกจะกลายเป็นกล่องเดียวกัน มีเส้นคั่นเขียวระหว่างรายการ และข้อความจัดกึ่งกลาง
 */
export default function SelectPill({
  value,
  options,
  onChange,
  minWidth = 143,
  align = 'left',
}: SelectPillProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDocClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [open])

  const list = options.map(normalise)
  const current = list.find((o) => o.value === value)

  return (
    <div
      ref={rootRef}
      style={{ position: 'relative', height: PILL_HEIGHT, minWidth, flexShrink: 0 }}
    >
      <div
        style={{
          position: open ? 'absolute' : 'relative',
          top: 0,
          [align === 'right' ? 'right' : 'left']: 0,
          minWidth: '100%',
          zIndex: 40,
          backgroundColor: COLORS.white,
          border: `2px solid ${COLORS.green}`,
          borderRadius: 10,
          overflow: 'hidden',
        }}
      >
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex items-center justify-center"
          style={{
            width: '100%',
            height: PILL_HEIGHT - 4,
            gap: 10,
            padding: '0 18px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: COLORS.green,
            fontSize: 16,
            fontWeight: 600,
            whiteSpace: 'nowrap',
            ...fontStyle,
          }}
        >
          <span>{current?.label ?? value}</span>
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            style={{
              flexShrink: 0,
              transform: open ? 'rotate(180deg)' : 'none',
              transition: 'transform .15s ease',
            }}
            aria-hidden
          >
            <path
              d="M6 9L12 15L18 9"
              stroke={COLORS.green}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {open && (
          <div style={{ maxHeight: 260, overflowY: 'auto' }}>
            {list.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => {
                  onChange(o.value)
                  setOpen(false)
                }}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '6px 18px',
                  textAlign: 'center',
                  background: 'none',
                  border: 'none',
                  borderTop: `2px solid ${COLORS.green}`,
                  cursor: 'pointer',
                  color: COLORS.green,
                  fontSize: 16,
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  ...fontStyle,
                }}
              >
                {o.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
