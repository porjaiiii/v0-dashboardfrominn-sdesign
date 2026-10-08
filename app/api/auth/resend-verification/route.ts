import { getAccountByEmail } from '@/lib/auth/accounts'
import { field, ok, publicAuthRoute, readBody } from '@/lib/auth/http'
import { sendVerificationEmail } from '@/lib/auth/mailers'
import { isEmail, normalizeEmail } from '@/lib/auth/policy'

/** ส่งลิงก์ยืนยันอีเมลอีกครั้ง — ตอบเหมือนกันทุกกรณี เพื่อไม่ให้ใช้ตรวจว่าอีเมลไหนมีบัญชี */
export const POST = publicAuthRoute(async (req) => {
  const email = normalizeEmail(field(await readBody(req), 'email'))
  const account = isEmail(email) ? await getAccountByEmail(email) : null
  if (account?.status === 'unverified') await sendVerificationEmail(account)
  return ok()
})
