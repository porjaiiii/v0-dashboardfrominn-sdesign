/** ค่าตั้งของระบบล็อกอินแดชบอร์ด (อ่านจาก env ทุกครั้งที่เรียก) */

import { readEnv } from '@/lib/google-sheets'
import { isSupabaseConfigured } from '@/lib/db/supabase-rest'

export const MIN_SECRET_LENGTH = 32

/** คีย์เซ็น cookie และลิงก์ในอีเมล — สั้นกว่า 32 ตัวถือว่ายังไม่ได้ตั้ง */
export function sessionSecret(): string | null {
  const secret = readEnv('DASHBOARD_SESSION_SECRET')
  return secret && secret.length >= MIN_SECRET_LENGTH ? secret : null
}

export function authConfigured(): boolean {
  return isSupabaseConfigured() && sessionSecret() !== null
}

/** URL ของเว็บสำหรับใส่ในอีเมล — บน production ต้องตั้ง APP_BASE_URL (ห้ามเดาจาก Host header) */
export function appBaseUrl(): string | null {
  const base = readEnv('APP_BASE_URL') ?? (process.env.NODE_ENV === 'production' ? undefined : 'http://localhost:3000')
  return base ? base.replace(/\/+$/, '') : null
}
