/** ข้อมูลของเว็บไซต์สาธารณะ (หน้าแรก/รู้จักน้องรักษ์/แยกขยะ/ติดต่อเรา) — แก้ที่นี่ที่เดียว */

export const COMPANY = 'บริษัท เลิร์นดู วิสาหกิจเพื่อสังคม จำกัด'
export const ADDRESS_LINES = ['เลขที่ 68/7 หมู่ที่ 3 ตำบลบางกอบัว', 'อำเภอพระประแดง จังหวัดสมุทรปราการ 10130']
export const PHONE = '092 505 4994'
export const EMAIL = 'info.learndo@gmail.com'
export const OPENING_HOURS = 'Open 9:00–18:00 Closed on Saturday and Sunday'

/** ลิงก์ LINE Official Account — TODO: ใส่ลิงก์จริง (ถ้าเว้นว่าง ปุ่ม/QR จะไม่ลิงก์ไปไหน) */
export const LINE_OA_URL = ''

/**
 * วิดีโอ "วิธีใช้งาน" ในหน้ารู้จักน้องรักษ์ (YouTube: https://youtu.be/hTm7o4FXSgo)
 * ใช้โดเมน youtube-nocookie เพื่อไม่ตั้ง cookie ติดตามจนกว่าผู้ชมจะกดเล่น
 * ถ้าเว้นว่างจะแสดงกรอบ "เร็ว ๆ นี้"
 */
export const HOWTO_VIDEO_EMBED_URL = 'https://www.youtube-nocookie.com/embed/hTm7o4FXSgo'

export const LOGIN_HREF = '/login'

export type NavKey = 'home' | 'about' | 'sorting' | 'management' | 'contact'

export const NAV_ITEMS: { key: NavKey; href: string; label: string }[] = [
  { key: 'home', href: '/', label: 'หน้าหลัก' },
  { key: 'about', href: '/about', label: 'รู้จักน้องรักษ์' },
  { key: 'sorting', href: '/sorting', label: 'แยกขยะ' },
  { key: 'management', href: '/waste-management', label: 'ข้อมูลการจัดการขยะ' },
  { key: 'contact', href: '/contact', label: 'ติดต่อเรา' },
]
