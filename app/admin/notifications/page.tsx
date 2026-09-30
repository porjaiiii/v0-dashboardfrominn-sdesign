'use client'

import { useMemo, useState } from 'react'
import AdminShell from '@/components/dashboard/AdminShell'
import {
  Badge,
  LabeledSolidSelect,
  PageTitle,
  PencilIcon,
  SearchInput,
  STATUS_COLORS,
  TableFooter,
  outlineBtn,
} from '@/components/dashboard/admin-ui'
import { ADMIN_COLORS } from '@/lib/admin-tokens'
import { fontStyle } from '@/lib/design-tokens'

type Status = 'ส่งแล้ว' | 'รอ' | 'ยกเลิก'

interface Notice {
  no: string
  type: string
  message: string
  recipient: string
  sentAt: string
  status: Status
}

// TODO: เปลี่ยนเป็นข้อมูลจริงจาก API/Google Sheets
const ROWS: Notice[] = [
  { no: '01', type: 'คะแนนใกล้หมดอายุ', message: 'คะแนนของคุณจะหมดอายุภายใน 30 วัน', recipient: 'ผู้ใช้ทั่วไป', sentAt: '26 ม.ค. 2569 09:00', status: 'ส่งแล้ว' },
  { no: '02', type: 'รางวัลหมดสต๊อก', message: 'ถุงผ้าลายน้องรักษ์หมดสต๊อกแล้ว', recipient: 'แอดมินทุกคน', sentAt: '25 ม.ค. 2569 15:30', status: 'รอ' },
  { no: '03', type: 'การรับขยะสำเร็จ', message: 'รับขยะเรียบร้อย ได้รับคะแนนแล้ว', recipient: 'บางกอบัว', sentAt: '25 ม.ค. 2569 10:15', status: 'ส่งแล้ว' },
  { no: '04', type: 'อัพเดตการแลกรางวัล', message: 'แลกรางวัลของคุณถูกยกเลิก', recipient: 'ผู้ใช้ทั่วไป', sentAt: '24 ม.ค. 2569 18:22', status: 'ยกเลิก' },
  { no: '05', type: 'การเปลี่ยนแปลงของรางวัล', message: 'เปลี่ยนแปลงรายการของรางวัลใหม่', recipient: 'ผู้ใช้ทั่วไป', sentAt: '24 ม.ค. 2569 08:00', status: 'ส่งแล้ว' },
]

const STATUS_COLOR: Record<Status, { bg: string; fg: string }> = {
  ส่งแล้ว: { bg: '#1e3a9f', fg: '#ffffff' },
  รอ: { bg: STATUS_COLORS.yellow, fg: '#ffffff' },
  ยกเลิก: { bg: STATUS_COLORS.red, fg: '#ffffff' },
}

const th = { textAlign: 'left', padding: '0 20px', fontWeight: 600, borderRight: '1px solid rgba(255,255,255,0.15)' } as const
const td = { padding: '0 20px', borderRight: '1px solid #e2e5ee', fontWeight: 600, fontSize: 18 } as const

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        flex: 1,
        minWidth: 0,
        height: 140,
        padding: '18px 22px',
        borderRadius: 12,
        backgroundColor: '#e8effd',
        border: '1px solid #d5dcf0',
        boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
        ...fontStyle,
      }}
    >
      <div style={{ color: '#3a4a86', fontSize: 17, fontWeight: 500 }}>{label}</div>
      <div style={{ color: '#111', fontSize: 36, fontWeight: 600, marginTop: 8 }}>{value}</div>
    </div>
  )
}

