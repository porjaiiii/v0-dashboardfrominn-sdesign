/**
 * กติกาของบัญชีแดชบอร์ด — ฟังก์ชันล้วน ไม่มี I/O
 * ใช้ได้ทั้งฝั่งเซิร์ฟเวอร์และเบราว์เซอร์ (ห้าม import โมดูลฝั่งเซิร์ฟเวอร์ในไฟล์นี้)
 */

export type Role = 'user' | 'admin'
export type AccountStatus = 'unverified' | 'pending' | 'active' | 'disabled'

export const ROLES: readonly Role[] = ['user', 'admin']
export const ACCOUNT_STATUSES: readonly AccountStatus[] = ['unverified', 'pending', 'active', 'disabled']

export const ROLE_LABELS: Record<Role, string> = { user: 'ผู้ใช้', admin: 'แอดมิน' }

export const STATUS_LABELS: Record<AccountStatus, string> = {
  unverified: 'ยังไม่ยืนยันอีเมล',
  pending: 'รออนุมัติ',
  active: 'ใช้งาน',
  disabled: 'ปิดใช้งาน',
}

/** ข้อความเมื่อรหัสผ่านถูกแต่ยังเข้าใช้ไม่ได้ (แสดงหลังตรวจรหัสผ่านแล้วเท่านั้น) */
export const LOGIN_BLOCK_MESSAGES: Record<Exclude<AccountStatus, 'active'>, string> = {
  unverified: 'กรุณายืนยันอีเมลก่อน โดยกดลิงก์ในอีเมลที่เราส่งให้',
  pending: 'บัญชีของคุณกำลังรอผู้ดูแลระบบอนุมัติ เราจะแจ้งทางอีเมลเมื่ออนุมัติแล้ว',
  disabled: 'บัญชีนี้ถูกปิดใช้งาน กรุณาติดต่อผู้ดูแลระบบ',
}

export const LINK_INVALID_MESSAGE = 'ลิงก์ไม่ถูกต้อง หมดอายุ หรือถูกใช้ไปแล้ว'
export const WEAK_PASSWORD_MESSAGE = 'รหัสผ่านไม่ผ่านข้อกำหนดของระบบ กรุณาตั้งรหัสผ่านที่ปลอดภัยกว่านี้'
export const TOO_MANY_ATTEMPTS_MESSAGE = 'พยายามบ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่'
export const SIGNUP_PASSWORD_MISMATCH_MESSAGE = 'รหัสผ่านไม่ถูกต้อง — ใช้รหัสผ่านที่ตั้งไว้ตอนสมัคร'
export const STALE_MESSAGE = 'สถานะบัญชีเปลี่ยนไปแล้ว กรุณาโหลดหน้าใหม่'

/** สมัครบัญชีใหม่ได้ไม่เกินกี่บัญชีต่อชั่วโมง (กันใช้ฟอร์มสมัครส่งอีเมลสแปม) */
export const SIGNUP_HOURLY_CAP = 20
export const SIGNUP_BUSY_MESSAGE = 'มีผู้สมัครจำนวนมากในขณะนี้ กรุณาลองใหม่ภายหลัง'

export const PASSWORD_MIN_LENGTH = 8
/** bcrypt ของ Supabase Auth รับได้ไม่เกิน 72 ไบต์ (UTF-8) — อักษรไทย 1 ตัวนับเป็น 3 ไบต์ */
export const PASSWORD_MAX_BYTES = 72
export const EMAIL_COOLDOWN_MS = 60_000
export const VERIFY_EMAIL_TTL_MS = 24 * 60 * 60 * 1000
export const RESET_PASSWORD_TTL_MS = 60 * 60 * 1000

export const isRole = (v: unknown): v is Role => v === 'user' || v === 'admin'
export const normalizeEmail = (v: string) => v.trim().toLowerCase()
export const isEmail = (v: string) => v.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
export const cleanName = (v: string) => v.replace(/[\u0000-\u001f\u007f]+/g, ' ').replace(/ {2,}/g, ' ').trim()

export function passwordError(password: string): string | null {
  if (password.length < PASSWORD_MIN_LENGTH) return `รหัสผ่านต้องมีอย่างน้อย ${PASSWORD_MIN_LENGTH} ตัวอักษร`
  if (new TextEncoder().encode(password).length > PASSWORD_MAX_BYTES) {
    return `รหัสผ่านยาวเกินไป (ไม่เกิน ${PASSWORD_MAX_BYTES} ไบต์ — อักษรไทย 1 ตัวนับเป็น 3 ไบต์)`
  }
  return null
}

