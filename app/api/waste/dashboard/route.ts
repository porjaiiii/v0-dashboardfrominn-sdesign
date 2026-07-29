import { NextRequest, NextResponse } from 'next/server'

// ─── Environment Variables & Constants (ตรงกับระบบหลังบ้านทั้งหมด) ──────────────
const POINTS_SPREADSHEET_ID = process.env.POINTS_SPREADSHEET_ID
const SHEETS_API_KEY = process.env.GOOGLE_SHEETS_API_KEY

// Registration spreadsheet (ดึงจาก env หรือใช้ Default ID ตัวเดียวกัน)
const REG_SHEETS_ID = process.env.REGISTRATION_SHEETS_ID || '1vvBe_ZySfSq4oP8tfwHDUg-Jo3gBr9QanQWqLATAkNE'
const REG_TAB = 'Registration'
const TOURIST_USER_TYPE = 'นักท่องเที่ยว'

export type WasteRecord = {
  id: string
  date: string
  lineUserId: string
  userName: string
  subdistrict: string
  isTourist: boolean
  wasteType: string
  weight: number
  carbon: number
  points: number
}

export type WasteTypeSummary = {
  type: string
  weight: number
  carbon: number
  percentage: number
}

type UserInfo = {
  name: string
  avatar: string
  location: string
  isTourist: boolean
}

// ─── Helper Functions (ถอดแบบจากโค้ดอ้างอิง) ──────────────────────────────────

// Exact match (lowercase)
function colIndex(headers: string[], name: string): number {
  const target = name.trim().toLowerCase()
  return headers.findIndex((h) => String(h ?? '').trim().toLowerCase() === target)
}

// Tolerant match (ค้นหาคำย่อยภาษาไทย/อังกฤษ)
function findCol(headers: string[], candidates: string[]): number {
  const norm = (s: unknown) => String(s ?? '').trim().toLowerCase()
  return headers.findIndex((h) => candidates.some((c) => norm(h).includes(norm(c))))
}

function toNumber(value: unknown): number {
  const n = typeof value === 'number' ? value : parseFloat(String(value ?? ''))
  return Number.isFinite(n) ? n : 0
}

function str(value: unknown): string {
  return value == null ? '' : String(value).trim()
}

