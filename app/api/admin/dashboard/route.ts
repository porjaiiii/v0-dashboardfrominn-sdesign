import { getDashboard } from '@/lib/db/dashboard-queries'
import { handle } from '@/lib/db/route-helpers'

/** GET /api/admin/dashboard?year=2026 — ยอดรวม + ข้อมูลรายเดือนของปีที่เลือก + สรุปเดือนปัจจุบัน */
export const GET = handle(async (req) => {
  const y = Number(req.nextUrl.searchParams.get('year'))
  return getDashboard(Number.isInteger(y) && y > 1990 && y < 2200 ? y : new Date().getFullYear())
})
