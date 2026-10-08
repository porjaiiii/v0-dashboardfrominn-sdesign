/**
 * ตาราง dashboard.accounts — บทบาท/สถานะของบัญชีแดชบอร์ด (Supabase Auth เก็บแค่อีเมล+รหัสผ่าน)
 * ใช้ได้เฉพาะฝั่งเซิร์ฟเวอร์ ไม่แตะ schema `app` ของแอปจัดการขยะ
 */

import { likePattern, quoteFilterValue, sbSelect, sbUpdate } from '@/lib/db/supabase-rest'
import type { ListParams, Page } from '@/lib/db/types'
import { ACCOUNT_STATUSES, EMAIL_COOLDOWN_MS, normalizeEmail, type AccountStatus, type Role } from './policy'

export const DASHBOARD_SCHEMA = 'dashboard'
const TABLE = 'accounts'

export interface AccountRow {
  id: string
  email: string
  full_name: string
  role: Role
  status: AccountStatus
  is_root: boolean
  email_verified_at: string | null
  approved_at: string | null
  approved_by: string | null
  sessions_valid_after: string
  last_email_sent_at: string | null
  created_at: string
  updated_at: string
}

export type AccountListItem = Pick<
  AccountRow,
  'id' | 'email' | 'full_name' | 'role' | 'status' | 'is_root' | 'created_at' | 'approved_at' | 'email_verified_at'
>

const LIST_COLUMNS = 'id,email,full_name,role,status,is_root,created_at,approved_at,email_verified_at'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
export const isUuid = (v: string) => UUID_RE.test(v)

async function findOne(filters: Record<string, string>): Promise<AccountRow | null> {
  const { rows } = await sbSelect<AccountRow>(TABLE, { schema: DASHBOARD_SCHEMA, filters, limit: 1 })
  return rows[0] ?? null
}

export async function getAccountById(id: string): Promise<AccountRow | null> {
  return isUuid(id) ? findOne({ id: `eq.${id}` }) : null
}

export function getAccountByEmail(email: string): Promise<AccountRow | null> {
  return findOne({ email: `eq.${normalizeEmail(email)}` })
}

export function getRootAccount(): Promise<AccountRow | null> {
  return findOne({ is_root: 'is.true' })
}

/** อัปเดตแบบมีเงื่อนไข — คืนแถวที่ถูกอัปเดต (ว่าง = เงื่อนไขไม่ตรง เช่นสถานะเปลี่ยนไปแล้ว) */
export function updateAccounts(filters: Record<string, string>, patch: Record<string, unknown>): Promise<AccountRow[]> {
  return sbUpdate<AccountRow>(TABLE, filters, patch, { schema: DASHBOARD_SCHEMA })
}

/** จองสิทธิ์ส่งอีเมล 1 ฉบับต่อ 60 วินาทีต่อบัญชี (อัปเดตแบบมีเงื่อนไขครั้งเดียว กันกดรัว) */
export async function claimEmailSlot(id: string, now = Date.now()): Promise<boolean> {
  const cutoff = new Date(now - EMAIL_COOLDOWN_MS).toISOString()
  const rows = await updateAccounts(
    { id: `eq.${id}`, or: `(last_email_sent_at.is.null,last_email_sent_at.lt.${cutoff})` },
    { last_email_sent_at: new Date(now).toISOString() },
  )
  return rows.length > 0
}

export function listAccounts(p: ListParams): Promise<Page<AccountListItem>> {
  const filters: Record<string, string> = { order: 'created_at.desc,id.asc' }
  if (p.status && (ACCOUNT_STATUSES as readonly string[]).includes(p.status)) filters.status = `eq.${p.status}`
  if (p.q) {
    const pattern = quoteFilterValue(likePattern(p.q))
    filters.or = `(full_name.ilike.${pattern},email.ilike.${pattern})`
  }
  return sbSelect<AccountListItem>(TABLE, {
    schema: DASHBOARD_SCHEMA,
    select: LIST_COLUMNS,
    filters,
    limit: p.pageSize,
    offset: (p.page - 1) * p.pageSize,
  })
}