// อ่าน Tab ตรงจาก Google Sheets API v4
async function readTab(sheetId: string, tab: string): Promise<string[][]> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(
    tab
  )}?key=${SHEETS_API_KEY}`
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) throw new Error(`Sheets ${tab} read failed: ${res.status}`)
  const json = await res.json()
  return (json.values ?? []) as string[][]
}

// ดึงข้อมูลโปรไฟล์ (ชื่อ, ตำบล, ประเภทผู้ใช้) จากแผ่น Registration
async function buildNameMap(): Promise<Record<string, UserInfo>> {
  const map: Record<string, UserInfo> = {}
  if (!REG_SHEETS_ID || !SHEETS_API_KEY) return map
  try {
    const rows = await readTab(REG_SHEETS_ID, REG_TAB)
    if (rows.length <= 1) return map

    const h = rows[0]
    const idIdx   = findCol(h, ['line user id', 'lineuserid', 'line_user_id'])
    const nickIdx = findCol(h, ['ชื่อเล่น', 'nickname'])
    const fullIdx = findCol(h, ['ชื่อ-นามสกุล', 'fullname', 'full name'])
    const locIdx  = findCol(h, ['ตำบล', 'subdistrict'])
    const typeIdx = findCol(h, ['ประเภทผู้ใช้งาน', 'ประเภทผู้ใช้', 'usertype', 'user type', 'user_type'])
    if (idIdx < 0) return map

    for (const r of rows.slice(1)) {
      const lid = str(r[idIdx])
      if (!lid) continue
      const nick = nickIdx >= 0 ? str(r[nickIdx]) : ''
      const full = fullIdx >= 0 ? str(r[fullIdx]) : ''
      const isTourist = typeIdx >= 0
        ? str(r[typeIdx]) === TOURIST_USER_TYPE
        : r.some((c) => str(c) === TOURIST_USER_TYPE)

      map[lid] = {
        name:     nick || full,
        avatar:   '/placeholder.svg?height=40&width=40',
        location: locIdx >= 0 ? str(r[locIdx]) : '',
        isTourist,
      }
    }
  } catch (error) {
    console.error('[waste-dashboard] Registration read error:', error)
  }
  return map
}

// ─── GET Handler ─────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  if (!POINTS_SPREADSHEET_ID || !SHEETS_API_KEY) {
    return NextResponse.json(
      { error: 'Points sheet not configured (Missing POINTS_SPREADSHEET_ID or GOOGLE_SHEETS_API_KEY)' },
      { status: 500 }
    )
  }

  try {
    // 1. อ่านข้อมูลผู้ใช้ (NameMap) และประวัติขยะไปพร้อมกันแบบ Parallel
    const nameMapPromise = buildNameMap()

    // 2. ลองดึงข้อมูลรายการขยะจาก Tab ที่เป็นไปได้
    let rows: string[][] = []
    const possibleTabs = ['records', 'waste', 'transactions', 'points_transactions']

    for (const tab of possibleTabs) {
      try {
        rows = await readTab(POINTS_SPREADSHEET_ID, tab)
        if (rows.length > 1) break
      } catch {
        // ลอง Tab ถัดไป
      }
    }

    const nameMap = await nameMapPromise

    // 3. กรณีไม่มี Tab รายการขยะ ให้ Fallback ไปอ่านยอดรวมจาก points_account
    if (rows.length <= 1) {
      try {
        const accRows = await readTab(POINTS_SPREADSHEET_ID, 'points_account')
        if (accRows.length > 1) {
          const h = accRows[0]
          const weightIdx = findCol(h, ['total_weight', 'weight', 'น้ำหนัก'])
          const co2Idx    = findCol(h, ['total_co2', 'co2', 'คาร์บอน'])

          let totalWeight = 0
          let totalCo2 = 0

          accRows.slice(1).forEach(r => {
            totalWeight += toNumber(r[weightIdx])
            totalCo2 += toNumber(r[co2Idx])
          })

          return NextResponse.json({
            summary: {
              totalWeight: Math.round(totalWeight * 100) / 100,
              totalCarbon: Math.round(totalCo2 * 100) / 100,
              totalRecords: accRows.length - 1,
            },
            typeBreakdown: [],
            records: [],
          })
        }
      } catch {
        // ถ้าไม่มีข้อมูลเลย ให้ส่งค่า 0 กลับไป
      }

      return NextResponse.json({
        summary: { totalWeight: 0, totalCarbon: 0, totalRecords: 0 },
        typeBreakdown: [],
        records: [],
      })
    }

    // 4. แปลงข้อมูลจาก Tab รายการขยะ
    const h = rows[0]
    const dateIdx   = findCol(h, ['date', 'datetime', 'time', 'วัน', 'เวลา'])
    const idIdx     = findCol(h, ['user_id', 'line user id', 'lineuserid', 'line_user_id'])
    const typeIdx   = findCol(h, ['waste_type', 'type', 'wastetype', 'ประเภท', 'ชนิด', 'ขยะ'])
    const weightIdx = findCol(h, ['weight', 'kg', 'น้ำหนัก', 'กิโลกรัม'])
    const co2Idx    = findCol(h, ['co2', 'kgco2e', 'kgco2', 'co2e', 'carbon', 'คาร์บอน'])
    const pointsIdx = findCol(h, ['points', 'point', 'คะแนน'])

    let totalWeight = 0
    let totalCarbon = 0
    const typeMap: Record<string, { weight: number; carbon: number }> = {}

    const records: WasteRecord[] = rows
      .slice(1)
      .filter(r => r.some(c => str(c)))
      .map((row, idx) => {
        const lid = idIdx >= 0 ? str(row[idIdx]) : ''
        const userInfo = nameMap[lid]

        const wasteType = typeIdx >= 0 ? str(row[typeIdx]) || 'ขยะทั่วไป' : 'ขยะทั่วไป'
        const weight = weightIdx >= 0 ? toNumber(row[weightIdx]) : 0
        const carbon = co2Idx >= 0 ? toNumber(row[co2Idx]) : 0
        const points = pointsIdx >= 0 ? toNumber(row[pointsIdx]) : 0

        totalWeight += weight
        totalCarbon += carbon

        if (!typeMap[wasteType]) typeMap[wasteType] = { weight: 0, carbon: 0 }
        typeMap[wasteType].weight += weight
        typeMap[wasteType].carbon += carbon

        return {
          id: `rec-${idx + 1}`,
          date: dateIdx >= 0 ? str(row[dateIdx]) || new Date().toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          lineUserId: lid,
          userName: userInfo?.name || (lid ? `ผู้ใช้ ${lid.slice(0, 5)}` : `ผู้ใช้ ${idx + 1}`),
          subdistrict: userInfo?.location || '',
          isTourist: userInfo?.isTourist ?? false,
          wasteType,
          weight: Math.round(weight * 100) / 100,
          carbon: Math.round(carbon * 100) / 100,
          points: Math.round(points),
        }
      })

    // 5. สรุปแยกประเภทขยะ
    const typeBreakdown: WasteTypeSummary[] = Object.entries(typeMap).map(([type, val]) => ({
      type,
      weight: Math.round(val.weight * 100) / 100,
      carbon: Math.round(val.carbon * 100) / 100,
      percentage: totalWeight > 0 ? Math.round((val.weight / totalWeight) * 100) : 0,
    })).sort((a, b) => b.weight - a.weight)

    return NextResponse.json({
      summary: {
        totalWeight: Math.round(totalWeight * 100) / 100,
        totalCarbon: Math.round(totalCarbon * 100) / 100,
        totalRecords: records.length,
      },
      typeBreakdown,
      records: records.reverse(),
    })

  } catch (error) {
    console.error('[waste-dashboard] Error:', error)
    return NextResponse.json({ error: 'Failed to fetch waste dashboard data' }, { status: 500 })
  }
}