export default function NotificationsPage() {
  const [query, setQuery] = useState('')
  const [type, setType] = useState('ทุกประเภท')
  const [status, setStatus] = useState('ทุกสถานะ')
  const [page, setPage] = useState(1)

  const typeOptions = ['ทุกประเภท', ...Array.from(new Set(ROWS.map((r) => r.type)))]

  const visible = useMemo(
    () =>
      ROWS.filter(
        (r) =>
          (!query || r.type.includes(query) || r.message.includes(query)) &&
          (type === 'ทุกประเภท' || r.type === type) &&
          (status === 'ทุกสถานะ' || r.status === status),
      ),
    [query, type, status],
  )

  return (
    <AdminShell activeHref="/admin/notifications">
      <PageTitle
        title="ระบบแจ้งเตือน"
        subtitle="จัดการการแจ้งเตือนข่าวสารและสถานะ"
        right={
          <button type="button" style={{ ...outlineBtn, height: 50, fontSize: 17 }}>
            + สร้างการแจ้งเตือนใหม่
          </button>
        }
      />

      <div className="flex items-center justify-between" style={{ marginBottom: 12, gap: 20 }}>
        <SearchInput value={query} onChange={setQuery} placeholder="ค้นหาการแจ้งเตือน" />
        <div className="flex items-center" style={{ gap: 40 }}>
          <LabeledSolidSelect label="ประเภท" value={type} options={typeOptions} onChange={setType} />
          <LabeledSolidSelect label="สถานะ" value={status} options={['ทุกสถานะ', 'ส่งแล้ว', 'รอ', 'ยกเลิก']} onChange={setStatus} />
        </div>
      </div>

      <div className="flex" style={{ gap: 18, marginBottom: 14 }}>
        <StatCard label="แจ้งเตือนส่งแล้วทั้งหมด" value="48 ครั้ง" />
        <StatCard label="ค้างอยู่รอดำเนินการ" value="12 รายการ" />
        <StatCard label="ส่งแล้วสัปดาห์นี้" value="2 ครั้ง" />
      </div>

      <div style={{ border: '1px solid #dfe3ee', borderRadius: 10, overflow: 'hidden', ...fontStyle }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
          <thead>
            <tr style={{ backgroundColor: ADMIN_COLORS.navy, color: '#ffffff', height: 74, fontSize: 17 }}>
              <th style={{ ...th, width: '8%' }}>ลำดับ</th>
              <th style={{ ...th, width: '20%' }}>ประเภท</th>
              <th style={{ ...th, width: '13%' }}>ข้อความแจ้งเตือน</th>
              <th style={{ ...th, width: '14%' }}>ผู้รับ</th>
              <th style={{ ...th, width: '21%' }}>วันที่ส่ง</th>
              <th style={{ ...th, width: '14%' }}>สถานะ</th>
              <th style={{ ...th, borderRight: 'none' }}>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((r, i) => (
              <tr key={r.no} style={{ height: 98, borderBottom: '1px solid #e2e5ee', backgroundColor: i % 2 ? '#f8f9fc' : '#ffffff', color: ADMIN_COLORS.navy }}>
                <td style={td}>{r.no}</td>
                <td style={{ ...td, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.type}</td>
                <td style={{ ...td, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={r.message}>
                  {r.message}
                </td>
                <td style={td}>{r.recipient}</td>
                <td style={{ ...td, fontWeight: 500 }}>{r.sentAt}</td>
                <td style={td}>
                  <Badge color={STATUS_COLOR[r.status].bg} textColor={STATUS_COLOR[r.status].fg}>
                    {r.status}
                  </Badge>
                </td>
                <td style={{ padding: '0 20px' }}>
                  <button type="button" aria-label={`แก้ไข ${r.type}`} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                    <PencilIcon size={24} />
                  </button>
                </td>
              </tr>
            ))}
            {visible.length === 0 && (
              <tr>
                <td colSpan={7} style={{ padding: 30, textAlign: 'center', color: '#8a8fa0' }}>
                  ไม่พบการแจ้งเตือน
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <TableFooter shown={visible.length} total={12} pageCount={2} page={page} onPage={setPage} dirty={false} onSave={() => {}} />
    </AdminShell>
  )
}
