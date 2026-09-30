'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import AdminShell from '@/components/dashboard/AdminShell'
import {
  Column,
  CsvButton,
  DataTable,
  PlainSelect,
  SectionTitle,
  SummaryCard,
  downloadCsv,
} from '@/components/dashboard/admin-ui'
import { fontStyle } from '@/lib/design-tokens'
import { ADMIN_COLORS } from '@/lib/admin-tokens'
import { ALL_SUBDISTRICTS, PAGE_SIZE, SUBDISTRICTS } from '@/lib/db/constants'
import type { DashboardSummary, User } from '@/lib/db/types'
import { toBuDate, useAdminFetch, useAdminList } from '@/lib/use-admin-list'

/** แถวที่แสดงในตาราง/ป๊อปอัพ — แปลงจาก app.users ให้เป็นข้อความพร้อมแสดง */
interface Row {
  line_user_id: string
  display_user_id: string
  full_name: string
  nickname: string
  phone_number: string
  gender: string
  age_range: string
  user_type: string
  subdistrict: string
  occupation: string
  /** ISO เดิม ใช้ตอนแสดงในป๊อปอัพ */
  registered_iso: string
  registered_at: string
  is_legacy: string
}

const dash = (v: string | null) => v || '-'

function toRow(u: User): Row {
  return {
    line_user_id: u.line_user_id,
    display_user_id: dash(u.display_user_id),
    full_name: dash(u.full_name),
    nickname: dash(u.nickname),
    phone_number: dash(u.phone_number),
    gender: dash(u.gender),
    age_range: dash(u.age_range),
    user_type: dash(u.user_type),
    subdistrict: dash(u.subdistrict),
    occupation: dash(u.occupation),
    registered_iso: u.registered_at,
    registered_at: toBuDate(u.registered_at),
    is_legacy: String(u.is_legacy),
  }
}

const KEYS = [
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
] as const

const SORT_KEYS: Record<string, string> = { อายุ: 'age', ชื่อ: 'name', วันที่ลงทะเบียน: 'registered' }
const SORT_OPTIONS = Object.keys(SORT_KEYS)
const TAMBON_OPTIONS = [ALL_SUBDISTRICTS, ...SUBDISTRICTS]

const THAI_MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']

/** '2567-01-12' -> '12 ม.ค. 2567' */
function formatThaiDate(iso: string) {
  const dt = new Date(iso)
  if (isNaN(dt.getTime())) return '-'
  return `${dt.getDate()} ${THAI_MONTHS[dt.getMonth()]} ${dt.getFullYear() + 543}`
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
            <DetailField label="วันที่สมัคร">{formatThaiDate(row.registered_iso)}</DetailField>
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


export default function AdminUsersPage() {
  const [page, setPage] = useState(1)
  const [sortBy, setSortBy] = useState(SORT_OPTIONS[0])
  const [tambon, setTambon] = useState(ALL_SUBDISTRICTS)
  const [hover, setHover] = useState<{ row: Row; top: number; left: number } | null>(null)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const list = useAdminList<User>('/api/admin/users', {
    page,
    pageSize: PAGE_SIZE,
    sort: SORT_KEYS[sortBy],
    subdistrict: tambon === ALL_SUBDISTRICTS ? undefined : tambon,
  })
  const { data: summary } = useAdminFetch<DashboardSummary>('/api/admin/summary')
  const rows = list.rows.map(toRow)

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

  const columns: Column<Row>[] = [
    ...KEYS.map((k) => ({ key: k, label: k })),
    {
      key: 'action',
      label: 'action',
      render: (r) => (
        <a
          href="#"
          onClick={(e) => e.preventDefault()}
          onMouseEnter={(e) => openPopup(e, r)}
          onMouseLeave={scheduleClose}
          style={{ color: ADMIN_COLORS.cardIcon, fontWeight: 600, textDecoration: 'none' }}
        >
          ดูรายละเอียด
        </a>
      ),
    },
  ]

  return (
    <AdminShell activeHref="/admin/users">
      <h1
        style={{ color: ADMIN_COLORS.navy, fontSize: 26, fontWeight: 600, lineHeight: '36px', margin: '10px 0 0', ...fontStyle }}
      >
        จัดการผู้ใช้งาน
      </h1>
      <p style={{ color: ADMIN_COLORS.navy, fontSize: 16, fontWeight: 600, lineHeight: '24px', margin: '2px 0 14px', ...fontStyle }}>
        รายชื่อผู้ใช้งานในระบบ
      </p>

      <div className="flex">
        <SummaryCard
          label="ผู้ใช้งานทั้งหมด"
          value={(summary?.users ?? list.total).toLocaleString('th-TH')}
          unit="บัญชี"
          unitColor="#154212"
        />
      </div>

      <div className="flex items-center justify-between" style={{ margin: '8px 0 10px' }}>
        <SectionTitle>รายชื่อผู้ใช้งาน</SectionTitle>
        <div className="flex items-center" style={{ gap: 40 }}>
          <PlainSelect label="เรียงตาม :" value={sortBy} options={SORT_OPTIONS} onChange={(v) => { setSortBy(v); setPage(1) }} />
          <PlainSelect label="ตำบล" value={tambon} options={TAMBON_OPTIONS} onChange={(v) => { setTambon(v); setPage(1) }} />
          <CsvButton
            onClick={() => downloadCsv('users.csv', [...KEYS], rows.map((r) => KEYS.map((k) => r[k])))}
          />
        </div>
      </div>

      {list.error && (
        <p role="alert" style={{ color: '#b02e0d', fontWeight: 600, ...fontStyle }}>
          โหลดข้อมูลไม่สำเร็จ: {list.error}
        </p>
      )}

      <div style={{ opacity: list.loading ? 0.6 : 1, transition: 'opacity .15s' }}>
        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(r) => r.line_user_id}
          total={list.total}
          pageSize={PAGE_SIZE}
          pageCount={Math.max(1, Math.ceil(list.total / PAGE_SIZE))}
          page={page}
          onPage={setPage}
        />
      </div>

      {hover && (
        <UserDetailPopup row={hover.row} top={hover.top} left={hover.left} onEnter={cancelClose} onLeave={scheduleClose} />
      )}
    </AdminShell>
  )
}
