/**
 * Supabase Auth (GoTrue) ผ่าน REST — ไม่ใช้ SDK, ใช้ service-role key ฝั่งเซิร์ฟเวอร์เท่านั้น
 * Supabase Auth เก็บแค่อีเมล+รหัสผ่าน; บทบาท/สถานะอยู่ใน dashboard.accounts (ดู ./accounts)
 */

import { authHeaders, supabaseConfig } from '@/lib/db/supabase-rest'

export class AuthApiError extends Error {
  name = 'AuthApiError'
  constructor(
    public status: number,
    message: string,
    /** รหัสข้อผิดพลาดของ Supabase Auth เช่น email_exists, weak_password */
    public code?: string,
  ) {
    super(message)
  }
}

/** Supabase Auth ส่งรหัสใน error_code (รูปแบบเดิม) หรือ code (API version ใหม่) */
function errorCode(body: string): string | undefined {
  try {
    const json = JSON.parse(body) as { error_code?: unknown; code?: unknown }
    if (typeof json.error_code === 'string') return json.error_code
    if (typeof json.code === 'string') return json.code
  } catch {
    // ไม่ใช่ JSON
  }
  return undefined
}

async function authFetch(path: string, method: string, body?: unknown): Promise<Response> {
  const { url, key } = supabaseConfig()
  return fetch(`${url}/auth/v1${path}`, {
    method,
    headers: { ...authHeaders(key), 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: 'no-store',
  })
}

async function ensureOk(res: Response, what: string): Promise<Response> {
  if (res.ok) return res
  const text = await res.text()
  throw new AuthApiError(res.status, `Supabase Auth ${what}: ${res.status} ${text}`, errorCode(text))
}

/** ตรวจรหัสผ่าน — คืน user id เมื่อถูกต้อง, null เมื่อผิด (token ที่ Supabase ออกให้ถูกทิ้ง เราออก cookie เอง) */
export async function verifyPassword(email: string, password: string): Promise<string | null> {
  const res = await authFetch('/token?grant_type=password', 'POST', { email, password })
  if (res.status === 400 || res.status === 401) return null
  await ensureOk(res, 'password grant')
  const json = (await res.json()) as { user?: { id?: string } }
  return json.user?.id ?? null
}

/**
 * สร้างผู้ใช้ — trigger dashboard_on_auth_user_created สร้างแถว dashboard.accounts ใน transaction เดียวกัน
 * email_confirm: true เพราะเรายืนยันอีเมลเอง (สถานะ unverified → pending ใน dashboard.accounts)
 */
export async function createAuthUser(input: { email: string; password: string; fullName: string }): Promise<string> {
  const res = await ensureOk(
    await authFetch('/admin/users', 'POST', {
      email: input.email,
      password: input.password,
      email_confirm: true,
      app_metadata: { source: 'dashboard' },
      user_metadata: { full_name: input.fullName },
    }),
    'create user',
  )
  return ((await res.json()) as { id: string }).id
}

export async function updateAuthUserPassword(id: string, password: string): Promise<void> {
  await ensureOk(await authFetch(`/admin/users/${id}`, 'PUT', { password }), 'update password')
}

/** ลบผู้ใช้ → แถวใน dashboard.accounts ถูกลบตาม (on delete cascade) */
export async function deleteAuthUser(id: string): Promise<void> {
  await ensureOk(await authFetch(`/admin/users/${id}`, 'DELETE'), 'delete user')
}
