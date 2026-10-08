/**
 * ส่งอีเมลผ่าน Gmail SMTP — ตั้ง GMAIL_USER + GMAIL_APP_PASSWORD (App password ของ Google,
 * ต้องเปิด 2-Step Verification ของบัญชี Gmail ก่อน)
 */

import nodemailer, { type Transporter } from 'nodemailer'
import { readEnv } from '@/lib/google-sheets'
import type { MailMessage } from '@/lib/email-templates'

let transporter: Transporter | null = null

/** false = ไม่ได้ส่ง (ยังไม่ได้ตั้งค่า หรือส่งไม่สำเร็จ) — ไม่ throw เพื่อไม่ให้การกระทำหลักล้มตาม */
export async function sendMail(msg: MailMessage): Promise<boolean> {
  const user = readEnv('GMAIL_USER')
  const pass = readEnv('GMAIL_APP_PASSWORD')
  if (!user || !pass) {
    console.error('[email] GMAIL_USER / GMAIL_APP_PASSWORD ยังไม่ได้ตั้งค่า — ไม่ได้ส่ง:', msg.subject)
    return false
  }
  transporter ??= nodemailer.createTransport({ service: 'gmail', auth: { user, pass } })
  try {
    await transporter.sendMail({ from: { name: 'Digital Waste Dashboard', address: user }, ...msg })
    return true
  } catch (err) {
    console.error('[email] ส่งไม่สำเร็จ:', msg.subject, err)
    return false
  }
}
