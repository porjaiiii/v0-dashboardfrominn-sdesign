import { listAccounts } from '@/lib/auth/accounts'
import { listRoute } from '@/lib/db/route-helpers'

/** รายการบัญชีแดชบอร์ด (ตัวกรอง status, ค้นหา q จากชื่อ/อีเมล, แบ่งหน้า) */
export const GET = listRoute(listAccounts)
