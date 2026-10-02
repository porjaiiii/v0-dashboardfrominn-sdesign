/**
 * ตัวเรียก Supabase (PostgREST) แบบไม่พึ่ง SDK — ใช้ fetch ตรง ๆ
 * ใช้ได้เฉพาะฝั่งเซิร์ฟเวอร์ (route handlers) — ห้าม import จาก client component เพราะมี service-role key
 *
 * Env ที่ต้องตั้ง (ดู .env.example):
 *   SUPABASE_URL               เช่น https://xxxx.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY  service-role key หรือ Secret key (sb_secret_...) — ห้ามขึ้นต้นด้วย NEXT_PUBLIC_ เด็ดขาด
 *   SUPABASE_DB_SCHEMA         (ไม่บังคับ) ค่าเริ่มต้น "app"
 *
 * หมายเหตุ: schema `app` ต้องถูกเพิ่มใน Settings → API → Exposed schemas ของ Supabase
 */

import { readEnv } from '@/lib/google-sheets'

export function isSupabaseConfigured(): boolean {
  return !!readEnv('SUPABASE_URL') && !!readEnv('SUPABASE_SERVICE_ROLE_KEY')
}

/**
 * key รูปแบบใหม่ (sb_secret_...) ไม่ใช่ JWT จึงส่งเฉพาะ header apikey
 * key แบบเดิม (service_role, eyJ...) เป็น JWT ต้องส่งใน Authorization ด้วย
 */
function authHeaders(key: string): Record<string, string> {
  return key.startsWith('sb_') ? { apikey: key } : { apikey: key, Authorization: `Bearer ${key}` }
}

function config() {
  const url = readEnv('SUPABASE_URL')
  const key = readEnv('SUPABASE_SERVICE_ROLE_KEY')
  if (!url || !key) throw new Error('Supabase ยังไม่ได้ตั้งค่า (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)')
  return { url: url.replace(/\/+$/, ''), key, schema: readEnv('SUPABASE_DB_SCHEMA') || 'app' }
}

/** ค่าที่ใส่ใน filter ต้อง escape เพื่อไม่ให้ผู้ใช้แทรกเงื่อนไขเพิ่มได้ */
export function quoteFilterValue(value: string): string {
  return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`
}

export interface SelectOptions {
  /** ตัวอย่าง: 'id,name,users(full_name)' */
  select?: string
  /** query ของ PostgREST เช่น { status: 'eq.done', order: 'recorded_at.desc' } */
  filters?: Record<string, string>
  limit?: number
  offset?: number
}

export async function sbSelect<T>(table: string, opts: SelectOptions = {}): Promise<{ rows: T[]; total: number }> {
  const { url, key, schema } = config()
  const params = new URLSearchParams({ select: opts.select ?? '*', ...opts.filters })
  if (opts.limit !== undefined) params.set('limit', String(opts.limit))
  if (opts.offset !== undefined) params.set('offset', String(opts.offset))

  const res = await fetch(`${url}/rest/v1/${table}?${params}`, {
    headers: {
      ...authHeaders(key),
      'Accept-Profile': schema,
      Prefer: 'count=exact',
    },
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`Supabase ${table}: ${res.status} ${await res.text()}`)

  const rows = (await res.json()) as T[]
  // Content-Range: 0-9/500
  const total = Number(res.headers.get('content-range')?.split('/')[1] ?? rows.length)
  return { rows, total: Number.isFinite(total) ? total : rows.length }
}

export async function sbUpdate<T>(
  table: string,
  filters: Record<string, string>,
  patch: Record<string, unknown>,
): Promise<T[]> {
  const { url, key, schema } = config()
  const res = await fetch(`${url}/rest/v1/${table}?${new URLSearchParams(filters)}`, {
    method: 'PATCH',
    headers: {
      ...authHeaders(key),
      'Content-Profile': schema,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify(patch),
  })
  if (!res.ok) throw new Error(`Supabase update ${table}: ${res.status} ${await res.text()}`)
  return (await res.json()) as T[]
}

/**
 * อ่านทุกแถวของตาราง (วนทีละ 1,000 แถว สูงสุด 100,000 แถว)
 * จำเป็นเพราะ Supabase จำกัดจำนวนแถวต่อคำขอ (ค่าเริ่มต้น 1,000) ถึงแม้จะขอ limit มากกว่านั้น
 * ต้องส่ง order ที่คงที่ใน filters (เช่น order=id.asc) เพื่อไม่ให้แถวซ้ำ/ตกหล่นระหว่างหน้า
 */
export async function sbSelectAll<T>(table: string, opts: Omit<SelectOptions, 'limit' | 'offset'> = {}): Promise<T[]> {
  const PAGE = 1000
  const out: T[] = []
  for (let page = 0; page < 100; page++) {
    const { rows } = await sbSelect<T>(table, { ...opts, limit: PAGE, offset: page * PAGE })
    out.push(...rows)
    if (rows.length < PAGE) break
  }
  return out
}
