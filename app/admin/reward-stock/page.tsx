'use client'

import { useMemo, useState } from 'react'
import AdminShell from '@/components/dashboard/AdminShell'
import {
  Badge,
  LabeledSolidSelect,
  PageTitle,
  SearchInput,
  STATUS_COLORS,
  TableFooter,
  outlineBtn,
} from '@/components/dashboard/admin-ui'
import { STOCK_FULL_LEVEL } from '@/lib/db/constants'
import type { RewardStockRow } from '@/lib/db/types'
import { ADMIN_COLORS } from '@/lib/admin-tokens'
import { fontStyle } from '@/lib/design-tokens'
import { useAdminList } from '@/lib/use-admin-list'

type Level = 'ไม่จำกัด' | 'หมด' | 'น้อยมาก' | 'เหลือน้อย' | 'ปกติ'

const LEVEL_STYLE: Record<Level, { pill: string; bar: string; text: string }> = {
  ไม่จำกัด: { pill: ADMIN_COLORS.navy, bar: ADMIN_COLORS.navy, text: ADMIN_COLORS.navy },
  หมด: { pill: STATUS_COLORS.red, bar: '#e8453c', text: STATUS_COLORS.red },
  น้อยมาก: { pill: STATUS_COLORS.red, bar: '#e8453c', text: STATUS_COLORS.red },
  เหลือน้อย: { pill: STATUS_COLORS.yellow, bar: STATUS_COLORS.yellow, text: STATUS_COLORS.yellow },
  ปกติ: { pill: STATUS_COLORS.green, bar: STATUS_COLORS.green, text: STATUS_COLORS.green },
}

/** rewards.stock เป็น null = ไม่จำกัดจำนวน; เปอร์เซ็นต์อ้างอิงจาก STOCK_FULL_LEVEL (schema ไม่มีคอลัมน์สต๊อกสูงสุด) */
function levelOf(stock: number | null): { level: Level; pct: number } {
  if (stock === null) return { level: 'ไม่จำกัด', pct: 100 }
  const pct = Math.min(100, Math.round((stock / STOCK_FULL_LEVEL) * 100))
  if (stock <= 0) return { level: 'หมด', pct: 0 }
  if (pct < 25) return { level: 'น้อยมาก', pct }
  if (pct < 60) return { level: 'เหลือน้อย', pct }
  return { level: 'ปกติ', pct }
}

const STATUS_OPTIONS = ['ทั้งหมด', 'ปกติ', 'เหลือน้อย', 'น้อยมาก', 'หมด', 'ไม่จำกัด']
const SORT_OPTIONS = ['ล่าสุด', 'คงเหลือน้อยไปมาก', 'คงเหลือมากไปน้อย']
const PAGE = 7

function Thumb({ src, dim }: { src: string; dim?: boolean }) {
  const isUrl = src.startsWith('http') || src.startsWith('/')
  return (
    <div
      aria-hidden
      style={{
        width: 44,
        height: 44,
        borderRadius: 8,
        background: 'linear-gradient(135deg, #f6a15b, #e4763a)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 22,
        flexShrink: 0,
        opacity: dim ? 0.6 : 1,
        overflow: 'hidden',
      }}
    >
      {isUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        '📦'
      )}
    </div>
  )
}

