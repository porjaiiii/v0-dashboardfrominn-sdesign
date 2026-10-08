'use client'

import { useState, type ReactNode } from 'react'
import AdminShell, { useCurrentAccount } from '@/components/dashboard/AdminShell'
import {
  Badge,
  Column,
  DataTable,
  PageTitle,
  PlainSelect,
  SearchInput,
  STATUS_COLORS,
  outlineBtn,
  solidBtn,
} from '@/components/dashboard/admin-ui'
import { postJson } from '@/lib/auth-client'
import type { AccountListItem } from '@/lib/auth/accounts'
import { ACCOUNT_STATUSES, ROLE_LABELS, STATUS_LABELS, type AccountStatus, type Role } from '@/lib/auth/policy'
import { PAGE_SIZE } from '@/lib/db/constants'
import { toBuDateTime, useAdminList } from '@/lib/use-admin-list'

type Tab = 'pending' | 'all'
type Command = { action: 'approve' | 'set-role'; role: Role } | { action: 'reject' | 'disable' | 'enable' } | 'delete'

const ALL_STATUSES = 'ทุกสถานะ'

const STATUS_BADGE: Record<AccountStatus, { color: string; text?: string }> = {
  unverified: { color: '#8a8fa0' },
  pending: { color: STATUS_COLORS.yellow, text: '#222222' },
  active: { color: STATUS_COLORS.green },
  disabled: { color: STATUS_COLORS.red },
}

const smallBtn = { height: 32, padding: '0 12px', fontSize: 13 } as const
const muted = { color: '#8a8fa0', fontSize: 13 } as const

function RowActions({
  row,
  meId,
  busy,
  onCommand,
}: {
  row: AccountListItem
  meId: string | undefined
  busy: boolean
  onCommand: (row: AccountListItem, command: Command) => void
}) {
  if (row.is_root) return <span style={muted}>บัญชี root</span>
  if (row.id === meId) return <span style={muted}>บัญชีของคุณ</span>

  const button = (label: string, command: Command, solid = false) => (
    <button
      key={label}
      type="button"
      disabled={busy}
      onClick={() => onCommand(row, command)}
      style={{ ...(solid ? solidBtn : outlineBtn), ...smallBtn, opacity: busy ? 0.5 : 1 }}
    >
      {label}
    </button>
  )

  const byStatus: Record<AccountStatus, ReactNode[]> = {
    pending: [
      button('อนุมัติเป็นผู้ใช้', { action: 'approve', role: 'user' }, true),
      button('อนุมัติเป็นแอดมิน', { action: 'approve', role: 'admin' }),
      button('ปฏิเสธ', { action: 'reject' }),
    ],
    active: [
      row.role === 'admin'
        ? button('เปลี่ยนเป็นผู้ใช้', { action: 'set-role', role: 'user' })
        : button('ตั้งเป็นแอดมิน', { action: 'set-role', role: 'admin' }),
      button('ปิดใช้งาน', { action: 'disable' }),
    ],
    disabled: [button('เปิดใช้งาน', { action: 'enable' })],
    unverified: [],
  }

  return (
    <div className="flex" style={{ gap: 6 }}>
      {byStatus[row.status]}
      {button('ลบ', 'delete')}
    </div>
  )
}

