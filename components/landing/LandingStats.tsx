'use client'

import Image from 'next/image'
import { ReactNode, useEffect, useMemo, useState } from 'react'
import { KG_CO2_PER_TREE } from '@/lib/db/constants'

interface PublicStats {
  users: number
  totalWeightKg: number
  totalCo2Kg: number
}

const DEEP = '#154212'
const fmt = (n: number) => Math.round(n).toLocaleString('th-TH')

/* ───────────── การ์ดตัวเลข ───────────── */

function Wave({ color }: { color: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 200 60"
      preserveAspectRatio="none"
      className="pointer-events-none absolute inset-x-0 top-0 h-[55%] w-full opacity-80"
    >
      <path d="M0 40 C25 10 45 5 70 18 C95 31 110 40 135 22 C160 4 180 10 200 28 V0 H0 Z" fill={color} />
    </svg>
  )
}

function Card({
  bg,
  wave,
  iconBg,
  icon,
  label,
  value,
  unit,
}: {
  bg: string
  wave: string
  iconBg: string
  icon: ReactNode
  label: string
  value: string
  unit: string
}) {
  return (
    <div className="relative flex min-h-[124px] flex-col justify-end overflow-hidden rounded-xl p-4 md:min-h-[140px]" style={{ backgroundColor: bg }}>
      <Wave color={wave} />
      <span className="absolute left-4 top-4 flex h-7 w-7 items-center justify-center rounded-full text-white" style={{ backgroundColor: iconBg }}>
        {icon}
      </span>
      <div className="relative text-[12px] font-semibold leading-tight text-[#1c2a1a]/80 md:text-[13px]">{label}</div>
      <div className="relative text-[22px] font-semibold leading-tight text-[#1c2a1a] md:text-[26px]">
        {value} <span className="text-[13px] font-medium">{unit}</span>
      </div>
    </div>
  )
}

const svgProps = {
  width: 16,
  height: 16,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
}

/* ───────────── ภาพต้นไม้บนเนินเขา ───────────── */

/** ขนาดภาพเนินเขา (px) — ใช้คำนวณตำแหน่งต้นไม้เป็นสัดส่วน */
const HILL_W = 636
const HILL_H = 407
/** จำนวนต้นไม้สูงสุดที่วาดบนภาพ ถ้าเกินจะให้ 1 ต้นในภาพแทนหลายต้นจริง */
const MAX_ICONS = 36

/** แถวต้นไม้จากไกลไปใกล้: ระดับความสูงของฐานต้น (สัดส่วนของภาพ) และขนาดต้น */
const ROWS = [
  { base: 0.72, width: 0.05 },
  { base: 0.82, width: 0.062 },
  { base: 0.92, width: 0.075 },
]

/** ครึ่งความกว้างของเนินที่ระดับ y (วงรีสูง 130px ฐานอยู่ที่ก้นภาพ) */
function hillHalfWidth(yRatio: number): number {
  const dy = HILL_H - yRatio * HILL_H
  const k = Math.max(0, 1 - (dy / 130) ** 2)
  return (HILL_W / 2) * Math.sqrt(k)
}

interface Placed {
  key: string
  x: number // กึ่งกลางต้น เป็น % ของความกว้างภาพ
  y: number // ฐานต้น เป็น % ของความสูงภาพ
  w: number // ความกว้างต้น เป็น % ของความกว้างภาพ
  variant: 1 | 2
}

function layoutTrees(count: number): Placed[] {
  if (count <= 0) return []
  const widths = ROWS.map((r) => hillHalfWidth(r.base) * 2 * 0.86)
  const totalW = widths.reduce((a, b) => a + b, 0)
  // แบ่งจำนวนต้นให้แต่ละแถวตามความกว้างของเนิน
  const perRow = widths.map((w) => Math.floor((count * w) / totalW))
  let rest = count - perRow.reduce((a, b) => a + b, 0)
  for (let i = ROWS.length - 1; rest > 0; i = (i + ROWS.length - 1) % ROWS.length, rest--) perRow[i]++

  const out: Placed[] = []
  ROWS.forEach((row, r) => {
    const n = perRow[r]
    const span = widths[r]
    for (let i = 0; i < n; i++) {
      // กระจายเท่า ๆ กันพร้อมขยับเล็กน้อยแบบคงที่ให้ดูเป็นธรรมชาติ (ไม่ใช้ random เพื่อไม่ให้ผล SSR/CSR ต่างกัน)
      const t = n === 1 ? 0.5 : i / (n - 1)
      const jitter = (((i * 7 + r * 3) % 5) - 2) * 0.004
      const x = ((HILL_W / 2 - span / 2 + t * span) / HILL_W + jitter) * 100
      out.push({ key: `${r}-${i}`, x, y: row.base * 100, w: row.width * 100, variant: (i + r) % 2 === 0 ? 1 : 2 })
    }
  })
  return out
}