export default function RewardStockPage() {
  const list = useAdminList<RewardStockRow>('/api/admin/reward-stock', { page: 1, pageSize: 100 })
  /** ค่าสต๊อกที่แก้ไขแล้วแต่ยังไม่บันทึก: id → จำนวน */
  const [edits, setEdits] = useState<Record<number, number>>({})
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('ทั้งหมด')
  const [sortBy, setSortBy] = useState('ล่าสุด')
  const [page, setPage] = useState(1)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const stockOf = (r: RewardStockRow) => (r.id in edits ? edits[r.id] : r.stock)
  const dirty = Object.keys(edits).length > 0

  const filtered = useMemo(() => {
    const rows = list.rows.filter((r) => {
      if (query && !r.name.includes(query)) return false
      return statusFilter === 'ทั้งหมด' || levelOf(r.id in edits ? edits[r.id] : r.stock).level === statusFilter
    })
    const s = (r: RewardStockRow) => (r.id in edits ? edits[r.id] : r.stock)
    if (sortBy === 'คงเหลือน้อยไปมาก') rows.sort((a, b) => (s(a) ?? Infinity) - (s(b) ?? Infinity))
    if (sortBy === 'คงเหลือมากไปน้อย') rows.sort((a, b) => (s(b) ?? -1) - (s(a) ?? -1))
    return rows
  }, [list.rows, edits, query, statusFilter, sortBy])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE))
  const visible = filtered.slice((page - 1) * PAGE, page * PAGE)

  const setStock = (r: RewardStockRow, value: string) => {
    const n = Math.max(0, Math.floor(Number(value) || 0))
    setEdits((prev) => {
      const next = { ...prev }
      if (n === r.stock) delete next[r.id]
      else next[r.id] = n
      return next
    })
  }

  const save = async () => {
    setSaving(true)
    setSaveError(null)
    try {
      const res = await fetch('/api/admin/reward-stock', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates: Object.entries(edits).map(([id, stock]) => ({ id: Number(id), stock })) }),
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

  const headStyle = { textAlign: 'left', padding: '0 16px', fontWeight: 600, borderRight: '1px solid rgba(255,255,255,0.15)' } as const
  const cellStyle = { padding: '0 16px', borderRight: '1px solid #e2e5ee', fontWeight: 600, fontSize: 18 } as const

  return (
    <AdminShell activeHref="/admin/reward-stock">
      <PageTitle
        title="จัดการสต๊อก"
        subtitle="จัดการจำนวนและสถานะของรางวัล"
        right={
          <button type="button" className="flex items-center" style={{ ...outlineBtn, height: 50, gap: 10, fontSize: 17 }}>
            <span style={{ fontSize: 26, fontWeight: 400, lineHeight: 1 }}>+</span>
            เพิ่มของรางวัล
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
          placeholder="ค้นหาของรางวัล"
        />
        <div className="flex items-center" style={{ gap: 40 }}>
          <LabeledSolidSelect label="สถานะ" value={statusFilter} options={STATUS_OPTIONS} onChange={(v) => { setStatusFilter(v); setPage(1) }} />
          <LabeledSolidSelect label="จัดเรียงตาม" value={sortBy} options={SORT_OPTIONS} onChange={setSortBy} />
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
              <th style={{ ...headStyle, width: '32%' }}>ของรางวัล</th>
              <th style={{ ...headStyle, width: '12.5%' }}>คงเหลือ</th>
              <th style={{ ...headStyle, width: '9.5%' }}>จองแล้ว</th>
              <th style={{ ...headStyle, borderRight: 'none' }}>สถานะ</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((r) => {
              const stock = stockOf(r)
              const { level, pct } = levelOf(stock)
              const st = LEVEL_STYLE[level]
              const out = level === 'หมด'
              return (
                <tr
                  key={r.id}
                  style={{ height: 98, borderBottom: '1px solid #e2e5ee', backgroundColor: out ? '#f5f5f5' : '#ffffff', color: out ? '#9aa3c0' : '#111' }}
                >
                  <td style={cellStyle}>
                    <div className="flex items-center" style={{ gap: 20 }}>
                      <Thumb src={r.image_path} dim={out} />
                      <span style={{ color: out ? '#9aa3c0' : ADMIN_COLORS.navy }}>{r.name}</span>
                    </div>
                  </td>
                  <td style={cellStyle}>
                    {stock === null ? (
                      '∞'
                    ) : (
                      <input
                        type="number"
                        min={0}
                        value={stock}
                        onChange={(e) => setStock(r, e.target.value)}
                        aria-label={`คงเหลือ ${r.name}`}
                        style={{ width: 80, border: 'none', background: 'transparent', color: 'inherit', fontSize: 18, fontWeight: 600, outline: 'none', ...fontStyle }}
                      />
                    )}
                  </td>
                  <td style={cellStyle}>{r.reserved}</td>
                  <td style={{ padding: '0 24px 0 16px' }}>
                    <div style={{ height: 10, borderRadius: 999, backgroundColor: '#fadadd', overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', borderRadius: 999, backgroundColor: st.bar }} />
                    </div>
                    <div className="flex items-center" style={{ gap: 12, marginTop: 8 }}>
                      {stock !== null && <span style={{ color: st.text, fontSize: 17, fontWeight: 600 }}>{pct}%</span>}
                      <Badge color={st.pill}>{level}</Badge>
                    </div>
                  </td>
                </tr>
              )
            })}
            {visible.length === 0 && (
              <tr>
                <td colSpan={4} style={{ padding: 30, textAlign: 'center', color: '#8a8fa0' }}>
                  {list.loading ? 'กำลังโหลด...' : 'ไม่พบของรางวัล'}
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
        dirty={dirty && !saving}
        onSave={save}
      />
    </AdminShell>
  )
}
