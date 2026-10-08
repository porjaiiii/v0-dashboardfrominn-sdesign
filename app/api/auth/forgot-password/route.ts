import { getAccountByEmail } from '@/lib/auth/accounts'
import { field, ok, publicAuthRoute, readBody } from '@/lib/auth/http'
import { sendPasswordResetEmail } from '@/lib/auth/mailers'
import { isEmail, normalizeEmail } from '@/lib/auth/policy'

/** ส่งลิงก์ตั้งรหัสผ่านใหม่ — ตอบเหมือนกันทุกกรณี เพื่อไม่ให้ใช้ตรวจว่าอีเมลไหนมีบัญชี */
export const POST = publicAuthRoute(async (req) => {
  const email = normalizeEmail(field(await readBody(req), 'email'))
  const account = isEmail(email) ? await getAccountByEmail(email) : null
  if (account && account.status !== 'disabled') await sendPasswordResetEmail(account)
  return ok()
})
