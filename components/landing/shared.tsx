import Image from 'next/image'
import type { CSSProperties } from 'react'

/** สี/ตัวช่วยร่วมของหน้าเว็บสาธารณะ */

export const DEEP = '#154212'
export const MID = '#2f7d32'
export const LIME = '#e0f8c6'

export const FOREST = 'linear-gradient(135deg, #0f3a16 0%, #2b6b2f 50%, #143d1a 100%)'
export const SOFT = 'linear-gradient(135deg, #cfe9b6, #a8d58a)'

/** รูปพื้นหลัง: ใช้ไฟล์ใน public/landing ถ้ามี ไม่มีก็เห็นสีไล่เฉดที่รองอยู่ (หน้าไม่พัง) */
export const photo = (file: string, fallback: string): CSSProperties => ({
  backgroundImage: `url(/landing/${file}), ${fallback}`,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
})

export function RecycleBadge({ color }: { color: string }) {
  return (
    <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: color }}>
      <Image src="/landing/recycle-icon.png" alt="" aria-hidden width={20} height={20} />
    </span>
  )
}

export function Leaf({ className }: { className: string }) {
  return (
    <Image
      src="/landing/shapes/leaf.png"
      alt=""
      aria-hidden
      width={398}
      height={160}
      className={`pointer-events-none absolute object-contain opacity-90 ${className}`}
    />
  )
}
