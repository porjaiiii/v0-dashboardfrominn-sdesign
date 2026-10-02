'use client'

import Image from 'next/image'
import Link from 'next/link'
import { PointerEvent, useCallback, useEffect, useRef, useState } from 'react'
import { LINE_OA_URL, LOGIN_HREF } from '@/lib/site'

/**
 * แบนเนอร์หน้าแรกแบบเลื่อนได้ (2 ภาพ) — ปุ่มลูกศรเขียวซ้าย/ขวา + จุดบอกตำแหน่ง
 * - เลื่อนอัตโนมัติทุก 7 วินาที หยุดเมื่อเมาส์/โฟกัสอยู่บนแบนเนอร์ และไม่เลื่อนเองถ้าผู้ใช้ตั้งค่าลดการเคลื่อนไหว
 * - ปัดซ้าย/ขวาบนจอสัมผัสได้
 *
 * ภาพมีข้อความฝังอยู่ในรูป จึงวางลิงก์โปร่งใสทับตำแหน่งปุ่มในรูป (box เป็น % ของรูปขนาด 2000x938)
 * และใส่ alt ที่อ่านข้อความทั้งหมดให้ screen reader
 */

interface Hotspot {
  href: string
  label: string
  external?: boolean
  box: { left: number; top: number; w: number; h: number }
}

interface Slide {
  src: string
  alt: string
  hotspots: Hotspot[]
}

const SLIDES: Slide[] = [
  {
    src: '/landing/hero-slide-1.webp',
    alt: 'เปลี่ยนขยะให้มีคุณค่า กับ “น้องรักษ์” — แพลตฟอร์มจัดการขยะรีไซเคิลที่เชื่อมโยงคนในชุมชน การคัดแยกขยะ และการสร้างคุณค่าให้เกิดขึ้นอย่างยั่งยืน',
    hotspots: [{ href: LOGIN_HREF, label: 'เริ่มใช้งานน้องรักษ์', box: { left: 53.75, top: 82.7, w: 21.4, h: 8.2 } }],
  },
  {
    src: '/landing/hero-slide-2.webp',
    alt: 'ระบบจัดการขยะสำหรับชุมชน จัดการขยะในพื้นที่ให้เป็นระบบด้วย “น้องรักษ์” — รองรับตั้งแต่การบันทึกข้อมูลขยะ การสะสมคะแนน ไปจนถึงการติดตามข้อมูลผ่านระบบ',
    hotspots: [
      { href: '/about', label: 'รู้จักน้องรักษ์', box: { left: 19.85, top: 83.5, w: 30.25, h: 8.3 } },
      ...(LINE_OA_URL
        ? [{ href: LINE_OA_URL, label: 'สแกน QR เพื่อทดลองใช้งานผ่าน LINE', external: true, box: { left: 54.55, top: 55.6, w: 14.75, h: 36.3 } }]
        : []),
    ],
  },
]

const AUTOPLAY_MS = 7000
const SWIPE_PX = 40

function Arrow({ dir, onClick }: { dir: 'prev' | 'next'; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={dir === 'prev' ? 'ภาพก่อนหน้า' : 'ภาพถัดไป'}
      className={`absolute top-1/2 z-30 -translate-y-1/2 rounded-full transition hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${dir === 'prev' ? 'left-2 md:left-6' : 'right-2 md:right-6'}`}
    >
      <Image
        src="/landing/shapes/arrow-circle.png"
        alt=""
        aria-hidden
        width={140}
        height={140}
        className={`h-9 w-9 md:h-14 md:w-14 ${dir === 'prev' ? '-scale-x-100' : ''}`}
      />
    </button>
  )
}

export default function HeroCarousel() {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const [reduced, setReduced] = useState(false)
  const startX = useRef<number | null>(null)

  const go = useCallback((i: number) => setIndex(((i % SLIDES.length) + SLIDES.length) % SLIDES.length), [])

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(mq.matches)
    const onChange = () => setReduced(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    if (paused || reduced) return
    const t = setInterval(() => setIndex((i) => (i + 1) % SLIDES.length), AUTOPLAY_MS)
    return () => clearInterval(t)
  }, [paused, reduced])

  const onPointerDown = (e: PointerEvent) => {
    startX.current = e.clientX
  }
  const onPointerUp = (e: PointerEvent) => {
    if (startX.current === null) return
    const dx = e.clientX - startX.current
    startX.current = null
    if (Math.abs(dx) > SWIPE_PX) go(index + (dx < 0 ? 1 : -1))
  }

  return (
    <section
      aria-roledescription="carousel"
      aria-label="แบนเนอร์น้องรักษ์"
      className="relative w-full overflow-hidden bg-[#143d1a]"
      style={{ aspectRatio: '2000 / 938' }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
    >
      {SLIDES.map((s, i) => {
        const active = i === index
        return (
          <div
            key={s.src}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} จาก ${SLIDES.length}`}
            aria-hidden={!active}
            className={`absolute inset-0 transition-opacity duration-700 ${active ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
          >
            <Image src={s.src} alt={s.alt} fill priority={i === 0} sizes="100vw" className="select-none object-cover" draggable={false} />
            {/* ลิงก์โปร่งใสทับปุ่มที่ฝังอยู่ในรูป (เฉพาะจอกว้าง — จอเล็กใช้ปุ่มจริงด้านล่างแบนเนอร์) */}
            {s.hotspots.map((h) => {
              const style = { left: `${h.box.left}%`, top: `${h.box.top}%`, width: `${h.box.w}%`, height: `${h.box.h}%` }
              const cls = 'absolute z-20 hidden rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white md:block'
              return h.external ? (
                <a key={h.href} href={h.href} target="_blank" rel="noopener noreferrer" aria-label={h.label} tabIndex={active ? 0 : -1} className={cls} style={style} />
              ) : (
                <Link key={h.href} href={h.href} aria-label={h.label} tabIndex={active ? 0 : -1} className={cls} style={style} />
              )
            })}
          </div>
        )
      })}

      <Arrow dir="prev" onClick={() => go(index - 1)} />
      <Arrow dir="next" onClick={() => go(index + 1)} />

      <div className="absolute bottom-2 left-1/2 z-30 flex -translate-x-1/2 gap-2 md:bottom-4" role="tablist" aria-label="เลือกภาพแบนเนอร์">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            type="button"
            role="tab"
            aria-selected={i === index}
            aria-label={`ไปยังภาพที่ ${i + 1}`}
            onClick={() => go(i)}
            className={`h-2 rounded-full transition-all md:h-2.5 ${i === index ? 'w-6 bg-white md:w-8' : 'w-2 bg-white/50 hover:bg-white/80 md:w-2.5'}`}
          />
        ))}
      </div>
    </section>
  )
}
