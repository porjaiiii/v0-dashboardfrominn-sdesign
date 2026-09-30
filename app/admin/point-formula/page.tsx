'use client'

import { useMemo, useState } from 'react'
import AdminShell from '@/components/dashboard/AdminShell'
import {
  LabeledSolidSelect,
  PageTitle,
  PencilIcon,
  SearchInput,
  TableFooter,
  Toggle,
  outlineBtn,
} from '@/components/dashboard/admin-ui'
import type { FormulaRow } from '@/lib/db/types'
import { ADMIN_COLORS } from '@/lib/admin-tokens'
import { fontStyle } from '@/lib/design-tokens'
import { useAdminList } from '@/lib/use-admin-list'

const PAGE = 6
const rowId = (f: FormulaRow) => `${f.waste_type_id}:${f.waste_subtype_id}`

const STATUS_KEYS: Record<string, string | undefined> = { ทั้งหมด: undefined, เปิดใช้งาน: 'active', ปิดใช้งาน: 'inactive' }
const SORT_KEYS: Record<string, string | undefined> = { ล่าสุด: undefined, คะแนนน้อยไปมาก: 'points_asc', คะแนนมากไปน้อย: 'points_desc' }

const th = { textAlign: 'left', padding: '0 16px', fontWeight: 600, borderRight: '1px solid rgba(255,255,255,0.15)' } as const
const td = { padding: '0 16px', borderRight: '1px solid #e2e5ee', fontWeight: 600, fontSize: 18 } as const

export default function PointFormulaPage() {
  // สูตรมีไม่มาก โหลดทั้งหมดครั้งเดียวแล้วแบ่งหน้าฝั่ง client เพื่อให้สลับสวิตช์ค้างไว้ข้ามหน้าได้
  const list = useAdminList<FormulaRow>('/api/admin/formulas', { page: 1, pageSize: 100 })
  /** สถานะที่สลับแล้วแต่ยังไม่บันทึก: "type:subtype" → is_active */
  const [edits, setEdits] = useState<Record<string, boolean>>({})
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('ทั้งหมด')
  const [sortBy, setSortBy] = useState('ล่าสุด')
  const [page, setPage] = useState(1)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const activeOf = (f: FormulaRow) => (rowId(f) in edits ? edits[rowId(f)] : f.is_active)

  const filtered = useMemo(() => {
    const rows = list.rows.filter((f) => {
      if (query && !`${f.type_name}${f.subtype_name}`.includes(query)) return false
      const active = rowId(f) in edits ? edits[rowId(f)] : f.is_active
      if (status === 'เปิดใช้งาน') return active
      if (status === 'ปิดใช้งาน') return !active
      return true
    })
    if (SORT_KEYS[sortBy] === 'points_asc') rows.sort((a, b) => a.points_per_kg - b.points_per_kg)
    if (SORT_KEYS[sortBy] === 'points_desc') rows.sort((a, b) => b.points_per_kg - a.points_per_kg)
    return rows
  }, [list.rows, edits, query, status, sortBy])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE))
  const visible = filtered.slice((page - 1) * PAGE, page * PAGE)

  const toggle = (f: FormulaRow, value: boolean) =>
    setEdits((prev) => {
      const next = { ...prev }
      if (value === f.is_active) delete next[rowId(f)]
      else next[rowId(f)] = value
      return next
    })

  const save = async () => {
    setSaving(true)
    setSaveError(null)
    try {
      const updates = Object.entries(edits).map(([id, is_active]) => {
        const [waste_type_id, waste_subtype_id] = id.split(':')
        return { waste_type_id, waste_subtype_id, is_active }
      })
      const res = await fetch('/api/admin/formulas', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates }),
      })
      if (!res.ok) throw new Error((await res.json()).error || `HTTP ${res.status}`)
      setEdits({})
      list.reload()
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'บันทึกไม่สำเร็จ')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AdminShell activeHref="/admin/point-formula">
      <PageTitle
        title="สูตรคำนวณคะแนน"
        subtitle="จัดการสูตรคำนวณคะแนนสำหรับขยะแต่ละประเภท"
        right={
          <button type="button" style={{ ...outlineBtn, height: 50, fontSize: 17 }}>
            + เพิ่มสูตรใหม่
          </button>
        }
      />

      <div className="flex items-center justify-between" style={{ marginBottom: 12, gap: 20 }}>
        <SearchInput
          value={query}
          onChange={(v) => {
            setQuery(v)
            setPage(1)
          }}
          placeholder="ค้นหาสูตรคำนวณ"
        />
        <div className="flex items-center" style={{ gap: 40 }}>
          <LabeledSolidSelect label="สถานะ" value={status} options={Object.keys(STATUS_KEYS)} onChange={(v) => { setStatus(v); setPage(1) }} />
          <LabeledSolidSelect label="จัดเรียงตาม" value={sortBy} options={Object.keys(SORT_KEYS)} onChange={setSortBy} />
        </div>
      </div>

      {(list.error || saveError) && (
        <p role="alert" style={{ color: '#b02e0d', fontWeight: 600 }}>
          {list.error ? `โหลดข้อมูลไม่สำเร็จ: ${list.error}` : `บันทึกไม่สำเร็จ: ${saveError}`}
        </p>
      )}

      <div style={{ border: '1px solid #dfe3ee', borderRadius: 10, overflow: 'hidden', opacity: list.loading ? 0.6 : 1, ...fontStyle }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: ADMIN_COLORS.navy, color: '#ffffff', height: 62, fontSize: 16 }}>
              <th style={{ ...th, width: '18%' }}>ประเภทขยะ</th>
              <th style={{ ...th, width: '20%' }}>ประเภทย่อย</th>
              <th style={{ ...th, width: '14%' }}>คะแนน/กก.</th>
              <th style={{ ...th, width: '24%' }}>สูตรคำนวณ</th>
              <th style={{ ...th, width: '13%' }}>สถานะ</th>
              <th style={{ ...th, borderRight: 'none' }}>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((f, i) => (
              <tr key={rowId(f)} style={{ height: 98, borderBottom: '1px solid #e2e5ee', backgroundColor: i % 2 ? '#f5f5f5' : '#ffffff', color: ADMIN_COLORS.navy }}>
                <td style={td}>{f.type_name}</td>
                <td style={td}>{f.subtype_name}</td>
                <td style={td}>{f.points_per_kg} คะแนน</td>
                <td style={{ ...td, fontWeight: 500 }}>น้ำหนัก(กก.) × {f.points_per_kg}</td>
                <td style={td}>
                  <Toggle label={`สถานะ ${f.subtype_name}`} checked={activeOf(f)} onChange={(v) => toggle(f, v)} />
                </td>
                <td style={{ padding: '0 16px' }}>
                  <button type="button" aria-label={`แก้ไข ${f.subtype_name}`} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                    <PencilIcon />
                  </button>
                </td>
              </tr>
            ))}
            {visible.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: 30, textAlign: 'center', color: '#8a8fa0' }}>
                  {list.loading ? 'กำลังโหลด...' : 'ไม่พบสูตรคำนวณ'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <TableFooter
        shown={visible.length}
        total={filtered.length}
        pageCount={pageCount}
        page={page}
        onPage={setPage}
        dirty={Object.keys(edits).length > 0 && !saving}
        onSave={save}
      />
    </AdminShell>
  )
}
