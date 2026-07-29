import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 60
export const dynamic = 'force-dynamic'

const NO_STORE = { 'Cache-Control': 'no-store' } as const
const GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzJnOKocFO6Tyqsy7NUn060BtFr4oAtE4jaHbcrsMcEozzJLl0JcXvY4VAxg-XvkGu2/exec'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const year = searchParams.get('year') || '2569'

    console.log('[v0] Fetching dashboard waste records for year:', year)

    const payload = {
      action: 'getDashboardRecords', // หรือ 'getRecords' แล้วแต่ action ใน GAS
      type: 'all',
      year: year,
    }

    // Helper Retry แบบเดียวกับไฟล์ดึงโปรไฟล์เพื่อแก้ปัญหาน้ำแข็งเกาะ (Cold Start) ของ GAS
    const fetchWithRetry = async (retries = 2): Promise<Response> => {
      for (let attempt = 1; attempt <= retries; attempt++) {
        const controller = new AbortController()
        const timer = setTimeout(() => controller.abort(), 25_000)
        try {
          const res = await fetch(GOOGLE_APPS_SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            signal: controller.signal,
          })
          clearTimeout(timer)
          return res
        } catch (err: unknown) {
          clearTimeout(timer)
          if (attempt === retries) throw err
          await new Promise((r) => setTimeout(r, 1_000))
        }
      }
      throw new Error('Unreachable')
    }

    const response = await fetchWithRetry(2)

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch waste records from GAS' },
        { status: response.status, headers: NO_STORE }
      )
    }

    const data = await response.json()

    // คืนค่ารายการ records (รองรับทั้ง response.records หรือ response.data)
    return NextResponse.json(
      {
        records: data.records || data.data || [],
        status: 'success'
      },
      { headers: NO_STORE }
    )
  } catch (error) {
    console.error('[v0] Dashboard API Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch waste records' },
      { status: 500, headers: NO_STORE }
    )
  }
}