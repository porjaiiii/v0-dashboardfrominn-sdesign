import type { Metadata } from 'next'
import Image from 'next/image'
import type { ReactNode } from 'react'
import SiteNav from '@/components/landing/SiteNav'
import { CtaBanner, SiteFooter } from '@/components/landing/sections'
import { DEEP, LIME } from '@/components/landing/shared'

export const metadata: Metadata = { title: 'ข้อมูลการจัดการขยะ - Digital Waste' }

/**
 * ขั้นตอนการจัดการขยะของน้องรักษ์แบบคร่าว ๆ
 * (ข้อความเป็นคำอธิบายภาพรวม — ปรับให้ตรงกับขั้นตอนจริงของโครงการได้ที่ STEPS / OUTCOMES ด้านล่าง)
 */

function Arrow() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#2f7d32" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="mx-auto shrink-0 rotate-90 md:rotate-0">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  )
}

function TrashPics() {
  return (
    <div className="flex items-end justify-center gap-2">
      <Image src="/landing/shapes/bottle.png" alt="" aria-hidden width={430} height={722} className="h-auto w-9 md:w-10" />
      <Image src="/landing/shapes/can.png" alt="" aria-hidden width={489} height={555} className="h-auto w-12 md:w-14" />
      <Image src="/landing/shapes/bottle.png" alt="" aria-hidden width={430} height={722} className="h-auto w-8 md:w-9" />
    </div>
  )
}

const STEPS: { no: number; title: string; text: string; art: ReactNode }[] = [
  {
    no: 1,
    title: 'คัดแยกและบันทึก',
    text: 'ผู้ใช้คัดแยกขยะรีไซเคิลที่บ้าน แล้วบันทึกประเภทและน้ำหนักผ่านน้องรักษ์บน LINE',
    art: <TrashPics />,
  },
  {
    no: 2,
    title: 'น้องรักษ์มารับขยะ',
    text: 'เจ้าหน้าที่รับขยะตามรอบหรือจุดรับขยะ ชั่งน้ำหนัก ตรวจสอบ และยืนยันรายการ ผู้ใช้ได้รับคะแนนสะสม',
    art: <Image src="/landing/mascot.webp" alt="" aria-hidden width={84} height={90} className="mx-auto h-auto w-20 md:w-24" />,
  },
  {
    no: 3,
    title: 'รวบรวมตามประเภท',
    text: 'ขยะที่รับมาถูกรวบรวมและแยกตามประเภท ได้แก่ พลาสติก แก้ว กระดาษ และอลูมิเนียม',
    art: <Image src="/landing/bin.webp" alt="" aria-hidden width={110} height={98} className="mx-auto h-auto w-24 md:w-28" />,
  },
]

const OUTCOMES: { title: string; text: string; tone: string; icon: ReactNode }[] = [
  {
    title: 'ส่งเข้าสู่กระบวนการรีไซเคิล',
    text: 'นำขยะที่คัดแยกแล้วกลับเข้าสู่กระบวนการรีไซเคิล เพื่อผลิตเป็นวัสดุใหม่ ลดขยะที่ต้องกำจัด และลดการปล่อยก๊าซเรือนกระจก',
    tone: '#dff5c8',
    icon: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#154212" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M7 19H4l3-5M17 5h3l-3 5M12 3l-2 4h4zM9 21l3-5 3 5z" />
      </svg>
    ),
  },
  {
    title: 'ขายให้ผู้รับซื้อ',
    text: 'ขยะที่มีมูลค่าสามารถขายต่อให้ผู้รับซื้อขยะรีไซเคิลได้ ทำให้ขยะกลายเป็นรายได้และหมุนเวียนอยู่ในระบบ',
    tone: '#fdf3d3',
    icon: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#154212" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <circle cx="12" cy="12" r="9" />
        <path d="M14.5 9c-.5-1-1.4-1.5-2.5-1.5-1.4 0-2.5.8-2.5 2s1 1.7 2.5 2 2.5.8 2.5 2-1.1 2-2.5 2c-1.1 0-2-.5-2.5-1.5M12 6v1.5M12 16.5V18" />
      </svg>
    ),
  },
]

