// ย้าย root admin ไปบัญชีอื่นที่ใช้งานอยู่: pnpm run transfer-root new-root@example.com
import { accounts, emailArg, fail } from './lib.mjs'

const email = emailArg('transfer-root')
const [account] = await accounts.select(`email=eq.${encodeURIComponent(email)}&select=id,status,is_root`)
if (!account) fail(`ไม่พบบัญชี ${email}`)
if (account.is_root) fail(`${email} เป็น root อยู่แล้ว`)
if (account.status !== 'active') fail(`${email} ยังไม่ได้อยู่ในสถานะใช้งาน (status: ${account.status})`)

await accounts.transferRoot(account.id)
console.log(`✓ ย้าย root ไปที่ ${email} แล้ว (root เดิมยังเป็นแอดมิน)`)
