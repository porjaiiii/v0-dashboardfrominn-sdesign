/** เนื้อหาอีเมลของระบบบัญชีแดชบอร์ด (ฟังก์ชันล้วน) */

import { ROLE_LABELS, type Role } from '@/lib/auth/policy'

export interface MailMessage {
  to: string
  subject: string
  text: string
  html: string
}

const HTML_ESCAPES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }
const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => HTML_ESCAPES[c])

function compose(to: string, subject: string, paragraphs: string[], link?: { url: string; label: string }): MailMessage {
  const text = [...paragraphs, ...(link ? [`${link.label}: ${link.url}`] : [])].join('\n\n')
  const html = [
    ...paragraphs.map((p) => `<p>${escapeHtml(p)}</p>`),
    ...(link ? [`<p><a href="${escapeHtml(link.url)}">${escapeHtml(link.label)}</a></p>`] : []),
  ].join('\n')
  return { to, subject, text, html }
}

const SIGNATURE = 'ระบบข้อมูลร่วมอนุรักษ์โลก คุ้งบางกะเจ้า'

export const verifyEmailMail = (to: string, url: string) =>
  compose(
    to,
    'ยืนยันอีเมลสำหรับบัญชีแดชบอร์ด',
    [
      'สวัสดี',
      'กดลิงก์ด้านล่าง แล้วกรอกรหัสผ่านที่ตั้งไว้ตอนสมัครเพื่อยืนยันอีเมล คำขอเปิดบัญชีจะถูกส่งให้ผู้ดูแลระบบพิจารณา ลิงก์นี้ใช้ได้ภายใน 24 ชั่วโมง',
      'หากคุณไม่ได้สมัครใช้งาน ไม่ต้องทำอะไร',
      SIGNATURE,
    ],
    { url, label: 'ยืนยันอีเมล' },
  )

export const newSignupMail = (to: string, applicant: { name: string; email: string }, url: string) =>
  compose(
    to,
    `คำขอเปิดบัญชีแดชบอร์ดใหม่: ${applicant.email}`,
    [`มีผู้สมัครใช้งานแดชบอร์ดและยืนยันอีเมลแล้ว`, `ชื่อ: ${applicant.name}`, `อีเมล: ${applicant.email}`, SIGNATURE],
    { url, label: 'ดูคำขอที่รออนุมัติ' },
  )

// อีเมลถึงเจ้าของบัญชีไม่ใส่ชื่อ — ชื่อมาจากคนที่กรอกฟอร์มสมัคร จึงอาจถูกใช้แทรกข้อความสแปม

export const approvedMail = (to: string, role: Role, url: string) =>
  compose(
    to,
    'บัญชีแดชบอร์ดของคุณได้รับการอนุมัติแล้ว',
    ['สวัสดี', `บัญชีของคุณได้รับการอนุมัติในบทบาท "${ROLE_LABELS[role]}" แล้ว เข้าสู่ระบบได้ทันที`, SIGNATURE],
    { url, label: 'เข้าสู่ระบบ' },
  )

export const rejectedMail = (to: string) =>
  compose(to, 'ผลการพิจารณาคำขอบัญชีแดชบอร์ด', [
    'สวัสดี',
    'คำขอเปิดบัญชีแดชบอร์ดของคุณไม่ได้รับการอนุมัติ หากคิดว่าเป็นความผิดพลาด กรุณาติดต่อผู้ดูแลระบบ',
    SIGNATURE,
  ])

export const resetPasswordMail = (to: string, url: string) =>
  compose(
    to,
    'ตั้งรหัสผ่านใหม่สำหรับบัญชีแดชบอร์ด',
    [
      'สวัสดี',
      'มีคำขอตั้งรหัสผ่านใหม่สำหรับบัญชีของคุณ ลิงก์นี้ใช้ได้ภายใน 1 ชั่วโมงและใช้ได้ครั้งเดียว',
      'หากคุณไม่ได้ขอ ไม่ต้องทำอะไร รหัสผ่านเดิมยังใช้ได้',
      SIGNATURE,
    ],
    { url, label: 'ตั้งรหัสผ่านใหม่' },
  )
