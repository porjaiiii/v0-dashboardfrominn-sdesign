'use client'

import { ReactNode } from 'react'
import { fontStyle } from '@/lib/design-tokens'
import { ADMIN_COLORS } from '@/lib/admin-tokens'
import { GridIcon } from '@/components/dashboard/AdminSidebar'

/** ชิ้นส่วน UI ที่ใช้ซ้ำในหน้าแอดมิน */

export const STATUS_COLORS = {
  green: '#154212',
  yellow: '#e4ca00',
  red: '#b02e0d',
  navy: ADMIN_COLORS.navy,
} as const

export function PageTitle({
  title,
  subtitle,
  right,
}: {
  title: string
  subtitle?: string
  right?: ReactNode
}) {
  return (
    <div className="flex items-start justify-between" style={{ margin: '10px 0 12px' }}>
      <div>
        <h1
          style={{ color: ADMIN_COLORS.navy, fontSize: 26, fontWeight: 600, lineHeight: '36px', margin: 0, ...fontStyle }}
        >
          {title}
        </h1>
        {subtitle && (
          <p style={{ color: ADMIN_COLORS.navy, fontSize: 16, fontWeight: 600, lineHeight: '24px', margin: '2px 0 0', ...fontStyle }}>
            {subtitle}
          </p>
        )}
      </div>
      {right}
    </div>
  )
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 style={{ color: ADMIN_COLORS.navy, fontSize: 26, fontWeight: 600, margin: 0, ...fontStyle }}>
      {children}
    </h2>
  )
}

/** การ์ดสรุปพื้นม่วงอ่อน + ปุ่มไอคอนมุมขวาบน */
export function SummaryCard({
  label,
  value,
  unit,
  unitColor = '#000',
  height = 118,
  inline = false,
}: {
  label: string
  value: string
  unit?: string
  unitColor?: string
  height?: number
  /** true = ตัวเลขกับหน่วยอยู่บรรทัดเดียวกัน */
  inline?: boolean
}) {
  return (
    <div
      style={{
        position: 'relative',
        flex: 1,
        minWidth: 0,
        height,
        padding: '6px 10px',
        borderRadius: 8,
        backgroundColor: ADMIN_COLORS.cardBg,
        border: `1px solid ${ADMIN_COLORS.cardBorder}`,
        color: '#000',
        ...fontStyle,
      }}
    >
      <div style={{ fontSize: 16, fontWeight: 600, lineHeight: '22px' }}>{label}</div>
      {inline ? (
        <div className="flex items-baseline" style={{ gap: 8 }}>
          <span style={{ fontSize: 36, fontWeight: 600, lineHeight: '52px' }}>{value}</span>
          {unit && <span style={{ fontSize: 16, fontWeight: 600 }}>{unit}</span>}
        </div>
      ) : (
        <>
          <div style={{ fontSize: 34, fontWeight: 600, lineHeight: '44px' }}>{value}</div>
          {unit && (
            <div style={{ fontSize: 16, fontWeight: 600, lineHeight: '22px', color: unitColor }}>{unit}</div>
          )}
        </>
      )}
      <div
        className="flex items-center justify-center"
        style={{
          position: 'absolute',
          top: 12,
          right: 10,
          width: 38,
          height: 38,
          borderRadius: 6,
          backgroundColor: ADMIN_COLORS.cardIcon,
        }}
      >
        <GridIcon size={24} />
      </div>
    </div>
  )
}

/** dropdown แบบไม่มีกรอบ: "label ค่า ⌄" */
export function PlainSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: string[]
  onChange: (v: string) => void
}) {
  return (
    <label
      className="flex items-center"
      style={{ position: 'relative', gap: 8, color: ADMIN_COLORS.navy, fontSize: 16, fontWeight: 600, cursor: 'pointer', ...fontStyle }}
    >
      <span>
        {label} {value}
      </span>
      <Chevron color="#154212" />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
        style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%' }}
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  )
}

/** dropdown ทึบสีกรมท่า (ใช้ในหน้าสต๊อก/รางวัล) */
export function SolidSelect({
  value,
  options,
  onChange,
  label,
}: {
  value: string
  options: string[]
  onChange: (v: string) => void
  label: string
}) {
  return (
    <label
      className="flex items-center"
      style={{
        position: 'relative',
        gap: 10,
        height: 40,
        padding: '0 14px 0 18px',
        borderRadius: 999,
        backgroundColor: ADMIN_COLORS.navy,
        color: '#ffffff',
        fontSize: 16,
        fontWeight: 600,
        cursor: 'pointer',
        ...fontStyle,
      }}
    >
      <span>{value}</span>
      <Chevron color="#ffffff" />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
        style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%' }}
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  )
}

