import { NextRequest, NextResponse } from 'next/server'

// ─── Environment Variables & Constants ──────────────────────────────────────
const SHEETS_API_KEY = process.env.GOOGLE_SHEETS_API_KEY
const SPREADSHEET_ID = process.env.REGISTRATION_SHEETS_ID || '1vvBe_ZySfSq4oP8tfwHDUg-Jo3gBr9QanQWqLATAkNE'

const REG_TAB = 'Registration'
const SUBMISSION_TAB = 'submission'
const TOURIST_USER_TYPE = 'นักท่องเที่ยว'

// ─── Types ──────────────────────────────────────────────────────────────────
export type WasteRecord = {
  id: string
  date: string
  lineUserId: string
  userName: string
  subdistrict: string   // ตำบลที่แมปมาจาก Registration
  isTourist: boolean
  wasteType: string     // ประเภทหลัก (เช่น พลาสติก)
  wasteSubType: string  // ประเภทย่อย (เช่น ขวด PET)
  weight: number
  carbon: number
  points: number
  status?: string       // สถานะรายการ
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

// ─── Helper Functions ────────────────────────────────────────────────────────

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

// อ่านข้อมูลแถวทั้งหมดจาก Sheet Tab
async function readTab(sheetId: string, tab: string): Promise<string[][]> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(
    tab
  )}?key=${SHEETS_API_KEY}`
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) throw new Error(`Sheets ${tab} read failed: ${res.status}`)
  const json = await res.json()
  return (json.values ?? []) as string[][]
}

// สร้าง Map จับคู่ lineUserId กับ ตำบล/ชื่อ จาก Registration Sheet
async function buildNameMap(): Promise<Record<string, UserInfo>> {
  const map: Record<string, UserInfo> = {}
  if (!SPREADSHEET_ID || !SHEETS_API_KEY) return map
  try {
    const rows = await readTab(SPREADSHEET_ID, REG_TAB)
    if (rows.length <= 1) return map

    const h = rows[0]
    const idIdx   = findCol(h, ['line user id', 'lineuserid', 'line_user_id', 'user_id', 'userid'])
    const nickIdx = findCol(h, ['ชื่อเล่น', 'nickname'])
    const fullIdx = findCol(h, ['ชื่อ-นามสกุล', 'fullname', 'full name', 'ชื่อ'])
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
        location: locIdx >= 0 ? str(r[locIdx]) : '', // ตำบล
        isTourist,
      }
    }
  } catch (error) {
    console.error('[dashboard] Registration read error:', error)
  }
  return map
}

// ─── GET Handler (ดึงก้อนเดียวได้ทั้งหมด) ───────────────────────────────────

export async function GET(request: NextRequest) {
  if (!SHEETS_API_KEY) {
    return NextResponse.json(
      { error: 'Google Sheets API Key not configured' },
      { status: 500 }
    )
  }

  try {
    // 1. อ่านข้อมูล Registration และ Submission พร้อมกันแบบ Parallel
    const [nameMapResult, submissionRowsResult] = await Promise.allSettled([
      buildNameMap(),
      readTab(SPREADSHEET_ID, SUBMISSION_TAB),
    ])

    const userMap = nameMapResult.status === 'fulfilled' ? nameMapResult.value : {}
    let rows: string[][] = []

    if (submissionRowsResult.status === 'fulfilled') {
      rows = submissionRowsResult.value
    } else {
      // Fallback กรณีชื่อ Tab ไม่ตรง
      const fallbackTabs = ['Submissions', 'submission', 'submissions', 'Sheet1']
      for (const tab of fallbackTabs) {
        try {
          const fbRows = await readTab(SPREADSHEET_ID, tab)
          if (fbRows.length > 1) {
            rows = fbRows
            break
          }
        } catch {
          // ลองแท็บถัดไป
        }
      }
    }

    if (rows.length <= 1) {
      return NextResponse.json({
        summary: { totalWeight: 0, totalCarbon: 0, totalRecords: 0 },
        typeBreakdown: [],
        subTypeBreakdown: [],
        records: [],
      })
    }

    // 2. ดักจับ Index ของคอลัมน์ต่างๆ จาก Submission Tab
    const h = rows[0]
    const idIdx        = findCol(h, ['user_id', 'line_user_id', 'lineuserid', 'userid'])
    const mainTypeIdx  = findCol(h, ['waste_type', 'wastetype', 'type', 'ประเภทขยะ', 'ชนิดขยะ', 'ประเภทหลัก'])
    const subTypeIdx   = findCol(h, ['sub_type', 'subtype', 'waste_sub_type', 'ประเภทย่อย', 'ชนิดย่อย', 'รายละเอียดขยะ'])
    const weightIdx    = findCol(h, ['weight', 'kg', 'น้ำหนัก', 'ปริมาณ'])
    const co2Idx       = findCol(h, ['co2', 'kgco2', 'carbon', 'คาร์บอน'])
    const pointsIdx    = findCol(h, ['points', 'point', 'คะแนน'])
    const dateIdx      = findCol(h, ['created_at', 'timestamp', 'date', 'datetime', 'time', 'วันเวลา', 'วันที่'])
    
    // 🟢 หา Index ของสถานะ (ค้นหาจาก Header คำว่า 'status' / 'สถานะ' หรือ Fallback ไปที่ คอลัมน์ที่ 9 ซึ่งคือ Index 8)
    const statusColIdx = findCol(h, ['status', 'สถานะ'])
    const statusIdx    = statusColIdx >= 0 ? statusColIdx : 8

    let totalWeight = 0
    let totalCarbon = 0
    const typeMap: Record<string, { weight: number; carbon: number }> = {}
    const subTypeMap: Record<string, { weight: number; carbon: number }> = {}

    // 3. วนลูปผูกข้อมูล Submission เข้ากับ Map ตำบล (พร้อมกรองเฉพาะ status === 'done')
    const records: WasteRecord[] = rows
      .slice(1)
      .filter((r) => {
        // ต้องมีข้อมูลอย่างน้อย 1 ช่อง
        if (!r.some((c) => str(c))) return false

        // 🟢 เช็กสถานะ: แสดงเฉพาะรายการที่ status เป็น 'done' เท่านั้น (ไม่สนใจตัวพิมพ์เล็ก-ใหญ่)
        const itemStatus = str(r[statusIdx]).toLowerCase()
        return itemStatus === 'done'
      })
      .map((row, idx) => {
        const lid = idIdx >= 0 ? str(row[idIdx]) : ''
        const userInfo = userMap[lid]

        const wasteType = mainTypeIdx >= 0 ? str(row[mainTypeIdx]) || 'ขยะทั่วไป' : 'ขยะทั่วไป'
        const wasteSubType = subTypeIdx >= 0 ? str(row[subTypeIdx]) || '-' : '-'
        const weight = weightIdx >= 0 ? toNumber(row[weightIdx]) : 0
        const carbon = co2Idx >= 0 ? toNumber(row[co2Idx]) : 0
        const points = pointsIdx >= 0 ? toNumber(row[pointsIdx]) : 0
        const status = str(row[statusIdx]) || 'done'

        totalWeight += weight
        totalCarbon += carbon

        // สรุปยอดประเภทหลัก
        if (!typeMap[wasteType]) typeMap[wasteType] = { weight: 0, carbon: 0 }
        typeMap[wasteType].weight += weight
        typeMap[wasteType].carbon += carbon

        // สรุปยอดประเภทย่อย
        if (wasteSubType !== '-') {
          if (!subTypeMap[wasteSubType]) subTypeMap[wasteSubType] = { weight: 0, carbon: 0 }
          subTypeMap[wasteSubType].weight += weight
          subTypeMap[wasteSubType].carbon += carbon
        }

        return {
          id: `sub-${idx + 1}`,
          date: dateIdx >= 0 ? str(row[dateIdx]) || new Date().toISOString() : new Date().toISOString(),
          lineUserId: lid,
          userName: userInfo?.name || (lid ? `ผู้ใช้ ${lid.slice(0, 5)}` : `ผู้ใช้ ${idx + 1}`),
          subdistrict: userInfo?.location || '', // ดึงตำบลจาก Map ได้เลยไม่ต้องยิงรายคน!
          isTourist: userInfo?.isTourist ?? false,
          wasteType,
          wasteSubType, // ประเภทย่อย
          weight: Math.round(weight * 100) / 100,
          carbon: Math.round(carbon * 100) / 100,
          points,
          status,
        }
      })

    // 4. ทำข้อมูลเปรียบเทียบสรุป
    const typeBreakdown: WasteTypeSummary[] = Object.entries(typeMap)
      .map(([type, val]) => ({
        type,
        weight: Math.round(val.weight * 100) / 100,
        carbon: Math.round(val.carbon * 100) / 100,
        percentage: totalWeight > 0 ? Math.round((val.weight / totalWeight) * 100) : 0,
      }))
      .sort((a, b) => b.weight - a.weight)

    const subTypeBreakdown: WasteTypeSummary[] = Object.entries(subTypeMap)
      .map(([type, val]) => ({
        type,
        weight: Math.round(val.weight * 100) / 100,
        carbon: Math.round(val.carbon * 100) / 100,
        percentage: totalWeight > 0 ? Math.round((val.weight / totalWeight) * 100) : 0,
      }))
      .sort((a, b) => b.weight - a.weight)

    return NextResponse.json({
      summary: {
        totalWeight: Math.round(totalWeight * 100) / 100,
        totalCarbon: Math.round(totalCarbon * 100) / 100,
        totalRecords: records.length,
      },
      typeBreakdown,
      subTypeBreakdown,
      records: records.reverse(), // ส่งคืนประวัติทั้งหมด
    })

  } catch (error) {
    console.error('[dashboard] Error:', error)
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 })
  }
}