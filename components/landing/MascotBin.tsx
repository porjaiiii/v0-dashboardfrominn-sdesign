'use client'

import Image from 'next/image'
import { CSSProperties, useState } from 'react'
import styles from './MascotBin.module.css'

/**
 * น้องรักษ์ในถังขยะ
 * เอาเมาส์ชี้ (หรือแตะ/กด Enter บนมือถือ-คีย์บอร์ด):
 *  1) น้องรักษ์ขยับขึ้นจากถังเล็กน้อย
 *  2) โยนขยะ 3 ชิ้น (ขวด แก้ว กล่อง) ลงถัง
 *  3) ใบไม้พุ่งออกจากปากถัง และต้นไม้งอกข้างถัง
 */

/** ตำแหน่งทั้งหมดเป็นสัดส่วนของ --w (ความกว้างถัง) */
const k = (n: number) => `calc(var(--w) * ${n})`

/** ขยะที่โยนลงถัง: ขวดกับกระป๋องทรงเรียบ (ขวดเรียวกว่าจึงกว้างน้อยกว่า) */
const TRASH = [
  { name: 'bottle', w: 430, h: 722, size: 0.11, delay: 0.15, sx: -0.6, sy: -0.1, mx: -0.3, my: -0.28, r0: -40, r1: 70, r2: 200 },
  { name: 'can', w: 489, h: 555, size: 0.17, delay: 0.4, sx: 0.7, sy: -0.15, mx: 0.35, my: -0.3, r0: 30, r1: -80, r2: -190 },
  { name: 'bottle', w: 430, h: 722, size: 0.1, delay: 0.65, sx: 0.0, sy: -0.35, mx: 0.0, my: -0.38, r0: -15, r1: 40, r2: 150 },
]

const LEAVES = [
  { dx: -0.55, dy: -0.35, rot: -60, delay: 1.0 },
  { dx: -0.3, dy: -0.62, rot: -25, delay: 1.07 },
  { dx: 0.0, dy: -0.72, rot: 5, delay: 1.14 },
  { dx: 0.32, dy: -0.6, rot: 30, delay: 1.21 },
  { dx: 0.58, dy: -0.32, rot: 62, delay: 1.28 },
]

const TREES = [
  { src: '/landing/tree-1.png', w: 185, h: 209, left: -0.3, size: 0.26, delay: 1.2 },
  { src: '/landing/tree-2.png', w: 132, h: 175, left: 1.04, size: 0.2, delay: 1.35 },
  { src: '/landing/tree-1.png', w: 185, h: 209, left: 1.28, size: 0.14, delay: 1.5 },
]

function Leaf() {
  return <Image src="/landing/shapes/leaf.png" alt="" aria-hidden width={398} height={160} style={{ width: '100%', height: 'auto' }} />
}

export default function MascotBin({ size = 150, label = 'น้องรักษ์อยู่ในถังขยะ' }: { size?: number; label?: string }) {
  const [active, setActive] = useState(false)
  /** สีขยะแต่ละชิ้น (true = อ่อน) — สุ่มใหม่ทุกครั้งที่เริ่มเล่น; ค่าเริ่มต้นคงที่เพื่อไม่ให้ hydration ไม่ตรง */
  const [light, setLight] = useState([false, true, false])

  const start = () => {
    setLight(TRASH.map(() => Math.random() < 0.5))
    setActive(true)
  }

  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      className={`${styles.root} ${active ? styles.active : ''}`}
      style={{ '--w': `${size}px` } as CSSProperties}
      onMouseEnter={start}
      onMouseLeave={() => setActive(false)}
      onFocus={start}
      onBlur={() => setActive(false)}
      onClick={() => (active ? setActive(false) : start())}
    >
      {/* eslint-disable @next/next/no-img-element */}
      <img src="/landing/mascot.webp" alt="" aria-hidden className={`${styles.layer} ${styles.mascot}`} />
      {/* หน้ายิ้มตาหยีซ้อนทับ โผล่ตอนกำลังโยนขยะ */}
      <img src="/landing/mascot-happy.webp" alt="" aria-hidden className={`${styles.layer} ${styles.mascot} ${styles.happy}`} />

      {TRASH.map((t, i) => (
        <span
          key={i}
          aria-hidden
          className={`${styles.layer} ${styles.trash}`}
          data-light={light[i]}
          style={
            {
              width: k(t.size),
              '--delay': `${t.delay}s`,
              '--sx': k(t.sx),
              '--sy': k(t.sy),
              '--mx': k(t.mx),
              '--my': k(t.my),
              '--r0': `${t.r0}deg`,
              '--r1': `${t.r1}deg`,
              '--r2': `${t.r2}deg`,
            } as CSSProperties
          }
        >
          {/* สองสีซ้อนกัน สลับด้วย opacity (ไม่ต้องโหลดรูปใหม่ตอนเปลี่ยนสี) */}
          <img src={`/landing/shapes/${t.name}-dark.png`} alt="" width={t.w} height={t.h} />
          <img src={`/landing/shapes/${t.name}-light.png`} alt="" width={t.w} height={t.h} />
        </span>
      ))}

      {LEAVES.map((l, i) => (
        <span
          key={i}
          aria-hidden
          className={`${styles.layer} ${styles.leaf}`}
          style={{ '--delay': `${l.delay}s`, '--dx': k(l.dx), '--dy': k(l.dy), '--rot': `${l.rot}deg` } as CSSProperties}
        >
          <Leaf />
        </span>
      ))}

      <img src="/landing/bin.webp" alt="" aria-hidden className={`${styles.layer} ${styles.bin}`} />

      {TREES.map((t, i) => (
        <img
          key={i}
          src={t.src}
          alt=""
          aria-hidden
          className={`${styles.layer} ${styles.tree}`}
          style={{ left: k(t.left), width: k(t.size), '--delay': `${t.delay}s` } as CSSProperties}
        />
      ))}
      {/* eslint-enable @next/next/no-img-element */}
    </button>
  )
}
