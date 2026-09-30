'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import AdminShell from '@/components/dashboard/AdminShell'
import { GridIcon } from '@/components/dashboard/AdminSidebar'
import { fontStyle } from '@/lib/design-tokens'
import { ADMIN_COLORS } from '@/lib/admin-tokens'

const TOTAL = 500
const PAGE_SIZE = 10
const PAGES = [1, 2, 3, 4, 5]

const COLUMNS = [
  'line_user_id',
  'display_user_id',
  'full_name',
  'nickname',
  'phone_number',
  'gender',
  'age_range',
  'user_type',
  'subdistrict',
  'occupation',
  'registered_at',
  'is_legacy',
  'action',
] as const

type DataKey = Exclude<(typeof COLUMNS)[number], 'action'>
type Row = Record<DataKey, string>

const mk = (
  line_user_id: string,
  display_user_id: string,
  full_name: string,
  nickname: string,
  phone_number: string,
  gender: string,
  age_range: string,
  occupation: string,
  registered_at: string,
): Row => ({
  line_user_id,
  display_user_id,
  full_name,
  nickname,
  phone_number,
  gender,
  age_range,
  user_type: 'ผู้ใช้ทั่วไป',
  subdistrict: 'บางกอบัว',
  occupation,
  registered_at,
  is_legacy: 'false',
})

// TODO: เปลี่ยนเป็นข้อมูลจริงจาก API/Google Sheets
const ROWS: Row[] = [
  mk('Uf1a2b3c4d5', '-', 'สมชาย ใจดี', 'สมชาย', '081-234-5678', 'ชาย', '25-34', 'พนักงานบริษัท', '2567-01-12'),
  mk('Ux2y3z4w5e6', '-', 'นันทพร สุขใจ', 'นันทพร', '081-987-6543', 'หญิง', '35-44', 'ครู', '2567-01-15'),
  mk('Ub3c4d5e6f7', 'กิตติพงษ์ วงศ์สว่าง', 'กิตติพงษ์ วงศ์สว่าง', 'กิตติพงษ์', '089-123-4567', 'ชาย', '18-24', 'นักศึกษา', '2567-01-18'),
  mk('Ua4b5c6d7e8', '-', 'สุภาพร บุญชัย', 'สุภาพร', '081-555-1234', 'หญิง', '45-54', 'เจ้าของกิจการ', '2567-01-22'),
  mk('Ue5f6g7h8i9', 'ธนพล วรพงษ์', 'ธนพล วรพงษ์', 'ธนพล', '089-901-2345', 'ชาย', '55+', 'เกษียณ', '2567-01-25'),
  mk('Uj6k7l8m9n0', '-', 'พิมพา รุ่งเรือง', 'พิมพา', '081-777-8888', 'หญิง', '25-34', 'พนักงานบริษัท', '2567-01-28'),
  mk('Uo7p8q9r0s1', 'วีรศักดิ์ นิยมไทย', 'วีรศักดิ์ นิยมไทย', 'วีรศักดิ์', '089-444-5555', 'ชาย', '35-44', 'พนักงานบริษัท', '2567-02-01'),
  mk('Up9q0r1s2t3', '-', 'สุวิมล สุขมาล', 'สุวิมล', '081-222-3333', 'หญิง', '18-24', 'นักศึกษา', '2567-02-05'),
  mk('Uv1w2x3y4z5', 'รัฐพล ศรีสมุทร', 'รัฐพล ศรีสมุทร', 'รัฐพล', '089-666-7777', 'ชาย', '45-54', 'เจ้าของกิจการ', '2567-02-10'),
  mk('Ua2b3c4d5e6', '-', 'นภาพร วงศ์สว่าง', 'นภาพร', '081-888-9999', 'หญิง', '25-34', 'ครู', '2567-02-12'),
]

const SORT_OPTIONS = ['อายุ', 'ชื่อ', 'วันที่ลงทะเบียน']
const TAMBON_OPTIONS = ['บางกอบัว', 'บางกะเจ้า', 'บางยอ', 'บางน้ำผึ้ง', 'ทรงคนอง', 'หนองปรือ']

