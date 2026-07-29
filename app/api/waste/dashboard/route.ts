import { NextResponse } from 'next/server'

export type WasteRecord = {
  id: string
  date: string
  lineUserId: string
  userName: string
  subdistrict: string
  isTourist: boolean
  wasteType: string
  weight: number // kg
  carbon: number // kgCO2e
  points: number
}

export type WasteTypeSummary = {
  type: string
  weight: number
  carbon: number
  percentage: number
}

export type WasteDashboardResponse = {
  summary: {
    totalWeight: number
    totalCarbon: number
    totalRecords: number
  }
  typeBreakdown: WasteTypeSummary[]
  records: WasteRecord[]
  error?: string
}

function parseCSV(text: string): string[][] {
  return text.split('\n').map(line =>
    line.split(',').map(cell => cell.trim().replace(/^"(.*)"$/, '$1'))
  )
}

function normalizeHeader(h: string): string {
  return (h ?? '').toLowerCase().trim().replace(/[₀₁₂₃₄₅₆₇₈₉]/g, (c) =>
    String.fromCharCode(c.charCodeAt(0) - 0x2050)
  )
}

function findColumnIndex(headers: string[], possibleNames: string[]): number {
  return headers.findIndex(h =>
    possibleNames.some(name => normalizeHeader(h).includes(name))
  )
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const callerUserId = searchParams.get('userId')?.trim() || ''

  const sheetId = process.env.POINTS_SPREADSHEET_ID
  const apiKey = process.env.GOOGLE_SHEETS_API_KEY

  if (!sheetId || !apiKey) {
    return NextResponse.json({ error: 'Server configuration missing' }, { status: 500 })
  }

  try {
    // 1. ดึงข้อมูลจาก Tab "records" หรือ "waste" ผ่าน Google Sheets API v4
    let apiUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/records?key=${apiKey}`
    let recordsRes = await fetch(apiUrl, { cache: 'no-store' })

    // Fallback หาก tab ชื่อว่า waste หรือ sheet1
    if (!recordsRes.ok) {
      apiUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/waste?key=${apiKey}`
      recordsRes = await fetch(apiUrl, { cache: 'no-store' })
    }

    if (!recordsRes.ok) {
      console.error('[waste-dashboard] Sheets API error:', recordsRes.status)
      return NextResponse.json({ error: 'Failed to fetch waste records' }, { status: 500 })
    }

    const json = await recordsRes.json()
    const rows: string[][] = json.values ?? []

    if (rows.length <= 1) {
      return NextResponse.json({
        summary: { totalWeight: 0, totalCarbon: 0, totalRecords: 0 },
        typeBreakdown: [],
        records: [],
      })
    }

    // 2. ค้นหา Index ของคอลัมน์แบบ Dynamic
    const headers = rows[0]
    let dateIdx   = findColumnIndex(headers, ['date', 'datetime', 'time', 'วัน', 'เวลา'])
    let lineIdIdx = findColumnIndex(headers, ['line user id', 'lineuserid', 'line_user_id', 'userid'])
    let typeIdx   = findColumnIndex(headers, ['type', 'wastetype', 'ประเภท', 'ชนิด', 'ขยะ'])
    let weightIdx = findColumnIndex(headers, ['weight', 'kg', 'น้ำหนัก'])
    let co2Idx    = findColumnIndex(headers, ['kgco2e', 'kgco2', 'co2e', 'co2', 'carbon'])
    let pointsIdx = findColumnIndex(headers, ['points', 'point', 'คะแนน'])

    // Positional Fallback
    if (dateIdx < 0) dateIdx = 0
    if (lineIdIdx < 0) lineIdIdx = 1
    if (typeIdx < 0) typeIdx = 2
    if (weightIdx < 0) weightIdx = 3
    if (co2Idx < 0) co2Idx = 4

    // 3. ดึง Profile จาก Google Sheet CSV มาแมปข้อมูลชื่อ ตำบล และนักท่องเที่ยว
    const profileMap: Record<string, { name: string; location: string; isTourist: boolean }> = {}
    try {
      const profileUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`
      const profileRes = await fetch(profileUrl, { cache: 'no-store' })
      if (profileRes.ok) {
        const profileRows = parseCSV(await profileRes.text())
        if (profileRows.length > 1) {
          const ph = profileRows[0]
          const pLineIdx = findColumnIndex(ph, ['line user id', 'lineuserid', 'line_user_id'])
          const pNameIdx = findColumnIndex(ph, ['ชื่อ-นามสกุล', 'fullname', 'full name', 'ชื่อ'])
          const pLocIdx  = findColumnIndex(ph, ['ตำบล', 'subdistrict', 'location'])
          const pTypeIdx = findColumnIndex(ph, ['usertype', 'user_type', 'ประเภทผู้ใช้', 'นักท่องเที่ยว'])

          profileRows.slice(1).forEach(row => {
            const lid = pLineIdx >= 0 ? row[pLineIdx]?.trim() : ''
            if (lid) {
              const loc = pLocIdx >= 0 ? row[pLocIdx]?.trim() || '' : ''
              const uType = pTypeIdx >= 0 ? row[pTypeIdx]?.trim() || '' : ''
              profileMap[lid] = {
                name: pNameIdx >= 0 ? row[pNameIdx]?.trim() || '' : '',
                location: loc,
                isTourist: uType.includes('นักท่องเที่ยว') || uType.toLowerCase().includes('tourist') || !loc,
              }
            }
          })
        }
      }
    } catch (e) {
      console.warn('[waste-dashboard] Profile fetch warning:', e)
    }

    // 4. แปลงข้อมูล Waste Records ทั้งหมด
    const records: WasteRecord[] = rows.slice(1)
      .filter(r => r.some(cell => cell?.trim()))
      .map((row, idx) => {
        const lid = row[lineIdIdx]?.trim() || ''
        const prof = profileMap[lid]
        return {
          id: `rec-${idx + 1}`,
          date: row[dateIdx]?.trim() || new Date().toISOString().split('T')[0],
          lineUserId: lid,
          userName: prof?.name || `ผู้ใช้ ${lid.slice(0, 5)}`,
          subdistrict: prof?.location || 'ไม่ระบุ',
          isTourist: prof?.isTourist ?? false,
          wasteType: row[typeIdx]?.trim() || 'ขยะทั่วไป',
          weight: parseFloat(row[weightIdx] ?? '0') || 0,
          carbon: parseFloat(row[co2Idx] ?? '0') || 0,
          points: parseFloat(row[pointsIdx] ?? '0') || 0,
        }
      })

    // 5. คำนวณยอดรวม (Summary)
    const totalWeight = records.reduce((sum, r) => sum + r.weight, 0)
    const totalCarbon = records.reduce((sum, r) => sum + r.carbon, 0)
    const totalRecords = records.length

    // 6. จัดกลุ่มสรุปประเภทขยะ (Waste Type Breakdown)
    const typeMap: Record<string, { weight: number; carbon: number }> = {}
    records.forEach(r => {
      const t = r.wasteType || 'ขยะทั่วไป'
      if (!typeMap[t]) typeMap[t] = { weight: 0, carbon: 0 }
      typeMap[t].weight += r.weight
      typeMap[t].carbon += r.carbon
    })

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
        totalRecords,
      },
      typeBreakdown,
      records: records.reverse(), // เอาอันล่าสุดขึ้นก่อน
    })

  } catch (error) {
    console.error('[waste-dashboard] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}