export default function WasteManagementPage() {
  return (
    <div className="min-h-screen overflow-x-clip bg-white text-[#1c2a1a]">
      <SiteNav active="management" />

      <main>
        <header className="px-5 py-10 text-center md:px-16" style={{ backgroundColor: LIME }}>
          <h1 className="text-3xl font-bold md:text-5xl" style={{ color: DEEP }}>น้องรักษ์จัดการขยะอย่างไร?</h1>
          <p className="mx-auto mt-3 max-w-2xl text-[14px] leading-7 text-[#2f7d32] md:text-lg md:leading-8">
            จากขยะในครัวเรือน สู่วัสดุที่กลับมามีคุณค่า — ขั้นตอนการจัดการขยะรีไซเคิลของน้องรักษ์แบบเข้าใจง่าย
          </p>
        </header>

        {/* ───────── ขั้นตอนหลัก ───────── */}
        <section className="px-4 py-10 md:px-12" aria-label="ขั้นตอนการจัดการขยะ">
          <ol className="mx-auto grid max-w-6xl items-center gap-3 md:grid-cols-[1fr_auto_1fr_auto_1fr]">
            {STEPS.flatMap((s, i) => {
              const card = (
                <li key={s.no} className="flex h-full flex-col items-center rounded-2xl bg-[#f1fde3] p-5 text-center">
                  <div className="flex h-24 items-end justify-center">{s.art}</div>
                  <div className="mt-3 flex h-8 w-8 items-center justify-center rounded-full bg-[#154212] text-sm font-bold text-white">{s.no}</div>
                  <h2 className="mt-2 text-xl font-bold md:text-2xl" style={{ color: DEEP }}>{s.title}</h2>
                  <p className="mt-2 text-[13px] leading-6 text-[#2f7d32] md:text-base md:leading-7">{s.text}</p>
                </li>
              )
              return i < STEPS.length - 1 ? [card, <li key={`a${s.no}`} aria-hidden className="list-none"><Arrow /></li>] : [card]
            })}
          </ol>
        </section>

        {/* ───────── แยกเป็น 2 ทาง ───────── */}
        <section className="px-4 pb-12 md:px-12" aria-labelledby="outcomes">
          <div className="mx-auto max-w-6xl">
            <div className="flex flex-col items-center">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#2f7d32" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="rotate-90">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
              <h2 id="outcomes" className="mt-1 text-center text-2xl font-bold md:text-4xl" style={{ color: DEEP }}>
                จากนั้นขยะไปต่อได้ 2 ทาง
              </h2>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2 md:gap-6">
              {OUTCOMES.map((o) => (
                <article key={o.title} className="flex items-start gap-4 rounded-2xl p-5" style={{ backgroundColor: o.tone }}>
                  <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-white">{o.icon}</span>
                  <div>
                    <h3 className="text-xl font-bold md:text-2xl" style={{ color: DEEP }}>{o.title}</h3>
                    <p className="mt-1 text-[13px] leading-6 text-[#2f7d32] md:text-base md:leading-7">{o.text}</p>
                  </div>
                </article>
              ))}
            </div>

            <p className="mt-6 rounded-2xl border border-[#cfe9b6] p-4 text-center text-[13px] leading-6 text-[#2f7d32] md:text-base">
              ทุกขั้นตอนถูกบันทึกในระบบ ผู้ใช้จึงเห็นปริมาณขยะที่ส่งมา คะแนนที่สะสมได้ และปริมาณก๊าซเรือนกระจกที่ช่วยลดได้
              พร้อมนำคะแนนไปแลกรางวัลได้
            </p>
          </div>
        </section>
      </main>

      <CtaBanner />
      <SiteFooter />
    </div>
  )
}
