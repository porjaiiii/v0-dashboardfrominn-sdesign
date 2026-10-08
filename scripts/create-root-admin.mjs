// สร้าง root admin คนแรก: pnpm run create-root-admin you@example.com
import { randomBytes } from 'node:crypto'
import { stdin, stdout } from 'node:process'
import { createInterface } from 'node:readline/promises'
import { accounts, createAuthUser, emailArg, fail } from './lib.mjs'

const email = emailArg('create-root-admin')

const [root] = await accounts.select('is_root=is.true&select=email')
if (root) fail(`มี root admin อยู่แล้ว (${root.email}) — ใช้ pnpm run transfer-root <email> เพื่อย้าย root`)
const [existing] = await accounts.select(`email=eq.${encodeURIComponent(email)}&select=id`)
if (existing) fail(`${email} มีบัญชีอยู่แล้ว — ถ้าบัญชีนั้นใช้งานอยู่ ใช้ pnpm run transfer-root ${email}`)

const rl = createInterface({ input: stdin, output: stdout })
const fullName = (await rl.question('ชื่อ-นามสกุลของ root admin: ')).trim()
rl.close()
if (!fullName) fail('ต้องระบุชื่อ')

const password = randomBytes(15).toString('base64url')
const user = await createAuthUser({
  email,
  password,
  email_confirm: true,
  app_metadata: { source: 'dashboard' },
  user_metadata: { full_name: fullName },
})

// trigger สร้างแถวเป็น user/unverified แล้ว — ยกขึ้นเป็น root admin
try {
  const now = new Date().toISOString()
  const [row] = await accounts.update(`id=eq.${user.id}`, {
    role: 'admin',
    status: 'active',
    is_root: true,
    email_verified_at: now,
    approved_at: now,
  })
  if (!row) throw new Error('ไม่พบแถวใน dashboard.accounts — รัน supabase/dashboard_schema.sql แล้วหรือยัง?')
} catch (err) {
  fail(
    `สร้างผู้ใช้ใน Supabase Auth แล้ว (id ${user.id}) แต่ตั้งเป็น root ไม่สำเร็จ: ${err.message}\n` +
      '  ลบผู้ใช้นี้ที่ Supabase → Authentication → Users แล้วรันใหม่',
  )
}

console.log(`✓ สร้าง root admin ${email} แล้ว`)
console.log(`  รหัสผ่านชั่วคราว (แสดงครั้งเดียว): ${password}`)
console.log('  เข้าสู่ระบบที่ /login แล้วเปลี่ยนรหัสผ่านผ่าน "ลืมรหัสผ่าน"')
