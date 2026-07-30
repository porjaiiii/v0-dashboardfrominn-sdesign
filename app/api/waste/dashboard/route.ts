import { NextRequest, NextResponse } from 'next/server'
import { readTab } from '@/lib/google-sheets'

// ─── Environment Variables & Constants ──────────────────────────────────────
const DEFAULT_SHEET_ID = '1vvBe_ZySfSq4oP8tfwHDUg-Jo3gBr9QanQWqLATAkNE'

const REG_SHEETS_ID = process.env.REGISTRATION_SHEETS_ID || DEFAULT_SHEET_ID
/** ประวัติขยะอยู่ในไฟล์เดียวกับ Registration (ตั้ง POINTS_SPREADSHEET_ID เพื่อแยกไฟล์ได้) */
const WASTE_SHEET_ID = process.env.POINTS_SPREADSHEET_ID || REG_SHEETS_ID

const REG_TAB = 'Registration'
const TOURIST_USER_TYPE = 'นักท่องเที่ยว'

// Tab หลักสำหรับเก็บประวัติขยะ
const WASTE_TAB = process.env.WASTE_SUBMISSION_TAB || 'submission'

// หัวคอลัมน์ที่ต้องเจอ ใช้ยืนยันว่าอ่านถูกแท็บ
const REG_HEADERS = ['line user id', 'ตำบล']
const WASTE_HEADERS = ['waste_type', 'weight_kg', 'weight']

/** นับเฉพาะรายการที่ตรวจรับแล้ว ให้ตรงกับหน้า "ปริมาณขยะแยกตามประเภท" */
const DONE_STATUS = 'done'

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

// ดึงข้อมูลโปรไฟล์ผู้ใช้ (ชื่อ, ตำบล, นักท่องเที่ยว) จาก Registration Sheet
async function buildNameMap(): Promise<Record<string, UserInfo>> {
  const map: Record<string, UserInfo> = {}
  if (!REG_SHEETS_ID) return map
  try {
    const rows = await readTab(REG_SHEETS_ID, REG_TAB, { expectHeaders: REG_HEADERS })
    if (rows.length <= 1) return map

    const h = rows[0]
    const idIdx   = findCol(h, ['line user id', 'lineuserid', 'line_user_id', 'user_id'])
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
  try {
    // 1. อ่านข้อมูลโปรไฟล์ผู้ใช้ และ Tab ประวัติขยะ ไปพร้อมๆ กัน (Parallel)
    const [nameMap, wasteRowsResult] = await Promise.allSettled([
      buildNameMap(),
      readTab(WASTE_SHEET_ID, WASTE_TAB, { expectHeaders: WASTE_HEADERS }),
    ])

    const userMap = nameMap.status === 'fulfilled' ? nameMap.value : {}
    const activeTabUsed = WASTE_TAB

    if (wasteRowsResult.status === 'rejected') {
      console.error('[waste-dashboard] waste tab read error:', wasteRowsResult.reason)
      return NextResponse.json(
        { error: `Failed to read "${WASTE_TAB}" tab from the spreadsheet` },
        { status: 502 }
      )
    }
    const rows = wasteRowsResult.value

    if (rows.length <= 1) {
      return NextResponse.json({
        summary: { totalWeight: 0, totalCarbon: 0, totalRecords: 0 },
        typeBreakdown: [],
        records: [],
        activeTab: activeTabUsed,
      })
    }

    // 2. แปลงข้อมูลตามหัวคอลัมน์ของ co2_collection (user_id, waste_type, weight, co2, last_updated)
    const h = rows[0]
    const idIdx     = findCol(h, ['user_id', 'line_user_id', 'lineuserid'])
    const typeIdx   = findCol(h, ['waste_type', 'wastetype', 'type', 'ประเภทขยะ', 'ชนิดขยะ'])
    const weightIdx = findCol(h, ['weight', 'kg', 'น้ำหนัก'])
    const co2Idx    = findCol(h, ['co2', 'kgco2', 'carbon', 'คาร์บอน'])
    const dateIdx   = findCol(h, ['timestamp', 'last_updated', 'date', 'datetime', 'time', 'วันเวลา', 'วันที่'])

    // status อยู่คอลัมน์ที่ 9 ของแท็บ submission ถ้าไม่มีหัวคอลัมน์ให้ fallback ไป index 8
    const statusColIdx = findCol(h, ['status', 'สถานะ'])
    const statusIdx    = statusColIdx >= 0 ? statusColIdx : 8

    let totalWeight = 0
    let totalCarbon = 0
    const typeMap: Record<string, { weight: number; carbon: number }> = {}

    const records: WasteRecord[] = rows
      .slice(1)
      .filter((r) => {
        if (!r.some((c) => str(c))) return false
        // นับเฉพาะรายการที่ตรวจรับแล้ว (ข้ามรายการ pending)
        return str(r[statusIdx]).toLowerCase() === DONE_STATUS
      })
      .map((row, idx) => {
        const lid = idIdx >= 0 ? str(row[idIdx]) : ''
        const userInfo = userMap[lid]

        const wasteType = typeIdx >= 0 ? str(row[typeIdx]) || 'ขยะทั่วไป' : 'ขยะทั่วไป'
        const weight = weightIdx >= 0 ? toNumber(row[weightIdx]) : 0
        const carbon = co2Idx >= 0 ? toNumber(row[co2Idx]) : 0

        totalWeight += weight
        totalCarbon += carbon

        if (!typeMap[wasteType]) typeMap[wasteType] = { weight: 0, carbon: 0 }
        typeMap[wasteType].weight += weight
        typeMap[wasteType].carbon += carbon

        return {
          id: `rec-${idx + 1}`,
          date: dateIdx >= 0 ? str(row[dateIdx]) || new Date().toISOString() : new Date().toISOString(),
          lineUserId: lid,
          userName: userInfo?.name || (lid ? `ผู้ใช้ ${lid.slice(0, 5)}` : `ผู้ใช้ ${idx + 1}`),
          subdistrict: userInfo?.location || '',
          isTourist: userInfo?.isTourist ?? false,
          wasteType,
          weight: Math.round(weight * 100) / 100,
          carbon: Math.round(carbon * 100) / 100,
          points: 0,
        }
      })

    // 3. สรุปยอดแยกประเภทขยะ ( plastic, paper, glass, aluminium ฯลฯ )
    const typeBreakdown: WasteTypeSummary[] = Object.entries(typeMap)
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
      records: records.reverse(),
      activeTab: activeTabUsed,
    })

  } catch (error) {
    console.error('[waste-dashboard] Error:', error)
    return NextResponse.json({ error: 'Failed to fetch waste dashboard data' }, { status: 500 })
  }
}