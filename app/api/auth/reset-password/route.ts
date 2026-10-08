import { getAccountById, updateAccounts } from '@/lib/auth/accounts'
import { sessionSecret } from '@/lib/auth/config'
import { field, jsonError, ok, publicAuthRoute, readBody } from '@/lib/auth/http'
import { LINK_INVALID_MESSAGE, passwordError, WEAK_PASSWORD_MESSAGE } from '@/lib/auth/policy'
import { hasAuthErrorCode, updateAuthUserPassword } from '@/lib/auth/supabase-auth'
import { verifyToken } from '@/lib/auth/tokens'

export const POST = publicAuthRoute(async (req) => {
  const body = await readBody(req)
  const password = field(body, 'password')
  const weak = passwordError(password)
  if (weak) return jsonError(weak, 400)

  const claims = verifyToken(sessionSecret() ?? '', 'reset-password', field(body, 'token'))
  const account = claims ? await getAccountById(claims.sub) : null
  if (!claims || !account || account.status === 'disabled' || Date.parse(account.sessions_valid_after) !== claims.sva) {
    return jsonError(LINK_INVALID_MESSAGE, 400)
  }

  // ใช้ลิงก์ได้ครั้งเดียว: เลื่อน sessions_valid_after แบบมีเงื่อนไขก่อน (ทุกเซสชันเดิมใช้ไม่ได้ทันที)
  const [claimed] = await updateAccounts(
    { id: `eq.${account.id}`, sessions_valid_after: `eq.${account.sessions_valid_after}` },
    { sessions_valid_after: new Date().toISOString() },
  )
  if (!claimed) return jsonError(LINK_INVALID_MESSAGE, 400)

  try {
    await updateAuthUserPassword(account.id, password)
  } catch (err) {
    // ลิงก์ถูกใช้ไปแล้วตอนเลื่อน sessions_valid_after — ให้ขอลิงก์ใหม่
    if (hasAuthErrorCode(err, 'weak_password')) return jsonError(`${WEAK_PASSWORD_MESSAGE} แล้วขอลิงก์ตั้งรหัสผ่านใหม่อีกครั้ง`, 400)
    throw err
  }
  return ok()
})