export function signupError(input: { fullName: string; email: string; password: string }): string | null {
  if (!input.fullName || input.fullName.length > 100) return 'กรุณากรอกชื่อ (ไม่เกิน 100 ตัวอักษร)'
  if (!isEmail(input.email)) return 'รูปแบบอีเมลไม่ถูกต้อง'
  return passwordError(input.password)
}

export type SignupDecision = 'create' | 'refresh-unverified' | 'already-registered'

/** อีเมลที่ยังไม่ยืนยันสมัครซ้ำได้ (คนที่เข้าอีเมลได้จริงจะได้บัญชีไป) — สถานะอื่นถือว่าลงทะเบียนแล้ว */
export function signupDecision(existing: AccountStatus | null): SignupDecision {
  if (existing === null) return 'create'
  return existing === 'unverified' ? 'refresh-unverified' : 'already-registered'
}

export const HOME_BY_ROLE: Record<Role, string> = { admin: '/admin/dashboard', user: '/map' }

const AUTH_PAGES = ['/login', '/signup', '/forgot-password', '/reset-password', '/verify-email', '/admin/login']

/** ปลายทางหลังล็อกอิน — รับเฉพาะ path ภายในที่บทบาทนั้นเข้าได้ (กัน open redirect) */
export function safeNext(next: unknown, role: Role): string {
  const home = HOME_BY_ROLE[role]
  if (typeof next !== 'string' || !next.startsWith('/') || next.startsWith('//')) return home
  // เบราว์เซอร์ตัด tab/ขึ้นบรรทัดออกจาก URL และมอง \ เป็น / → "/\t/evil.com" กลายเป็น "//evil.com"
  if (next.includes('\\') || /[\u0000-\u001f\u007f]/.test(next)) return home
  const path = next.split(/[?#]/)[0]
  if (AUTH_PAGES.includes(path)) return home
  if (role !== 'admin' && (path === '/admin' || path.startsWith('/admin/'))) return home
  return next
}

/* ───────────── การจัดการบัญชีโดยแอดมิน ───────────── */

export interface ActionSubject {
  id: string
  status: AccountStatus
  is_root: boolean
}

export type Refusal = { ok: false; status: 400 | 403 | 409; error: string }

export type ActionPlan =
  | { ok: true; expectStatus: AccountStatus; patch: Record<string, unknown>; notify?: 'approved' | 'rejected' }
  | Refusal

type Allowed = Extract<ActionPlan, { ok: true }>

const STALE: Refusal = { ok: false, status: 409, error: STALE_MESSAGE }
const BAD_ROLE: Refusal = { ok: false, status: 400, error: 'บทบาทไม่ถูกต้อง' }

/** บัญชี root และบัญชีของตัวเองแก้ไข/ลบจากหน้าแดชบอร์ดไม่ได้ */
export function protectedRefusal(actorId: string, target: ActionSubject): Refusal | null {
  if (target.is_root) return { ok: false, status: 403, error: 'บัญชี root แก้ไขหรือลบจากหน้านี้ไม่ได้' }
  if (target.id === actorId) return { ok: false, status: 403, error: 'แก้ไขหรือลบบัญชีของตัวเองไม่ได้' }
  return null
}

function whenStatus(target: ActionSubject, status: AccountStatus, plan: Omit<Allowed, 'ok' | 'expectStatus'>): ActionPlan {
  return target.status === status ? { ok: true, expectStatus: status, ...plan } : STALE
}

/**
 * แปลงคำสั่งของแอดมินเป็นการอัปเดต — expectStatus ใช้เป็นเงื่อนไขตอนอัปเดต
 * เพื่อให้แอดมินสองคนกดพร้อมกันได้ 409 แทนการเขียนทับกัน
 */
export function planAccountAction(
  actorId: string,
  target: ActionSubject,
  action: unknown,
  role: unknown,
  now = new Date(),
): ActionPlan {
  const refusal = protectedRefusal(actorId, target)
  if (refusal) return refusal
  const at = now.toISOString()

  switch (action) {
    case 'approve':
      if (!isRole(role)) return BAD_ROLE
      return whenStatus(target, 'pending', {
        patch: { status: 'active', role, approved_at: at, approved_by: actorId },
        notify: 'approved',
      })
    case 'reject':
      return whenStatus(target, 'pending', { patch: { status: 'disabled' }, notify: 'rejected' })
    case 'set-role':
      if (!isRole(role)) return BAD_ROLE
      return whenStatus(target, 'active', { patch: { role } })
    case 'disable':
      return whenStatus(target, 'active', { patch: { status: 'disabled' } })
    case 'enable':
      return whenStatus(target, 'disabled', { patch: { status: 'active', approved_at: at, approved_by: actorId } })
    default:
      return { ok: false, status: 400, error: 'คำสั่งไม่ถูกต้อง' }
  }
}
