/** อีเมลแต่ละแบบของระบบบัญชี: สร้างลิงก์ + token, เช็ก cooldown แล้วส่ง */

import { sendMail } from '@/lib/email'
import { approvedMail, newSignupMail, rejectedMail, resetPasswordMail, verifyEmailMail } from '@/lib/email-templates'
import { claimEmailSlot, getRootAccount, type AccountRow } from './accounts'
import { appBaseUrl, sessionSecret } from './config'
import { RESET_PASSWORD_TTL_MS, VERIFY_EMAIL_TTL_MS } from './policy'
import { signToken, type TokenClaims, type TokenPurpose } from './tokens'

function link(path: string): string | null {
  const base = appBaseUrl()
  if (!base) console.error('[mailers] APP_BASE_URL ยังไม่ได้ตั้งค่า — สร้างลิงก์ในอีเมลไม่ได้')
  return base ? `${base}${path}` : null
}

function tokenLink(page: string, purpose: TokenPurpose, claims: TokenClaims): string | null {
  const secret = sessionSecret()
  return secret ? link(`${page}?token=${encodeURIComponent(signToken(secret, purpose, claims))}`) : null
}

/** false = ไม่ได้ส่ง (ติด cooldown 60 วินาที, ตั้งค่าไม่ครบ หรือส่งไม่สำเร็จ) */
export async function sendVerificationEmail(account: AccountRow, now = Date.now()): Promise<boolean> {
  const url = tokenLink('/verify-email', 'verify-email', { sub: account.id, exp: now + VERIFY_EMAIL_TTL_MS })
  if (!url || !(await claimEmailSlot(account.id, now))) return false
  return sendMail(verifyEmailMail(account.email, account.full_name, url))
}

/** ลิงก์ผูกกับ sessions_valid_after ปัจจุบัน — ตั้งรหัสใหม่แล้วค่านี้เปลี่ยน ลิงก์เดิมจึงใช้ซ้ำไม่ได้ */
export async function sendPasswordResetEmail(account: AccountRow, now = Date.now()): Promise<boolean> {
  const url = tokenLink('/reset-password', 'reset-password', {
    sub: account.id,
    sva: Date.parse(account.sessions_valid_after),
    exp: now + RESET_PASSWORD_TTL_MS,
  })
  if (!url || !(await claimEmailSlot(account.id, now))) return false
  return sendMail(resetPasswordMail(account.email, account.full_name, url))
}

/** แจ้ง root admin คนเดียวเมื่อมีผู้สมัครยืนยันอีเมลแล้ว */
export async function notifyRootOfSignup(account: AccountRow): Promise<boolean> {
  const [root, url] = [await getRootAccount(), link('/admin/accounts?status=pending')]
  if (!root || !url) {
    console.error('[mailers] ยังไม่มี root admin หรือ APP_BASE_URL — ไม่ได้แจ้งคำขอใหม่', account.email)
    return false
  }
  return sendMail(newSignupMail(root.email, { name: account.full_name, email: account.email }, url))
}

export async function sendDecisionEmail(account: AccountRow, decision: 'approved' | 'rejected'): Promise<boolean> {
  if (decision === 'rejected') return sendMail(rejectedMail(account.email, account.full_name))
  const url = link('/login')
  return url ? sendMail(approvedMail(account.email, account.full_name, account.role, url)) : false
}
