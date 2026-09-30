'use client'

import { useState } from 'react'
import AdminShell from '@/components/dashboard/AdminShell'
import {
  Badge,
  Column,
  CsvButton,
  DataTable,
  PageTitle,
  PlainSelect,
  SectionTitle,
  STATUS_COLORS,
  SummaryCard,
  downloadCsv,
} from '@/components/dashboard/admin-ui'
import { ALL_SUBDISTRICTS, SUBDISTRICTS } from '@/lib/db/constants'
import type { DashboardSummary, WasteRecord, WasteRecordStatus } from '@/lib/db/types'
import { toBuDateTime, useAdminFetch, useAdminList } from '@/lib/use-admin-list'

type Status = 'อนุมัติ' | 'รอตรวจสอบ' | 'ถูกลบ'

/** app.waste_records.status → คำที่แสดง */
const STATUS_LABEL: Record<WasteRecordStatus, Status> = {
  done: 'อนุมัติ',
  pending: 'รอตรวจสอบ',
  cancelled: 'ถูกลบ',
}

const STATUS_COLOR: Record<Status, string> = {
  อนุมัติ: STATUS_COLORS.green,
  รอตรวจสอบ: STATUS_COLORS.yellow,
  ถูกลบ: STATUS_COLORS.red,
}

interface Row {
  id: number
  line_user_id: string
  waste_type_id: string
  weight_kg: string
  carbon: string
  points: number
  status: Status
  recorded_at: string
  is_legacy: string
  updated_at: string
}

const toRow = (r: WasteRecord): Row => ({
  id: r.id,
  line_user_id: r.line_user_id,
  waste_type_id: r.waste_type_id,
  weight_kg: r.weight_kg === null ? '-' : String(r.weight_kg),
  carbon: Number(r.carbon_reduction_kg).toFixed(2),
  points: r.points_earned,
  status: STATUS_LABEL[r.status],
  recorded_at: toBuDateTime(r.recorded_at),
  is_legacy: String(r.is_legacy),
  updated_at: toBuDateTime(r.updated_at),
})

const COLUMNS: Column<Row>[] = [
  { key: 'id', label: 'id' },
  { key: 'line_user_id', label: 'line_user_id' },
  { key: 'waste_type_id', label: 'waste_type_id' },
  { key: 'weight_kg', label: 'weight_kg' },
  { key: 'carbon', label: 'carbon' },
  { key: 'points', label: 'points' },
  {
    key: 'status',
    label: 'status',
    render: (row) => <Badge color={STATUS_COLOR[row.status]}>{row.status}</Badge>,
  },
  { key: 'recorded_at', label: 'recorded_at' },
  { key: 'is_legacy', label: 'is_legacy' },
  { key: 'updated_at', label: 'updated_at' },
  {
    key: 'menu',
    label: '⋮',
    render: () => (
      <button type="button" aria-label="เมนู" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666', fontSize: 16 }}>
        ⋮
      </button>
    ),
  },
]

const SORT_KEYS: Record<string, string> = { วันเวลา: 'time', น้ำหนัก: 'weight', คะแนน: 'points' }
const PAGE = 12

export default function WasteRecordsPage() {
  const [page, setPage] = useState(1)
  const [sortBy, setSortBy] = useState('วันเวลา')
  const [tambon, setTambon] = useState(ALL_SUBDISTRICTS)

  const list = useAdminList<WasteRecord>('/api/admin/waste-records', {
    page,
    pageSize: PAGE,
    sort: SORT_KEYS[sortBy],
    subdistrict: tambon === ALL_SUBDISTRICTS ? undefined : tambon,
  })
  const { data: summary } = useAdminFetch<DashboardSummary>('/api/admin/summary')
  const rows = list.rows.map(toRow)

  const exportCsv = () =>
    downloadCsv(
      'waste-records.csv',
      COLUMNS.slice(0, -1).map((c) => c.label),
      rows.map((r) => [r.id, r.line_user_id, r.waste_type_id, r.weight_kg, r.carbon, r.points, r.status, r.recorded_at, r.is_legacy, r.updated_at]),
    )

  const fmt = (n: number | undefined) =>
    n === undefined ? '...' : n.toLocaleString('th-TH', { maximumFractionDigits: 1 })

  return (
    <AdminShell activeHref="/admin/waste-records">
      <PageTitle title="รายการบันทึกขยะ" />

      <div className="flex" style={{ gap: 26 }}>
        <SummaryCard label="ขยะสะสม" value={fmt(summary?.totalWeightKg)} unit="kg" inline height={110} />
        <SummaryCard label="ลด CO₂" value={fmt(summary?.totalCo2Kg)} unit="kgCO₂" inline height={110} />
      </div>

      <div className="flex items-center justify-between" style={{ margin: '8px 0 10px' }}>
        <SectionTitle>รายการบันทึกขยะ</SectionTitle>
        <div className="flex items-center" style={{ gap: 40 }}>
          <PlainSelect
            label="เรียงตาม :"
            value={sortBy}
            options={Object.keys(SORT_KEYS)}
            onChange={(v) => {
              setSortBy(v)
              setPage(1)
            }}
          />
          <PlainSelect
            label="ตำบล"
            value={tambon}
            options={[ALL_SUBDISTRICTS, ...SUBDISTRICTS]}
            onChange={(v) => {
              setTambon(v)
              setPage(1)
            }}
          />
          <CsvButton onClick={exportCsv} />
        </div>
      </div>

      {list.error && (
        <p role="alert" style={{ color: '#b02e0d', fontWeight: 600 }}>
          โหลดข้อมูลไม่สำเร็จ: {list.error}
        </p>
      )}

      <div style={{ opacity: list.loading ? 0.6 : 1, transition: 'opacity .15s' }}>
        <DataTable
          columns={COLUMNS}
          rows={rows}
          rowKey={(row) => String(row.id)}
          total={list.total}
          pageSize={PAGE}
          pageCount={Math.max(1, Math.ceil(list.total / PAGE))}
          page={page}
          onPage={setPage}
        />
      </div>
    </AdminShell>
  )
}