function AccountsView() {
  const me = useCurrentAccount()
  const [tab, setTab] = useState<Tab>('pending')
  const [page, setPage] = useState(1)
  const [q, setQ] = useState('')
  const [statusFilter, setStatusFilter] = useState(ALL_STATUSES)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [message, setMessage] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null)

  const status = tab === 'pending' ? 'pending' : ACCOUNT_STATUSES.find((s) => STATUS_LABELS[s] === statusFilter)
  const list = useAdminList<AccountListItem>('/api/admin/accounts', {
    page,
    pageSize: PAGE_SIZE,
    status,
    q: tab === 'all' ? q : undefined,
  })

  const run = async (row: AccountListItem, command: Command) => {
    if (command === 'delete' && !window.confirm(`ลบบัญชี ${row.email} ถาวร? ย้อนกลับไม่ได้`)) return
    setBusyId(row.id)
    setMessage(null)
    const url = `/api/admin/accounts/${row.id}`
    const res =
      command === 'delete'
        ? await postJson(url, undefined, 'DELETE')
        : await postJson<{ emailSent?: boolean }>(url, command, 'PATCH')
    setBusyId(null)
    if (!res.ok) {
      setMessage({ tone: 'error', text: res.data.error || 'ทำรายการไม่สำเร็จ' })
    } else if ((res.data as { emailSent?: boolean }).emailSent === false) {
      setMessage({ tone: 'error', text: `บันทึกแล้ว แต่ส่งอีเมลแจ้ง ${row.email} ไม่สำเร็จ` })
    } else {
      setMessage({ tone: 'ok', text: 'บันทึกแล้ว' })
    }
    list.reload()
  }

  const columns: Column<AccountListItem>[] = [
    { key: 'full_name', label: 'ชื่อ' },
    { key: 'email', label: 'อีเมล' },
    {
      key: 'role',
      label: 'บทบาท',
      render: (r) => (
        <span className="flex items-center" style={{ gap: 6 }}>
          {ROLE_LABELS[r.role]}
          {r.is_root && <Badge color={STATUS_COLORS.navy}>root</Badge>}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'สถานะ',
      render: (r) => (
        <Badge color={STATUS_BADGE[r.status].color} textColor={STATUS_BADGE[r.status].text}>
          {STATUS_LABELS[r.status]}
        </Badge>
      ),
    },
    { key: 'created_at', label: 'วันที่สมัคร', render: (r) => toBuDateTime(r.created_at) },
    {
      key: 'actions',
      label: 'จัดการ',
      render: (r) => <RowActions row={r} meId={me?.id} busy={busyId === r.id} onCommand={run} />,
    },
  ]

  return (
    <>
      <PageTitle title="บัญชีแดชบอร์ด" subtitle="อนุมัติและจัดการบัญชีที่ใช้เข้าสู่ระบบแดชบอร์ดนี้" />

      <div className="flex" style={{ gap: 10, marginBottom: 12 }}>
        {(['pending', 'all'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => {
              setTab(t)
              setPage(1)
            }}
            style={tab === t ? solidBtn : outlineBtn}
          >
            {t === 'pending' ? 'รออนุมัติ' : 'บัญชีทั้งหมด'}
          </button>
        ))}
      </div>

      {tab === 'all' && (
        <div className="flex items-center justify-between" style={{ gap: 20, marginBottom: 12 }}>
          <SearchInput
            value={q}
            onChange={(v) => {
              setQ(v)
              setPage(1)
            }}
            placeholder="ค้นหาชื่อหรืออีเมล"
          />
          <PlainSelect
            label="สถานะ"
            value={statusFilter}
            options={[ALL_STATUSES, ...ACCOUNT_STATUSES.map((s) => STATUS_LABELS[s])]}
            onChange={(v) => {
              setStatusFilter(v)
              setPage(1)
            }}
          />
        </div>
      )}

      {message && (
        <p role={message.tone === 'error' ? 'alert' : 'status'} style={{ color: message.tone === 'error' ? '#b02e0d' : '#154212', fontWeight: 600 }}>
          {message.text}
        </p>
      )}
      {list.error && (
        <p role="alert" style={{ color: '#b02e0d', fontWeight: 600 }}>
          โหลดข้อมูลไม่สำเร็จ: {list.error}
        </p>
      )}

      <div style={{ opacity: list.loading ? 0.6 : 1, transition: 'opacity .15s' }}>
        <DataTable
          columns={columns}
          rows={list.rows}
          rowKey={(r) => r.id}
          total={list.total}
          pageSize={PAGE_SIZE}
          pageCount={Math.max(1, Math.ceil(list.total / PAGE_SIZE))}
          page={page}
          onPage={setPage}
        />
      </div>
    </>
  )
}

export default function AccountsPage() {
  return (
    <AdminShell activeHref="/admin/accounts">
      <AccountsView />
    </AdminShell>
  )
}
