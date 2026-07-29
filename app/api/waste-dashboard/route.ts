import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 60
export const dynamic = 'force-dynamic'

const NO_STORE = { 'Cache-Control': 'no-store' } as const
const GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzJnOKocFO6Tyqsy7NUn060BtFr4oAtE4jaHbcrsMcEozzJLl0JcXvY4VAxg-XvkGu2/exec'

export async function GET(request: NextRequest) {
  try {
    // 1. ดึง Waste Records ทั้งหมดด้วย action: 'getRecords'
    const recordsRes = await fetch(GOOGLE_APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'getRecords',
        type: 'all', // หรือส่งพารามิเตอร์ตามที่ GAS ฝั่งบันทึกขยะของคุณตั้งไว้
      }),
    })

    if (!recordsRes.ok) {
      return NextResponse.json({ error: 'Failed to fetch waste records' }, { status: 500, headers: NO_STORE })
    }

    const recordsData = await recordsRes.json()
    const rawRecords = recordsData.records || []

    // 2. ดึง user_id ทั้งหมดที่ไม่ซ้ำกัน (Unique User IDs)
    const uniqueUserIds: string[] = Array.from(
      new Set(rawRecords.map((r: { user_id: string }) => r.user_id).filter(Boolean))
    )

    // 3. ดึง subdistrict ของแต่ละ user_id ผ่าน action: 'getUser' แบบยิงคู่ขนาน (Promise.all)
    const userSubdistrictMap: Record<string, string> = {}

    await Promise.all(
      uniqueUserIds.map(async (userId) => {
        try {
          const userRes = await fetch(GOOGLE_APPS_SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'getUser',
              lineUserId: userId,
            }),
          })

          if (userRes.ok) {
            const userData = await userRes.json()
            if (userData.status === 'success' && userData.data?.subdistrict) {
              userSubdistrictMap[userId] = userData.data.subdistrict
            }
          }
        } catch (e) {
          console.warn(`[v0] Could not fetch subdistrict for user_id: ${userId}`, e)
        }
      })
    )

    // 4. แมป subdistrict กลับเข้าตัว Waste Record แต่ละอัน
    const enrichedRecords = rawRecords.map((record: any) => ({
      ...record,
      subdistrict: userSubdistrictMap[record.user_id] || 'ไม่ระบุ',
    }))

    return NextResponse.json({ records: enrichedRecords }, { headers: NO_STORE })
  } catch (error) {
    console.error('[v0] Dashboard API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: NO_STORE })
  }
}