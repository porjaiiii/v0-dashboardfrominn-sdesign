import { countRecentSignups, getAccountByEmail, getAccountById, updateAccounts, type AccountRow } from '@/lib/auth/accounts'
import { field, jsonError, ok, publicAuthRoute, readBody } from '@/lib/auth/http'
import { sendVerificationEmail } from '@/lib/auth/mailers'
import {
  cleanName,
  normalizeEmail,
  SIGNUP_BUSY_MESSAGE,
  SIGNUP_HOURLY_CAP,
  signupDecision,
  signupError,
  WEAK_PASSWORD_MESSAGE,
} from '@/lib/auth/policy'
import { createAuthUser, hasAuthErrorCode, updateAuthUserPassword } from '@/lib/auth/supabase-auth'

const ALREADY_REGISTERED = 'อีเมลนี้ลงทะเบียนแล้ว — เข้าสู่ระบบ หรือใช้ "ลืมรหัสผ่าน"'

/**
 * สมัครบัญชีแดชบอร์ด → สถานะ unverified + ส่งลิงก์ยืนยันอีเมล
 * อีเมลที่ยัง unverified สมัครซ้ำได้: แทนชื่อ/รหัสผ่านแล้วส่งลิงก์ใหม่ (คนที่เข้าอีเมลได้จริงคือเจ้าของบัญชี)
 */
export const POST = publicAuthRoute(async (req) => {
  const body = await readBody(req)
  const input = {
    fullName: cleanName(field(body, 'fullName')),
    email: normalizeEmail(field(body, 'email')),
    password: field(body, 'password'),
  }
  const invalid = signupError(input)
  if (invalid) return jsonError(invalid, 400)

  const existing = await getAccountByEmail(input.email)
  const decision = signupDecision(existing?.status ?? null)
  if (decision === 'already-registered') return jsonError(ALREADY_REGISTERED, 409)

  let account: AccountRow | null
  if (decision === 'create') {
    // จำกัดบัญชีใหม่ต่อชั่วโมงทั้งระบบ — ฟอร์มสาธารณะนี้ส่งอีเมลออกได้
    const since = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    if ((await countRecentSignups(since)) >= SIGNUP_HOURLY_CAP) return jsonError(SIGNUP_BUSY_MESSAGE, 429)
    try {
      // trigger dashboard_on_auth_user_created สร้างแถว dashboard.accounts ใน transaction เดียวกัน
      account = await getAccountById(await createAuthUser(input))
    } catch (err) {
      if (hasAuthErrorCode(err, 'email_exists', 'user_already_exists')) return jsonError(ALREADY_REGISTERED, 409)
      if (hasAuthErrorCode(err, 'weak_password')) return jsonError(WEAK_PASSWORD_MESSAGE, 400)
      throw err
    }
    if (!account) throw new Error('dashboard.accounts row missing after createAuthUser — is the trigger installed?')
  } else {
    // อัปเดตแบบมีเงื่อนไขก่อน: ถ้าเจ้าของเพิ่งยืนยันอีเมลไปแล้ว จะไม่แตะรหัสผ่าน
    account = (await updateAccounts({ id: `eq.${existing!.id}`, status: 'eq.unverified' }, { full_name: input.fullName }))[0] ?? null
    if (!account) return jsonError(ALREADY_REGISTERED, 409)
    try {
      await updateAuthUserPassword(account.id, input.password)
    } catch (err) {
      if (hasAuthErrorCode(err, 'weak_password')) return jsonError(WEAK_PASSWORD_MESSAGE, 400)
      throw err
    }
  }

  return ok({ emailSent: await sendVerificationEmail(account) })
})
