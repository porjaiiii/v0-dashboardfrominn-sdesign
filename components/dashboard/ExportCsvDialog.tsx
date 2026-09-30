'use client'

import { useEffect, useRef, useState } from 'react'
import { ADMIN_COLORS } from '@/lib/admin-tokens'
import { fontStyle } from '@/lib/design-tokens'

export interface ExportRange {
  /** YYYY-MM-DD (ว่าง = ไม่จำกัด) */
  from: string
  to: string
  includeDeleted: boolean
}

interface Props {
  open: boolean
  onClose: () => void
  /** เรียกเมื่อกด "ส่งออก CSV" — ควรดึงข้อมูลตามช่วงที่เลือกแล้วดาวน์โหลดไฟล์ */
  onExport: (range: ExportRange) => Promise<void>
  /** แสดงช่อง "รวมข้อมูลที่ถูกลบแล้ว" */
  showIncludeDeleted?: boolean
}

type Preset = '7d' | '30d' | '3m' | 'all'

const PRESETS: { key: Preset; label: string }[] = [
  { key: '7d', label: '7 วันล่าสุด' },
  { key: '30d', label: '30 วันล่าสุด' },
  { key: '3m', label: '3 เดือนล่าสุด' },
  { key: 'all', label: 'ทั้งหมด' },
]

const pad = (n: number) => String(n).padStart(2, '0')
const toIsoDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

