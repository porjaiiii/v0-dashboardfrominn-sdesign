'use client'

import Image from 'next/image'
import { CSSProperties, useState } from 'react'
import styles from './HeroScene.module.css'

/**
 * พื้นหลังแอนิเมชันของ hero — น้องรักษ์เดินเก็บขยะผ่านฉากต้นไม้ (จังหวะอยู่ใน HeroScene.module.css)
 * ตกแต่งล้วน ๆ จึงซ่อนจาก screen reader และไม่รับการคลิก
 */

const TREES = [
  { src: '/landing/tree-1.png', w: 185, h: 209, x: 5, size: 11, dur: 4.2, delay: -0.5 },
  { src: '/landing/tree-2.png', w: 132, h: 175, x: 17, size: 7, dur: 3.6, delay: -1.8 },
  { src: '/landing/tree-1.png', w: 185, h: 209, x: 39, size: 8.5, dur: 4.8, delay: -2.6 },
  { src: '/landing/tree-2.png', w: 132, h: 175, x: 56, size: 6.5, dur: 3.9, delay: -0.9 },
  { src: '/landing/tree-1.png', w: 185, h: 209, x: 72, size: 9, dur: 4.4, delay: -3.1 },
  { src: '/landing/tree-2.png', w: 132, h: 175, x: 91, size: 8, dur: 3.5, delay: -1.2 },
]

const TRASH = [
  { cls: styles.trash1, src: '/landing/scene/beer.png', w: 200, h: 252 },
  { cls: styles.trash2, src: '/landing/scene/tea.png', w: 186, h: 271 },
  { cls: styles.trash3, src: '/landing/scene/cola.png', w: 197, h: 255 },
  { cls: styles.trash4, src: '/landing/scene/newspaper.png', w: 698, h: 788 },
]

/** ค่าเริ่มต้นคงที่ (กัน hydration ไม่ตรง) แล้วสุ่มค่าใหม่ทุกครั้งที่ก้อนวนครบรอบ */
const INITIAL_KG = 482

export default function HeroScene() {
  const [kg, setKg] = useState(INITIAL_KG)

  return (
    <div className={styles.scene} aria-hidden>
      <div className={styles.ground} />

      {TREES.map((t, i) => (
        <div
          key={i}
          className={styles.tree}
          style={{ left: `${t.x}%`, width: `${t.size}cqw`, ['--dur' as string]: `${t.dur}s`, ['--delay' as string]: `${t.delay}s` } as CSSProperties}
        >
          <Image src={t.src} alt="" width={t.w} height={t.h} />
        </div>
      ))}

      {TRASH.map((t) => (
        <div key={t.src} className={`${styles.trash} ${t.cls}`}>
          <Image src={t.src} alt="" width={t.w} height={t.h} />
        </div>
      ))}

      <div className={styles.walker}>
        <div className={styles.hopper}>
          <div className={styles.bobber}>
            <Image src="/landing/mascot.webp" alt="" width={838} height={897} priority />
          </div>
        </div>
        <svg className={styles.leaf} viewBox="0 0 24 32" aria-hidden>
          <path d="M12 31C4 24 2 12 12 1c10 11 8 23 0 30z" fill="#7ed348" stroke="#2f7d32" strokeWidth="1.6" />
          <path d="M12 7v20" stroke="#2f7d32" strokeWidth="1.1" strokeLinecap="round" />
        </svg>
      </div>

      <div className={styles.bubble} onAnimationIteration={() => setKg(Math.floor(120 + Math.random() * 870))}>
        <small>Carbon emission</small>
        <strong>{kg} kgCO₂e</strong>
      </div>
    </div>
  )
}
