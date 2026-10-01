import { NextResponse } from 'next/server'
import { getSummary } from '@/lib/db/admin-queries'

/**
 * ตัวเลขสรุปรวมสำหรับหน้าแรกสาธารณะ — เปิดให้ทุกคนอ่านได้
 * ส่งเฉพาะยอดรวม (ไม่มีข้อมูลรายบุคคล) และ cache ไว้ 5 นาทีเพื่อลดภาระฐานข้อมูล
 */
export async function GET() {
  try {
    const s = await getSummary()
    return NextResponse.json(
      { users: s.users, totalWeightKg: s.totalWeightKg, totalCo2Kg: s.totalCo2Kg },
      { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' } },
    )
  } catch (err) {
    console.error('[api/public/stats]', err)
    return NextResponse.json({ error: 'ไม่สามารถโหลดสถิติได้' }, { status: 500 })
  }
}
