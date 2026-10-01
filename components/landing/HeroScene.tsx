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

/** ขยะบนพื้น: ขวดกับกระป๋องทรงเรียบ สลับกัน — แต่ละชิ้นสุ่มสีอ่อน/เข้มใหม่ทุกรอบ (ดู light ด้านล่าง) */
const BOTTLE = { name: 'bottle', w: 430, h: 722, kind: styles.bottle }
const CAN = { name: 'can', w: 489, h: 555, kind: styles.can }
const TRASH = [
  { cls: styles.trash1, ...BOTTLE },
  { cls: styles.trash2, ...CAN },
  { cls: styles.trash3, ...BOTTLE },
  { cls: styles.trash4, ...CAN },
]

/** ค่าเริ่มต้นคงที่ (กัน hydration ไม่ตรง) แล้วสุ่มค่าใหม่ทุกครั้งที่ก้อนวนครบรอบ */
const INITIAL_KG = 482

export default function HeroScene() {
  const [kg, setKg] = useState(INITIAL_KG)
  /** สีของขยะแต่ละชิ้น (true = อ่อน) — ค่าเริ่มต้นคงที่ แล้วสุ่มใหม่ทุกครั้งที่ฉากวนครบรอบ (ตอนขยะยังหายอยู่) */
  const [light, setLight] = useState([false, true, false, true])

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

      {TRASH.map((t, i) => (
        <div key={i} className={`${styles.trash} ${t.kind} ${t.cls}`} data-light={light[i]}>
          {/* วางทั้งสองสีซ้อนกันแล้วสลับด้วย opacity เพื่อไม่ต้องโหลดรูปใหม่ตอนเปลี่ยนสี */}
          <Image src={`/landing/shapes/${t.name}-dark.png`} alt="" width={t.w} height={t.h} />
          <Image src={`/landing/shapes/${t.name}-light.png`} alt="" width={t.w} height={t.h} />
        </div>
      ))}

      <div className={styles.walker}>
        <div className={styles.hopper}>
          <div className={styles.bobber}>
            <Image src="/landing/mascot.webp" alt="" width={838} height={897} priority />
            {/* หน้ายิ้มตาหยี โผล่ตอนเก็บขยะ (ซ้อนทับหน้าปกติ) */}
            <Image className={styles.happy} src="/landing/mascot-happy.webp" alt="" width={838} height={897} priority />
          </div>
        </div>
        <Image className={styles.leaf} src="/landing/shapes/leaf.png" alt="" width={398} height={160} />
      </div>

      <div className={styles.bubble} onAnimationIteration={() => {
          setKg(Math.floor(120 + Math.random() * 870))
          setLight(TRASH.map(() => Math.random() < 0.5))
        }}>
        <small>Carbon emission</small>
        <strong>{kg} kgCO₂e</strong>
      </div>
    </div>
  )
}
