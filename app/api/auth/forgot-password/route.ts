import { getAccountByEmail } from '@/lib/auth/accounts'
import { field, ok, publicAuthRoute, readBody } from '@/lib/auth/http'
import { sendPasswordResetEmail } from '@/lib/auth/mailers'
import { isEmail, normalizeEmail } from '@/lib/auth/policy'

/**
 * ส่งลิงก์ตั้งรหัสผ่านใหม่ — ตอบเหมือนกันทุกกรณี เพื่อไม่ให้ใช้ตรวจว่าอีเมลไหนมีบัญชี
 * ส่งเฉพาะบัญชีที่ยืนยันอีเมลแล้ว (pending/active): บัญชี unverified ใครก็สมัครด้วยอีเมลคนอื่นได้
 * จึงห้ามส่งไปหา กันใช้เป็นช่องส่งสแปม — ถ้าลืมรหัสก่อนยืนยัน ให้สมัครใหม่ด้วยอีเมลเดิม
 */
export const POST = publicAuthRoute(async (req) => {
  const email = normalizeEmail(field(await readBody(req), 'email'))
  const account = isEmail(email) ? await getAccountByEmail(email) : null
  if (account?.status === 'pending' || account?.status === 'active') await sendPasswordResetEmail(account)
  return ok()
})
