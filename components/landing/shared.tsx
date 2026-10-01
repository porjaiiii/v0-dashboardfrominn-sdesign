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
    <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white" style={{ backgroundColor: color }}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M7 19H4l3-5M17 5h3l-3 5M12 3l-2 4h4zM9 21l3-5 3 5z" />
      </svg>
    </span>
  )
}

export function Leaf({ className }: { className: string }) {
  return (
    <svg aria-hidden viewBox="0 0 120 60" className={`pointer-events-none absolute ${className}`} fill="#a8e063" opacity="0.7">
      <path d="M0 55C20 10 70 0 120 8c-5 40-50 60-120 47z" />
    </svg>
  )
}
