// ตัวช่วยของสคริปต์จัดการ root admin — รันด้วย node --env-file=.env.local (ดู package.json)
import { argv, env, exit } from 'node:process'

export function fail(message) {
  console.error(`✗ ${message}`)
  exit(1)
}

const url = env.SUPABASE_URL?.trim().replace(/\/+$/, '')
const key = env.SUPABASE_SERVICE_ROLE_KEY?.trim()
if (!url || !key) fail('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY ยังไม่ได้ตั้งค่า (ใส่ใน .env.local)')

// key แบบใหม่ (sb_secret_...) ไม่ใช่ JWT จึงส่งเฉพาะ apikey — เหมือน lib/db/supabase-rest.ts
const keyHeaders = key.startsWith('sb_') ? { apikey: key } : { apikey: key, Authorization: `Bearer ${key}` }
const profile = { 'Accept-Profile': 'dashboard', 'Content-Profile': 'dashboard' }

async function call(path, { method = 'GET', body, headers = {} } = {}) {
  const res = await fetch(`${url}${path}`, {
    method,
    headers: { ...keyHeaders, 'Content-Type': 'application/json', ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const text = await res.text()
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status} ${text}`)
  return text ? JSON.parse(text) : null
}

export const accounts = {
  select: (query) => call(`/rest/v1/accounts?${query}`, { headers: profile }),
  update: (query, patch) =>
    call(`/rest/v1/accounts?${query}`, { method: 'PATCH', body: patch, headers: { ...profile, Prefer: 'return=representation' } }),
  transferRoot: (id) => call('/rest/v1/rpc/transfer_root', { method: 'POST', body: { p_new_root: id }, headers: profile }),
}

export const createAuthUser = (body) => call('/auth/v1/admin/users', { method: 'POST', body })

export function emailArg(command) {
  const email = argv[2]?.trim().toLowerCase()
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail(`ระบุอีเมล เช่น pnpm run ${command} you@example.com`)
  return email
}