export function Chevron({ color = ADMIN_COLORS.navy, size = 18 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M6 9l6 6 6-6" />
    </svg>
  )
}

export function CsvButton({ onClick, compact = false }: { onClick: () => void; compact?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center"
      style={{
        gap: 8,
        height: compact ? 34 : 42,
        padding: '0 16px',
        borderRadius: 8,
        border: `1.5px solid ${ADMIN_COLORS.cardIcon}`,
        backgroundColor: '#ffffff',
        color: ADMIN_COLORS.cardIcon,
        fontSize: compact ? 14 : 15,
        fontWeight: 600,
        cursor: 'pointer',
        ...fontStyle,
      }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M12 4v11M7 11l5 5 5-5M4 20h16" />
      </svg>
      ส่งออก CSV
    </button>
  )
}

/** ป้ายสถานะทรงแคปซูล */
export function Badge({ children, color, textColor = '#ffffff' }: { children: ReactNode; color: string; textColor?: string }) {
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '3px 14px',
        borderRadius: 999,
        backgroundColor: color,
        color: textColor,
        fontSize: 13,
        fontWeight: 600,
        whiteSpace: 'nowrap',
        ...fontStyle,
      }}
    >
      {children}
    </span>
  )
}

export function downloadCsv(filename: string, headers: string[], rows: (string | number)[][]) {
  const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`
  const text = [headers.map(esc).join(','), ...rows.map((r) => r.map(esc).join(','))].join('\n')
  const blob = new Blob(['﻿' + text], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export interface Column<T> {
  key: string
  label: string
  render?: (row: T) => ReactNode
}

/** ตารางหัวกรมท่า แถวสลับสี พร้อมแถบแบ่งหน้าด้านล่าง */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  total,
  pageSize,
  pageCount,
  page,
  onPage,
}: {
  columns: Column<T>[]
  rows: T[]
  rowKey: (row: T) => string
  total: number
  pageSize: number
  pageCount: number
  page: number
  onPage: (p: number) => void
}) {
  const from = (page - 1) * pageSize + 1
  const to = Math.min((page - 1) * pageSize + rows.length, total)

  const btn = (active: boolean, width = 32) => ({
    width,
    height: 32,
    borderRadius: 6,
    border: `1px solid ${active ? ADMIN_COLORS.cardIcon : '#d5d9e4'}`,
    backgroundColor: active ? ADMIN_COLORS.cardIcon : '#ffffff',
    color: active ? '#ffffff' : '#222',
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    ...fontStyle,
  })

  return (
    <div style={{ border: '1px solid #dfe3ee', borderRadius: 10, overflow: 'hidden', ...fontStyle }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', minWidth: 1300, borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ backgroundColor: ADMIN_COLORS.navy, color: '#ffffff', height: 46 }}>
              {columns.map((c) => (
                <th key={c.key} style={{ textAlign: 'left', padding: '0 10px', fontWeight: 600, whiteSpace: 'nowrap' }}>
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={rowKey(r)} style={{ height: 48, backgroundColor: i % 2 ? '#f8f9fc' : '#ffffff', color: '#333' }}>
                {columns.map((c) => (
                  <td key={c.key} style={{ padding: '0 10px', whiteSpace: 'nowrap' }}>
                    {c.render ? c.render(r) : String((r as Record<string, unknown>)[c.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div
        className="flex items-center justify-between"
        style={{ height: 58, padding: '0 12px', borderTop: '1px solid #e6e9f1', backgroundColor: '#ffffff' }}
      >
        <span style={{ color: '#8a8fa0', fontSize: 13 }}>
          แสดง {from}-{to} จาก {total} รายการ
        </span>
        <div className="flex items-center" style={{ gap: 10 }}>
          <button type="button" aria-label="ก่อนหน้า" style={btn(false, 36)} onClick={() => onPage(Math.max(1, page - 1))}>
            ‹
          </button>
          {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
            <button key={n} type="button" style={btn(n === page)} onClick={() => onPage(n)}>
              {n}
            </button>
          ))}
          <button type="button" aria-label="ถัดไป" style={btn(false, 36)} onClick={() => onPage(Math.min(pageCount, page + 1))}>
            ›
          </button>
        </div>
      </div>
    </div>
  )
}

/** ปุ่มกรอบกรมท่าพื้นขาว */
export const outlineBtn = {
  height: 38,
  padding: '0 20px',
  borderRadius: 10,
  border: `1.5px solid ${ADMIN_COLORS.navy}`,
  backgroundColor: '#ffffff',
  color: ADMIN_COLORS.navy,
  fontSize: 15,
  fontWeight: 600,
  cursor: 'pointer',
  ...fontStyle,
} as const

/** ปุ่มทึบสีกรมท่า */
export const solidBtn = {
  ...outlineBtn,
  backgroundColor: ADMIN_COLORS.navy,
  color: '#ffffff',
} as const

export function SearchInput({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  placeholder: string
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: 470,
        height: 46,
        padding: '0 20px',
        borderRadius: 999,
        border: `1.5px solid ${ADMIN_COLORS.navy}`,
        color: ADMIN_COLORS.navy,
        fontSize: 17,
        fontWeight: 600,
        outline: 'none',
        ...fontStyle,
      }}
    />
  )
}

/** "label [dropdown ทึบ]" */
export function LabeledSolidSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: string[]
  onChange: (v: string) => void
}) {
  return (
    <div className="flex items-center" style={{ gap: 14 }}>
      <span style={{ color: ADMIN_COLORS.navy, fontSize: 24, fontWeight: 600, ...fontStyle }}>{label}</span>
      <SolidSelect label={label} value={value} options={options} onChange={onChange} />
    </div>
  )
}

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      style={{
        position: 'relative',
        width: 60,
        height: 32,
        borderRadius: 999,
        border: 'none',
        cursor: 'pointer',
        backgroundColor: checked ? ADMIN_COLORS.cardIcon : '#e5e7ee',
        transition: 'background-color .15s',
        flexShrink: 0,
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: 3,
          left: checked ? 31 : 3,
          width: 26,
          height: 26,
          borderRadius: '50%',
          backgroundColor: '#ffffff',
          boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
          transition: 'left .15s',
        }}
      />
    </button>
  )
}

export function PencilIcon({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={ADMIN_COLORS.navy} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4" />
    </svg>
  )
}

/** ท้ายตาราง: ปุ่มบันทึก + "แสดง x-y จาก n" + ก่อนหน้า 1 2 3 ถัดไป */
export function TableFooter({
  shown,
  total,
  pageCount,
  page,
  onPage,
  dirty,
  onSave,
}: {
  shown: number
  total: number
  pageCount: number
  page: number
  onPage: (p: number) => void
  dirty: boolean
  onSave: () => void
}) {
  return (
    <>
      <div className="flex justify-end" style={{ marginTop: 14 }}>
        <button
          type="button"
          disabled={!dirty}
          onClick={onSave}
          style={{ ...outlineBtn, opacity: dirty ? 1 : 0.5, cursor: dirty ? 'pointer' : 'default' }}
        >
          บันทึกการเปลี่ยนแปลง
        </button>
      </div>
      <div className="flex items-center justify-between" style={{ marginTop: 8 }}>
        <span style={{ color: ADMIN_COLORS.navy, fontSize: 16, fontWeight: 600, ...fontStyle }}>
          แสดง {shown > 0 ? `1-${shown}` : '0'} จาก {total} รายการ
        </span>
        <div className="flex items-center" style={{ gap: 12 }}>
          <button type="button" style={{ ...outlineBtn, height: 44 }} onClick={() => onPage(Math.max(1, page - 1))}>
            ก่อนหน้า
          </button>
          {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => onPage(n)}
              style={{
                ...outlineBtn,
                height: 44,
                minWidth: 48,
                padding: '0 10px',
                backgroundColor: n === page ? ADMIN_COLORS.navy : '#ffffff',
                color: n === page ? '#ffffff' : ADMIN_COLORS.navy,
              }}
            >
              {n}
            </button>
          ))}
          <button type="button" style={{ ...outlineBtn, height: 44 }} onClick={() => onPage(Math.min(pageCount, page + 1))}>
            ถัดไป
          </button>
        </div>
      </div>
    </>
  )
}