const THAI_MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']

/** '2567-01-12' -> '12 ม.ค. 2567' */
function formatThaiDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  return `${d} ${THAI_MONTHS[m - 1]} ${y}`
}

const POPUP_WIDTH = 380
const POPUP_HEIGHT = 425

function DetailField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center" style={{ gap: 10, height: 32 }}>
      <span style={{ color: '#154212', fontWeight: 600 }}>{label}</span>
      <span style={{ color: '#111', fontWeight: 500 }}>{children}</span>
    </div>
  )
}

/** ป๊อปอัพรายละเอียดผู้ใช้ที่แสดงตอน hover "ดูรายละเอียด" */
function UserDetailPopup({
  row,
  top,
  left,
  onEnter,
  onLeave,
}: {
  row: Row
  top: number
  left: number
  onEnter: () => void
  onLeave: () => void
}) {
  return (
    <div
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      style={{
        position: 'fixed',
        top,
        left,
        width: POPUP_WIDTH,
        zIndex: 100,
        borderRadius: 14,
        backgroundColor: '#ffffff',
        boxShadow: '0 4px 24px rgba(0,0,0,0.25)',
        overflow: 'hidden',
        fontSize: 14,
        ...fontStyle,
      }}
    >
      <div style={{ height: 60, backgroundColor: ADMIN_COLORS.navy }} />
      <div className="flex flex-col items-center" style={{ marginTop: -50 }}>
        <div
          style={{
            width: 100,
            height: 100,
            borderRadius: '50%',
            border: '3px solid #ffffff',
            backgroundColor: '#eef2fb',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Image src="/logo-mascot.png" alt="" width={44} height={70} style={{ height: 'auto' }} />
        </div>
        <div
          className="flex items-center"
          style={{
            marginTop: 8,
            gap: 8,
            height: 34,
            padding: '0 16px 0 10px',
            borderRadius: 999,
            border: `1px solid ${ADMIN_COLORS.navy}`,
            background: 'linear-gradient(90deg, #b6cbe8, #e6ebe6)',
            color: ADMIN_COLORS.navy,
            fontWeight: 600,
            fontSize: 15,
          }}
        >
          <svg width="20" height="22" viewBox="0 0 24 26" aria-hidden>
            <path d="M6 15l-3 10 5-3 3 3 2-9zM18 15l3 10-5-3-3 3-2-9z" fill="#111" />
            <circle cx="12" cy="10" r="8" fill="#3a8a1e" />
            <circle cx="12" cy="10" r="3.5" fill="#fff" />
          </svg>
          นักอนุรักษ์มือใหม่
        </div>
      </div>

      <div style={{ padding: '0 20px 18px' }}>
        <div className="flex justify-end" style={{ marginTop: 6 }}>
          <button
            type="button"
            className="flex items-center"
            style={{
              gap: 8,
              height: 30,
              padding: '0 12px',
              borderRadius: 6,
              border: '1px solid #154212',
              backgroundColor: '#ffffff',
              color: '#154212',
              fontWeight: 600,
              fontSize: 13,
              cursor: 'pointer',
              ...fontStyle,
            }}
          >
            แก้ไข
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#154212" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4" />
            </svg>
          </button>
        </div>
        <div style={{ height: 1, backgroundColor: '#154212', margin: '10px 0 6px' }} />

        <div className="flex justify-between" style={{ gap: 10 }}>
          <div className="flex flex-col" style={{ gap: 4 }}>
            <DetailField label="ชื่อ-นามสกุล">{row.full_name}</DetailField>
            <DetailField label="Line">{row.line_user_id}</DetailField>
            <DetailField label="เบอร์โทร">{row.phone_number}</DetailField>
            <DetailField label="ตำบล">{row.subdistrict}</DetailField>
            <DetailField label="วันที่สมัคร">{formatThaiDate(row.registered_at)}</DetailField>
          </div>
          <div className="flex flex-col items-end" style={{ gap: 4 }}>
            <DetailField label="เพศ">{row.gender}</DetailField>
            <DetailField label="อายุ">{row.age_range} ปี</DetailField>
            <DetailField label="ประเภท">{row.user_type}</DetailField>
            <DetailField label="อาชีพ">{row.occupation}</DetailField>
            <DetailField label="สถานะ">
              <span
                style={{
                  display: 'inline-block',
                  padding: '2px 8px',
                  borderRadius: 4,
                  backgroundColor: ADMIN_COLORS.navy,
                  color: '#ffffff',
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                ใช้งาน
              </span>
            </DetailField>
          </div>
        </div>
      </div>
    </div>
  )
}

function Chevron() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#154212"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  )
}

/** dropdown แบบไม่มีกรอบ: "label ค่า ⌄" */
function PlainSelect({
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
      style={{
        position: 'relative',
        gap: 8,
        color: ADMIN_COLORS.navy,
        fontSize: 16,
        fontWeight: 600,
        cursor: 'pointer',
        ...fontStyle,
      }}
    >
      <span>
        {label} {value}
      </span>
      <Chevron />
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

function toCsv(rows: Row[]) {
  const keys = COLUMNS.filter((c): c is DataKey => c !== 'action')
  const esc = (v: string) => `"${v.replace(/"/g, '""')}"`
  return [keys.join(','), ...rows.map((r) => keys.map((k) => esc(r[k])).join(','))].join('\n')
}

export default function AdminUsersPage() {
  const [page, setPage] = useState(1)
  const [sortBy, setSortBy] = useState('อายุ')
  const [tambon, setTambon] = useState('บางกอบัว')
  const [hover, setHover] = useState<{ row: Row; top: number; left: number } | null>(null)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const cancelClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
  }
  const scheduleClose = () => {
    cancelClose()
    closeTimer.current = setTimeout(() => setHover(null), 150)
  }
  const openPopup = (e: React.MouseEvent<HTMLElement>, row: Row) => {
    cancelClose()
    const r = e.currentTarget.getBoundingClientRect()
    const left = Math.max(8, Math.min(r.right - POPUP_WIDTH, window.innerWidth - POPUP_WIDTH - 8))
    const top = Math.max(8, Math.min(r.top + r.height / 2 - POPUP_HEIGHT / 2, window.innerHeight - POPUP_HEIGHT - 8))
    setHover({ row, top, left })
  }

  const from = (page - 1) * PAGE_SIZE + 1
  const to = Math.min(page * PAGE_SIZE, TOTAL)

  const exportCsv = () => {
    const blob = new Blob(['﻿' + toCsv(ROWS)], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'users.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const pageBtn = (active: boolean) => ({
    width: 32,
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
    <AdminShell activeHref="/admin/users">
      <h1
        style={{
          color: ADMIN_COLORS.navy,
          fontSize: 26,
          fontWeight: 600,
          lineHeight: '36px',
          margin: '10px 0 0',
          ...fontStyle,
        }}
      >
        จัดการผู้ใช้งาน
      </h1>
      <p
        style={{
          color: ADMIN_COLORS.navy,
          fontSize: 16,
          fontWeight: 600,
          lineHeight: '24px',
          margin: '2px 0 14px',
          ...fontStyle,
        }}
      >
        รายชื่อผู้ใช้งานในระบบ
      </p>

      {/* การ์ดสรุป */}
      <div
        style={{
          position: 'relative',
          height: 118,
          padding: '6px 10px',
          borderRadius: 8,
          backgroundColor: ADMIN_COLORS.cardBg,
          border: `1px solid ${ADMIN_COLORS.cardBorder}`,
          ...fontStyle,
        }}
      >
        <div style={{ fontSize: 16, fontWeight: 600, lineHeight: '22px', color: '#000' }}>
          ผู้ใช้งานทั้งหมด
        </div>
        <div style={{ fontSize: 34, fontWeight: 600, lineHeight: '44px', color: '#000' }}>{TOTAL}</div>
        <div style={{ fontSize: 16, fontWeight: 600, lineHeight: '22px', color: '#154212' }}>บัญชี</div>
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

      {/* หัวตาราง + ตัวกรอง */}
      <div className="flex items-center justify-between" style={{ margin: '8px 0 10px' }}>
        <h2
          style={{ color: ADMIN_COLORS.navy, fontSize: 26, fontWeight: 600, margin: 0, ...fontStyle }}
        >
          รายชื่อผู้ใช้งาน
        </h2>
        <div className="flex items-center" style={{ gap: 40 }}>
          <PlainSelect label="เรียงตาม :" value={sortBy} options={SORT_OPTIONS} onChange={setSortBy} />
          <PlainSelect label="ตำบล" value={tambon} options={TAMBON_OPTIONS} onChange={setTambon} />
          <button
            type="button"
            onClick={exportCsv}
            className="flex items-center"
            style={{
              gap: 8,
              height: 42,
              padding: '0 16px',
              borderRadius: 8,
              border: `1.5px solid ${ADMIN_COLORS.cardIcon}`,
              backgroundColor: '#ffffff',
              color: ADMIN_COLORS.cardIcon,
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer',
              ...fontStyle,
            }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M12 4v11M7 11l5 5 5-5M4 20h16" />
            </svg>
            ส่งออก CSV
          </button>
        </div>
      </div>

      {/* ตาราง */}
      <div style={{ border: '1px solid #dfe3ee', borderRadius: 10, overflow: 'hidden', ...fontStyle }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', minWidth: 1500, borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ backgroundColor: ADMIN_COLORS.navy, color: '#ffffff', height: 46 }}>
                {COLUMNS.map((c) => (
                  <th
                    key={c}
                    style={{ textAlign: 'left', padding: '0 10px', fontWeight: 600, whiteSpace: 'nowrap' }}
                  >
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((r, i) => (
                <tr
                  key={r.line_user_id}
                  style={{ height: 48, backgroundColor: i % 2 ? '#f8f9fc' : '#ffffff', color: '#333' }}
                >
                  {COLUMNS.map((c) =>
                    c === 'action' ? (
                      <td key={c} style={{ padding: '0 10px', whiteSpace: 'nowrap' }}>
                        <a
                          href="#"
                          onClick={(e) => e.preventDefault()}
                          onMouseEnter={(e) => openPopup(e, r)}
                          onMouseLeave={scheduleClose}
                          style={{ color: ADMIN_COLORS.cardIcon, fontWeight: 600, textDecoration: 'none' }}
                        >
                          ดูรายละเอียด
                        </a>
                      </td>
                    ) : (
                      <td key={c} style={{ padding: '0 10px', whiteSpace: 'nowrap' }}>
                        {r[c]}
                      </td>
                    ),
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div
          className="flex items-center justify-between"
          style={{
            height: 58,
            padding: '0 12px',
            borderTop: '1px solid #e6e9f1',
            backgroundColor: '#ffffff',
          }}
        >
          <span style={{ color: '#8a8fa0', fontSize: 13 }}>
            แสดง {from}-{to} จาก {TOTAL} รายการ
          </span>
          <div className="flex items-center" style={{ gap: 10 }}>
            <button
              type="button"
              aria-label="ก่อนหน้า"
              style={{ ...pageBtn(false), width: 36 }}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              ‹
            </button>
            {PAGES.map((n) => (
              <button key={n} type="button" style={pageBtn(n === page)} onClick={() => setPage(n)}>
                {n}
              </button>
            ))}
            <button
              type="button"
              aria-label="ถัดไป"
              style={{ ...pageBtn(false), width: 36 }}
              onClick={() => setPage((p) => Math.min(PAGES.length, p + 1))}
            >
              ›
            </button>
          </div>
        </div>
      </div>
      {hover && (
        <UserDetailPopup
          row={hover.row}
          top={hover.top}
          left={hover.left}
          onEnter={cancelClose}
          onLeave={scheduleClose}
        />
      )}
    </AdminShell>
  )
}