function TreeVisual({ trees }: { trees: number | null }) {
  const icons = trees === null ? 0 : Math.min(MAX_ICONS, Math.max(trees > 0 ? 1 : 0, Math.round(trees)))
  const perIcon = trees !== null && trees > MAX_ICONS ? Math.ceil(trees / MAX_ICONS) : 1
  const drawn = trees !== null && trees > MAX_ICONS ? Math.round(trees / perIcon) : icons
  const placed = useMemo(() => layoutTrees(drawn), [drawn])

  return (
    <div className="rounded-2xl bg-[#f3fce8] px-4 pt-5 text-center">
      <div className="text-sm font-semibold text-[#2f7d32]">ปริมาณคาร์บอนที่ลดได้ เทียบเท่าต้นไม้</div>
      <div className="mt-1 text-4xl font-bold md:text-5xl" style={{ color: DEEP }}>
        {trees === null ? '—' : fmt(trees)} <span className="text-2xl font-semibold">ต้น</span>
      </div>
      {perIcon > 1 && (
        <div className="mt-1 text-xs text-[#2f7d32]">ในภาพ 1 ต้น แทนต้นไม้จริงประมาณ {fmt(perIcon)} ต้น</div>
      )}

      <div
        className="relative mx-auto mt-2 w-full max-w-[760px]"
        style={{ aspectRatio: `${HILL_W} / ${HILL_H}`, backgroundImage: 'url(/landing/hill.png)', backgroundSize: '100% 100%' }}
        role="img"
        aria-label={trees === null ? 'ต้นไม้เทียบเท่า' : `ต้นไม้เทียบเท่าประมาณ ${fmt(trees)} ต้น`}
      >
        {placed.map((p) => (
          <Image
            key={p.key}
            src={p.variant === 1 ? '/landing/tree-1.png' : '/landing/tree-2.png'}
            alt=""
            aria-hidden
            width={p.variant === 1 ? 185 : 132}
            height={p.variant === 1 ? 209 : 175}
            className="absolute h-auto -translate-x-1/2 -translate-y-full"
            style={{ left: `${p.x}%`, top: `${p.y}%`, width: `${p.w}%` }}
          />
        ))}
      </div>
    </div>
  )
}

/* ───────────── ส่วนที่ใช้ในหน้าแรก ───────────── */

const EXPLAIN: { title: string; text: string }[] = [
  {
    title: 'ขยะสะสม (kg)',
    text: 'น้ำหนักรวมของขยะรีไซเคิลที่ผู้ใช้บันทึกผ่านน้องรักษ์ ตั้งแต่เริ่มโครงการจนถึงปัจจุบัน',
  },
  {
    title: 'ลดก๊าซเรือนกระจก (kgCO₂e)',
    text: 'ปริมาณก๊าซเรือนกระจกที่ลดได้จากการนำขยะไปรีไซเคิลแทนการทิ้ง คำนวณจากน้ำหนักขยะแต่ละประเภทคูณค่าสัมประสิทธิ์คาร์บอนของประเภทนั้น',
  },
  {
    title: 'ผู้ใช้งาน (คน)',
    text: 'จำนวนคนที่ลงทะเบียนใช้งานน้องรักษ์',
  },
  {
    title: 'ต้นไม้เทียบเท่า (ต้น)',
    text: `แปลงยอดก๊าซเรือนกระจกที่ลดได้ให้จับต้องง่ายขึ้น โดยหารด้วย ${KG_CO2_PER_TREE} (ต้นไม้ 1 ต้นดูดซับคาร์บอนได้ประมาณ ${KG_CO2_PER_TREE} kgCO₂) เป็นค่าประมาณ ไม่ใช่จำนวนต้นไม้ที่ปลูกจริง`,
  },
]

export default function LandingStats() {
  const [stats, setStats] = useState<PublicStats | null>(null)

  useEffect(() => {
    fetch('/api/public/stats')
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => json && setStats(json as PublicStats))
      .catch(() => {})
  }, [])

  const show = (n: number | undefined) => (n === undefined ? '—' : fmt(n))
  const trees = stats ? stats.totalCo2Kg / KG_CO2_PER_TREE : null

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">
        <Card
          bg="#d6f3b7"
          wave="#e5f9cf"
          iconBg="#7cc93a"
          icon={<svg {...svgProps}><path d="M7 19H4l3-5M17 5h3l-3 5M12 3l-2 4h4zM9 21l3-5 3 5z" /></svg>}
          label="ขยะรีไซเคิลสะสม"
          value={show(stats?.totalWeightKg)}
          unit="kg"
        />
        <Card
          bg="#fde2de"
          wave="#fff0ee"
          iconBg="#ef8a7f"
          icon={<svg {...svgProps}><path d="M7 19H4l3-5M17 5h3l-3 5M12 3l-2 4h4zM9 21l3-5 3 5z" /></svg>}
          label="ลดก๊าซเรือนกระจก"
          value={show(stats?.totalCo2Kg)}
          unit="kgCO₂e"
        />
        <Card
          bg="#ddf1fb"
          wave="#ecf8fe"
          iconBg="#48a6df"
          icon={<svg {...svgProps}><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></svg>}
          label="ผู้ใช้งาน"
          value={show(stats?.users)}
          unit="คน"
        />
        <Card
          bg="#fdf1cf"
          wave="#fff8e3"
          iconBg="#e8c445"
          icon={<svg {...svgProps}><path d="M12 22v-8M12 14c-4 0-6-3-6-7 4 0 6 3 6 7zM12 14c4 0 6-3 6-7-4 0-6 3-6 7z" /></svg>}
          label="ต้นไม้เทียบเท่า"
          value={trees === null ? '—' : fmt(trees)}
          unit="ต้น"
        />
      </div>

      <TreeVisual trees={trees} />

      <div className="rounded-xl border border-[#cfe9b6] p-4 md:p-5">
        <h3 className="text-base font-bold md:text-lg" style={{ color: DEEP }}>ตัวเลขเหล่านี้คืออะไร</h3>
        <p className="mt-1 text-[13px] text-[#2f7d32]">สรุปจากข้อมูลที่ผู้ใช้บันทึกไว้ในระบบน้องรักษ์ ทั้งหมดเป็นยอดรวม ไม่ระบุตัวบุคคล</p>
        <dl className="mt-3 grid gap-3 md:grid-cols-2">
          {EXPLAIN.map((e) => (
            <div key={e.title}>
              <dt className="text-sm font-bold" style={{ color: DEEP }}>{e.title}</dt>
              <dd className="mt-0.5 text-[13px] leading-6 text-[#2f7d32]">{e.text}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  )
}