/** YYYY-MM-DD → dd/mm/yyyy (พ.ศ.) */
function formatBe(iso: string): string {
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${Number(y) + 543}`
}

function rangeFor(preset: Preset): { from: string; to: string } {
  if (preset === 'all') return { from: '', to: '' }
  const to = new Date()
  const from = new Date()
  if (preset === '7d') from.setDate(from.getDate() - 6)
  if (preset === '30d') from.setDate(from.getDate() - 29)
  if (preset === '3m') from.setMonth(from.getMonth() - 3)
  return { from: toIsoDate(from), to: toIsoDate(to) }
}

function CalendarIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#6b7397" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
    </svg>
  )
}

function DateField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  const ref = useRef<HTMLInputElement>(null)
  const id = `export-${label}`
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <label htmlFor={id} style={{ display: 'block', color: ADMIN_COLORS.navy, fontSize: 18, fontWeight: 600, marginBottom: 10 }}>
        {label}
      </label>
      <div
        className="flex items-center justify-between"
        style={{
          position: 'relative',
          height: 56,
          padding: '0 16px',
          borderRadius: 12,
          border: '1.5px solid #d5d9e4',
          backgroundColor: '#f8f9fc',
          color: value ? ADMIN_COLORS.navy : '#8a8fa0',
          fontSize: 18,
          cursor: 'pointer',
        }}
        onClick={() => ref.current?.showPicker?.()}
      >
        <span>{value ? formatBe(value) : 'ไม่จำกัด'}</span>
        <CalendarIcon />
        {/* input จริงซ้อนอยู่ด้านบนแบบโปร่งใส เพื่อใช้ปฏิทินของเบราว์เซอร์แต่แสดงวันที่เป็น พ.ศ. ตามแบบ */}
        <input
          ref={ref}
          id={id}
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{ position: 'absolute', inset: 0, opacity: 0, width: '100%', cursor: 'pointer' }}
        />
      </div>
    </div>
  )
}

export default function ExportCsvDialog({ open, onClose, onExport, showIncludeDeleted = false }: Props) {
  const [preset, setPreset] = useState<Preset | null>('all')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [includeDeleted, setIncludeDeleted] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ปิดด้วยปุ่ม Esc
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !busy && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, busy, onClose])

  if (!open) return null

  const pick = (p: Preset) => {
    const r = rangeFor(p)
    setPreset(p)
    setFrom(r.from)
    setTo(r.to)
    setError(null)
  }

  const edit = (which: 'from' | 'to', v: string) => {
    setPreset(null)
    setError(null)
    if (which === 'from') setFrom(v)
    else setTo(v)
  }

  const submit = async () => {
    if (from && to && from > to) {
      setError('วันที่เริ่มต้นต้องไม่เกินวันที่สิ้นสุด')
      return
    }
    setBusy(true)
    setError(null)
    try {
      await onExport({ from, to, includeDeleted })
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'ส่งออกไม่สำเร็จ')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      role="presentation"
      onClick={() => !busy && onClose()}
      className="flex items-center justify-center"
      style={{ position: 'fixed', inset: 0, zIndex: 200, backgroundColor: 'rgba(8,25,90,0.35)', padding: 16 }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-title"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 520,
          maxHeight: '100%',
          overflowY: 'auto',
          backgroundColor: '#ffffff',
          borderRadius: 22,
          boxShadow: '0 12px 48px rgba(8,25,90,0.25)',
          padding: '30px 32px 32px',
          ...fontStyle,
        }}
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 id="export-title" style={{ color: ADMIN_COLORS.navy, fontSize: 28, fontWeight: 700, margin: 0 }}>
              ส่งออกข้อมูล CSV
            </h2>
            <p style={{ color: '#7a819e', fontSize: 17, margin: '8px 0 0' }}>เลือกช่วงเวลาที่ต้องการส่งออก</p>
          </div>
          <button
            type="button"
            aria-label="ปิด"
            onClick={onClose}
            disabled={busy}
            className="flex items-center justify-center"
            style={{ width: 48, height: 48, borderRadius: '50%', border: 'none', backgroundColor: '#eef1f8', cursor: 'pointer', flexShrink: 0 }}
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={ADMIN_COLORS.navy} strokeWidth="2.2" strokeLinecap="round" aria-hidden>
              <circle cx="12" cy="12" r="9" />
              <path d="M9 9l6 6M15 9l-6 6" />
            </svg>
          </button>
        </div>

        <div className="flex" style={{ gap: 20, marginTop: 26 }}>
          <DateField label="วันที่เริ่มต้น" value={from} onChange={(v) => edit('from', v)} />
          <DateField label="วันที่สิ้นสุด" value={to} onChange={(v) => edit('to', v)} />
        </div>

        <div style={{ color: ADMIN_COLORS.navy, fontSize: 18, fontWeight: 600, margin: '26px 0 12px' }}>ตัวเลือกด่วน</div>
        <div className="flex" style={{ gap: 10, flexWrap: 'wrap' }}>
          {PRESETS.map((p) => {
            const active = preset === p.key
            return (
              <button
                key={p.key}
                type="button"
                onClick={() => pick(p.key)}
                style={{
                  height: 44,
                  padding: '0 18px',
                  borderRadius: 12,
                  border: `1.5px solid ${active ? ADMIN_COLORS.navy : '#d5d9e4'}`,
                  backgroundColor: active ? ADMIN_COLORS.navy : '#ffffff',
                  color: active ? '#ffffff' : ADMIN_COLORS.navy,
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: 'pointer',
                  ...fontStyle,
                }}
              >
                {p.label}
              </button>
            )
          })}
        </div>

        {showIncludeDeleted && (
          <label className="flex items-center" style={{ gap: 14, marginTop: 26, cursor: 'pointer', color: ADMIN_COLORS.navy, fontSize: 19, fontWeight: 600 }}>
            <input
              type="checkbox"
              checked={includeDeleted}
              onChange={(e) => setIncludeDeleted(e.target.checked)}
              style={{ width: 24, height: 24, accentColor: ADMIN_COLORS.cardIcon, cursor: 'pointer' }}
            />
            รวมข้อมูลที่ถูกลบแล้ว
          </label>
        )}

        {error && (
          <p role="alert" style={{ color: '#b02e0d', fontSize: 15, fontWeight: 600, margin: '16px 0 0' }}>
            {error}
          </p>
        )}

        <div className="flex" style={{ gap: 16, marginTop: 30 }}>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            style={{
              flex: 1,
              height: 60,
              borderRadius: 12,
              border: '1.5px solid #d5d9e4',
              backgroundColor: '#ffffff',
              color: '#5a6079',
              fontSize: 19,
              fontWeight: 600,
              cursor: 'pointer',
              ...fontStyle,
            }}
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={busy}
            className="flex items-center justify-center"
            style={{
              flex: 1,
              height: 60,
              gap: 10,
              borderRadius: 12,
              border: 'none',
              backgroundColor: ADMIN_COLORS.navy,
              color: '#ffffff',
              fontSize: 19,
              fontWeight: 600,
              cursor: busy ? 'default' : 'pointer',
              opacity: busy ? 0.7 : 1,
              ...fontStyle,
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M12 4v11M7 11l5 5 5-5M4 20h16" />
            </svg>
            {busy ? 'กำลังส่งออก...' : 'ส่งออก CSV'}
          </button>
        </div>
      </div>
    </div>
  )
}
