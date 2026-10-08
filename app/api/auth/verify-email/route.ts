import { getAccountById, updateAccounts } from '@/lib/auth/accounts'
import { sessionSecret } from '@/lib/auth/config'
import { field, jsonError, ok, publicAuthRoute, readBody, wrongCredentialsDelay } from '@/lib/auth/http'
import { notifyRootOfSignup } from '@/lib/auth/mailers'
import { LINK_INVALID_MESSAGE, SIGNUP_PASSWORD_MISMATCH_MESSAGE, TOO_MANY_ATTEMPTS_MESSAGE } from '@/lib/auth/policy'
import { AuthApiError, verifyPassword } from '@/lib/auth/supabase-auth'
import { verifyToken } from '@/lib/auth/tokens'

/**
 * ยืนยันอีเมล: unverified → pending แล้วแจ้ง root admin
 * ต้องมีทั้งลิงก์ (พิสูจน์ว่าเข้าอีเมลนั้นได้) และรหัสผ่านที่ตั้งตอนสมัคร (พิสูจน์ว่าเป็นคนที่สมัคร)
 * ไม่งั้นใครก็สมัครด้วยอีเมลของคนอื่นแล้วตั้งรหัสผ่านของตัวเองได้ พอเจ้าของอีเมลกดลิงก์ ผู้สมัครก็ได้บัญชี
 * เป็น POST จากฟอร์มในหน้า /verify-email (ไม่ใช่ GET) — ตัวสแกนลิงก์ในอีเมลจึงกดแทนผู้ใช้ไม่ได้
 * อัปเดตแบบมีเงื่อนไข status = unverified ทำให้ลิงก์ใช้ได้ครั้งเดียว
 */
export const POST = publicAuthRoute(async (req) => {
  const body = await readBody(req)
  const password = field(body, 'password')
  if (!password) return jsonError('กรุณากรอกรหัสผ่าน', 400)

  const claims = verifyToken(sessionSecret() ?? '', 'verify-email', field(body, 'token'))
  if (!claims) return jsonError(LINK_INVALID_MESSAGE, 400)

  const account = await getAccountById(claims.sub)
  if (!account || account.status !== 'unverified') return jsonError(LINK_INVALID_MESSAGE, 400)

  let userId: string | null
  try {
    userId = await verifyPassword(account.email, password)
  } catch (err) {
    if (err instanceof AuthApiError && err.status === 429) return jsonError(TOO_MANY_ATTEMPTS_MESSAGE, 429)
    throw err
  }
  if (userId !== account.id) {
    await wrongCredentialsDelay()
    return jsonError(SIGNUP_PASSWORD_MISMATCH_MESSAGE, 401)
  }

  const [verified] = await updateAccounts(
    { id: `eq.${account.id}`, status: 'eq.unverified' },
    { status: 'pending', email_verified_at: new Date().toISOString() },
  )
  if (!verified) return jsonError(LINK_INVALID_MESSAGE, 400)

  // การยืนยันสำเร็จแล้ว — แจ้ง root ไม่ได้ก็ไม่ควรทำให้ผู้ใช้เห็นว่าล้มเหลว
  try {
    await notifyRootOfSignup(verified)
  } catch (err) {
    console.error('[verify-email] แจ้ง root admin ไม่สำเร็จ', err)
  }
  return ok()
})
