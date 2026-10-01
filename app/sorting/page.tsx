import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import SiteNav from '@/components/landing/SiteNav'
import MascotBin from '@/components/landing/MascotBin'
import { CtaBanner, SiteFooter } from '@/components/landing/sections'
import { DEEP, LIME, photo } from '@/components/landing/shared'

export const metadata: Metadata = { title: 'แยกขยะ - Digital Waste' }

/**
 * รูปตัวอย่างขยะแต่ละชนิดวางที่ public/landing/sorting/ (ชื่อไฟล์ตามด้านล่าง)
 * ถ้ายังไม่มีไฟล์ จะแสดงเป็นวงกลมสีอ่อนแทน
 */

const iconProps = {
  width: 34,
  height: 34,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: '#154212',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
}

const STEPS: { label: string; icon: ReactNode }[] = [
  { label: 'แยกประเภท', icon: <svg {...iconProps}><rect x="3" y="3" width="8" height="8" rx="1.5" /><rect x="13" y="3" width="8" height="8" rx="1.5" /><rect x="3" y="13" width="8" height="8" rx="1.5" /><path d="M13 17h8M17 13v8" /></svg> },
  { label: 'ล้าง', icon: <svg {...iconProps}><path d="M12 3s6 6.5 6 11a6 6 0 01-12 0c0-4.5 6-11 6-11z" /></svg> },
  { label: 'ตากแห้ง', icon: <svg {...iconProps}><circle cx="12" cy="12" r="4" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2" /></svg> },
  { label: 'แยกชิ้นส่วน', icon: <svg {...iconProps}><path d="M9 3H5a2 2 0 00-2 2v4M15 3h4a2 2 0 012 2v4M9 21H5a2 2 0 01-2-2v-4M15 21h4a2 2 0 002-2v-4M9 12h6" /></svg> },
  { label: 'บีบ/พับ', icon: <svg {...iconProps}><path d="M4 12h6m0 0L7 9m3 3l-3 3M20 12h-6m0 0l3-3m-3 3l3 3M12 4v16" /></svg> },
  { label: 'แพ็กใส่ถุง', icon: <svg {...iconProps}><path d="M6 8h12l1 12H5L6 8zM9 8a3 3 0 016 0" /></svg> },
  { label: 'ชั่งน้ำหนัก', icon: <svg {...iconProps}><path d="M5 20h14M12 20V8M7 8h10M7 8l-3 6a3 3 0 006 0L7 8zM17 8l-3 6a3 3 0 006 0l-3-6z" /></svg> },
]

interface Item {
  label: string
  file: string
  /** เคล็ดลับเฉพาะรายการ (ถ้าไม่มี ใช้เคล็ดลับรวมของหมวด) */
  tip?: string
}

interface Category {
  no: number
  name: string
  sub: string
  items: Item[]
  /** เคล็ดลับรวมของหมวด */
  tip?: string
}

const CATEGORIES: Category[] = [
  {
    no: 1,
    name: 'พลาสติก',
    sub: '(ขวดใส, ขวดขุ่น, ฝาขวด)',
    items: [
      { label: 'ขวดพลาสติกใส', file: 'plastic-clear.jpg' },
      { label: 'ขวดพลาสติกขุ่น', file: 'plastic-cloudy.jpg' },
      { label: 'ฝาขวดพลาสติก', file: 'plastic-caps.jpg' },
    ],
    tip: 'ทำความสะอาด แกะฉลาก และแยกฝาออก',
  },
  {
    no: 2,
    name: 'แก้ว',
    sub: '(แก้วชนิดเดียว-ยกลัง, แก้วหลายชนิดรวมกัน)',
    items: [
      { label: 'แก้วชนิดเดียว (ยกลัง)', file: 'glass-crate.jpg', tip: 'ล้างให้สะอาด ตากแห้ง จัดเรียงให้ปลอดภัยป้องกันการแตก' },
      { label: 'แก้วหลายชนิดรวมกัน', file: 'glass-mixed.jpg', tip: 'ล้างให้สะอาด ตากแห้ง แยกประเภท และจัดเรียงให้ปลอดภัยป้องกันการแตก' },
    ],
  },
  {
    no: 3,
    name: 'กระดาษ',
    sub: '(กระดาษลัง, กระดาษขาว, หนังสือพิมพ์)',
    items: [
      { label: 'กระดาษลัง', file: 'paper-cardboard.jpg', tip: 'ระวังอย่าให้เปียก พับหรือมัดให้เรียบร้อยและนำเทปออก' },
      { label: 'กระดาษสีขาว', file: 'paper-white.jpg', tip: 'ระวังอย่าให้เปียก พับหรือ มัดให้เรียบร้อย' },
      { label: 'หนังสือพิมพ์', file: 'paper-news.jpg', tip: 'ระวังอย่าให้เปียก พับหรือ มัดให้เรียบร้อย' },
    ],
  },
  {
    no: 4,
    name: 'อลูมิเนียม',
    sub: '(กระป๋อง, ฝา, เศษอลูมิเนียมอื่น ๆ)',
    items: [
      { label: 'กระป๋องอลูมิเนียม', file: 'alu-cans.jpg' },
      { label: 'ฝาอลูมิเนียม', file: 'alu-lids.jpg' },
      { label: 'เศษอลูมิเนียมอื่น ๆ', file: 'alu-scrap.jpg' },
    ],
    tip: 'ล้างให้สะอาด ตากแห้ง และแยกกระป๋อง / ฝาออก',
  },
]

function Tip({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 rounded-xl border border-[#cfe9b6] bg-white px-3 py-3 text-center text-[13px] font-medium leading-5 md:flex-row md:gap-3 md:text-base md:leading-6" style={{ color: DEEP }}>
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#2f7d32" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="shrink-0">
        <path d="M9 18h6M10 21h4M12 3a6 6 0 00-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0012 3z" />
      </svg>
      <span>{children}</span>
    </div>
  )
}

function CategoryCard({ c }: { c: Category }) {
  const perItemTips = c.items.some((i) => i.tip)
  return (
    <section className="rounded-2xl p-4 md:p-5" style={{ backgroundColor: LIME }} aria-labelledby={`cat-${c.no}`}>
      <div className="text-center">
        <h2 id={`cat-${c.no}`} className="inline-block rounded-full bg-[#eefbdc] px-8 py-1 text-2xl font-bold md:text-3xl" style={{ color: DEEP }}>
          {c.no}. {c.name}
        </h2>
        <p className="mt-2 text-sm font-medium md:text-lg" style={{ color: DEEP }}>{c.sub}</p>
      </div>

      <div className={`mt-4 grid gap-3 ${c.items.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
        {c.items.map((item) => (
          <div key={item.label} className="flex flex-col items-center gap-2 text-center">
            <div
              className="aspect-square w-full max-w-[150px] rounded-full bg-white"
              style={photo(`sorting/${item.file}`, 'linear-gradient(135deg,#ffffff,#eef6e4)')}
              role="img"
              aria-label={item.label}
            />
            <div className="text-[13px] font-semibold md:text-base" style={{ color: DEEP }}>{item.label}</div>
            {perItemTips && item.tip && <Tip>{item.tip}</Tip>}
          </div>
        ))}
      </div>

      {!perItemTips && c.tip && (
        <div className="mt-4">
          <Tip>{c.tip}</Tip>
        </div>
      )}
    </section>
  )
}

export default function SortingPage() {
  return (
    <div className="min-h-screen overflow-x-clip bg-white text-[#1c2a1a]">
      <SiteNav active="sorting" />

      {/* ───────── หัวข้อ + 7 ขั้นตอน ───────── */}
      <header className="relative px-4 pb-6 pt-4 md:px-12" style={{ backgroundColor: LIME }}>
        <div className="mx-auto max-w-6xl text-center">
          <h1 className="inline-block rounded-full bg-[#154212] px-6 py-2 text-2xl font-bold text-white md:px-12 md:text-4xl">
            คู่มือการแยกขยะรีไซเคิล 4 ประเภท
          </h1>
          <p className="mt-3 text-xl font-bold md:text-3xl" style={{ color: DEEP }}>7 ขั้นตอนเตรียมพร้อมง่าย ๆ</p>

          <ol className="mt-4 grid grid-cols-4 gap-3 md:flex md:justify-center md:gap-6">
            {STEPS.map((s, i) => (
              <li key={s.label} className="flex flex-col items-center gap-1">
                <span className="sr-only">ขั้นตอนที่ {i + 1}:</span>
                <span className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#d6ecc0] bg-white md:h-20 md:w-20">
                  {s.icon}
                </span>
                <span className="text-sm font-semibold md:text-lg" style={{ color: DEEP }}>{s.label}</span>
              </li>
            ))}
          </ol>
        </div>
        <div className="absolute bottom-0 right-4 hidden lg:block">
          <MascotBin size={130} label="น้องรักษ์อยู่ในถังขยะ" />
        </div>
      </header>

      {/* ───────── 4 ประเภท ───────── */}
      <main className="px-4 py-6 md:px-12">
        <div className="mx-auto grid max-w-6xl gap-4 md:grid-cols-2 md:gap-6">
          {CATEGORIES.map((c) => (
            <CategoryCard key={c.no} c={c} />
          ))}
        </div>
      </main>

      <CtaBanner />
      <SiteFooter />
    </div>
  )
}
