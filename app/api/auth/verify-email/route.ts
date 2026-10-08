import { updateAccounts } from '@/lib/auth/accounts'
import { sessionSecret } from '@/lib/auth/config'
import { field, jsonError, ok, publicAuthRoute, readBody } from '@/lib/auth/http'
import { notifyRootOfSignup } from '@/lib/auth/mailers'
import { LINK_INVALID_MESSAGE } from '@/lib/auth/policy'
import { verifyToken } from '@/lib/auth/tokens'

/**
 * ยืนยันอีเมล: unverified → pending แล้วแจ้ง root admin
 * เป็น POST จากปุ่มในหน้า /verify-email (ไม่ใช่ GET) — ตัวสแกนลิงก์ในอีเมลจึงกดแทนผู้ใช้ไม่ได้
 * อัปเดตแบบมีเงื่อนไข status = unverified ทำให้ลิงก์ใช้ได้ครั้งเดียว
 */
export const POST = publicAuthRoute(async (req) => {
  const claims = verifyToken(sessionSecret() ?? '', 'verify-email', field(await readBody(req), 'token'))
  if (!claims) return jsonError(LINK_INVALID_MESSAGE, 400)

  const [account] = await updateAccounts(
    { id: `eq.${claims.sub}`, status: 'eq.unverified' },
    { status: 'pending', email_verified_at: new Date().toISOString() },
  )
  if (!account) return jsonError(LINK_INVALID_MESSAGE, 400)

  await notifyRootOfSignup(account)
  return ok()
})
