'use client'

import { useState } from 'react'
import AdminShell from '@/components/dashboard/AdminShell'
import {
  Column,
  CsvButton,
  DataTable,
  PageTitle,
  PlainSelect,
  SectionTitle,
  SummaryCard,
  downloadCsv,
} from '@/components/dashboard/admin-ui'
import { ALL_SUBDISTRICTS, PAGE_SIZE, SUBDISTRICTS } from '@/lib/db/constants'
import type { User } from '@/lib/db/types'
import ExportCsvDialog from '@/components/dashboard/ExportCsvDialog'
import { fetchAllRows, toBuDate, useAdminList } from '@/lib/use-admin-list'

interface Staff {
  line_user_id: string
  display_user_id: string
  full_name: string
  nickname: string
  phone_number: string
  gender: string
  age_range: string
  user_type: string
  subdistrict: string
  registered_at: string
  is_legacy: string
}

const dash = (v: string | null) => v || '-'

/** app.users (ที่มี admin_keys.status = 'active') → แถวในตาราง */
function toStaff(u: User): Staff {
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
  'registered_at',
  'is_legacy',
] as const

const COLUMNS: Column<Staff>[] = KEYS.map((k) => ({ key: k, label: k }))

const SORT_KEYS: Record<string, string> = { อายุ: 'age', ชื่อ: 'name', วันที่ลงทะเบียน: 'registered' }

export default function StaffPage() {
  const [page, setPage] = useState(1)
  const [sortBy, setSortBy] = useState('อายุ')
  const [tambon, setTambon] = useState(ALL_SUBDISTRICTS)
  const [exportOpen, setExportOpen] = useState(false)

  const list = useAdminList<User>('/api/admin/staff', {
    page,
    pageSize: PAGE_SIZE,
    sort: SORT_KEYS[sortBy],
    subdistrict: tambon === ALL_SUBDISTRICTS ? undefined : tambon,
  })
  const rows = list.rows.map(toStaff)

  return (
    <AdminShell activeHref="/admin/staff">
      <PageTitle title="จัดการ  Admin/เจ้าหน้าที่" subtitle="รายชื่อเจ้าหน้าที่ในระบบ" />

      <div className="flex">
        <SummaryCard
          label="เจ้าหน้าที่ทั้งหมด"
          value={list.total.toLocaleString('th-TH')}
          unit="บัญชี"
          unitColor="#154212"
          height={118}
        />
      </div>

      <div className="flex items-center justify-between" style={{ margin: '8px 0 10px' }}>
        <SectionTitle>รายชื่อเจ้าหน้าที่</SectionTitle>
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
          <CsvButton onClick={() => setExportOpen(true)} />
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
          rowKey={(row) => row.line_user_id}
          total={list.total}
          pageSize={PAGE_SIZE}
          pageCount={Math.max(1, Math.ceil(list.total / PAGE_SIZE))}
          page={page}
          onPage={setPage}
        />
      </div>
      <ExportCsvDialog
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        onExport={async ({ from, to }) => {
          const all = await fetchAllRows<User>('/api/admin/staff', {
            sort: SORT_KEYS[sortBy],
            subdistrict: tambon === ALL_SUBDISTRICTS ? undefined : tambon,
            from,
            to,
          })
          downloadCsv(`staff_${from || 'all'}_${to || 'all'}.csv`, [...KEYS], all.map(toStaff).map((row) => KEYS.map((k) => row[k])))
        }}
      />
    </AdminShell>
  )
}
