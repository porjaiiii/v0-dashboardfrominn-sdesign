import { NextResponse } from 'next/server'
import { getAccountById } from '@/lib/auth/accounts'
import { field, jsonError, NO_STORE, publicAuthRoute, readBody, wrongCredentialsDelay } from '@/lib/auth/http'
import { LOGIN_BLOCK_MESSAGES, normalizeEmail, safeNext, TOO_MANY_ATTEMPTS_MESSAGE } from '@/lib/auth/policy'
import { setSessionCookie } from '@/lib/auth/session'
import { AuthApiError, verifyPassword } from '@/lib/auth/supabase-auth'

export const POST = publicAuthRoute(async (req) => {
  const body = await readBody(req)
  const email = normalizeEmail(field(body, 'email'))
  const password = field(body, 'password')
  if (!email || !password) return jsonError('กรุณากรอกอีเมลและรหัสผ่าน', 400)

  let userId: string | null
  try {
    userId = await verifyPassword(email, password)
  } catch (err) {
    if (err instanceof AuthApiError && err.status === 429) {
      return jsonError(TOO_MANY_ATTEMPTS_MESSAGE, 429)
    }
    throw err
  }

  // ผู้ใช้ Supabase Auth ที่ไม่มีแถวใน dashboard.accounts (เช่นบัญชีของแอปอื่น) ไม่ใช่บัญชีแดชบอร์ด
  const account = userId ? await getAccountById(userId) : null
  if (!account) {
    await wrongCredentialsDelay()
    return jsonError('อีเมลหรือรหัสผ่านไม่ถูกต้อง', 401)
  }
  // บอกสาเหตุได้เพราะผ่านการตรวจรหัสผ่านแล้ว
  if (account.status !== 'active') return jsonError(LOGIN_BLOCK_MESSAGES[account.status], 403, { reason: account.status })

  const res = NextResponse.json({ ok: true, redirect: safeNext(body.next, account.role) }, { headers: NO_STORE })
  setSessionCookie(res, account.id)
  return res
})
