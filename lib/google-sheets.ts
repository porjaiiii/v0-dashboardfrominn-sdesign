/**
 * ตัวอ่านข้อมูลจาก Google Sheets ใช้ร่วมกันทุก API route
 *
 * มี 2 ช่องทาง:
 *  1) Sheets API v4 — ใช้เมื่อมี GOOGLE_SHEETS_API_KEY (โควตาสูงกว่า, ค่าที่ได้เป็นข้อความดิบ)
 *  2) gviz endpoint สาธารณะ — ใช้เมื่อไม่ได้ตั้ง API key
 *     (ใช้ได้กับชีตที่แชร์แบบ "ผู้ที่มีลิงก์" ซึ่งเป็นค่าปัจจุบันของชีตนี้)
 *
 * ทั้งสองช่องทางคืนค่าเป็น string[][] โดยแถวแรกคือหัวคอลัมน์
 */

const SHEETS_API_KEY = process.env.GOOGLE_SHEETS_API_KEY

export interface ReadTabOptions {
  /**
   * คำที่ต้องปรากฏในหัวคอลัมน์อย่างน้อยหนึ่งคำ ใช้ตรวจว่าอ่านถูกแท็บ
   *
   * จำเป็นสำหรับช่องทาง gviz เพราะถ้าชื่อแท็บไม่มีอยู่จริง Google จะคืน
   * "แท็บแรกของไฟล์" กลับมาเงียบ ๆ แทนที่จะแจ้ง error
   */
  expectHeaders?: string[]
}

function hasExpectedHeaders(headers: string[], expect?: string[]): boolean {
  if (!expect || expect.length === 0) return true
  const norm = headers.map((h) => String(h ?? '').trim().toLowerCase())
  return expect.some((e) => norm.some((h) => h.includes(e.toLowerCase())))
}

// ─── ช่องทางที่ 1: Sheets API v4 (ต้องมี API key) ───────────────────────────
async function readViaApi(sheetId: string, tab: string): Promise<string[][]> {
  const url =
    `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(tab)}` +
    `?key=${SHEETS_API_KEY}`
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) throw new Error(`Sheets API read "${tab}" failed: ${res.status}`)
  const json = await res.json()
  return (json.values ?? []) as string[][]
}

// ─── ช่องทางที่ 2: gviz สาธารณะ (ไม่ต้องใช้ API key) ────────────────────────

/** แปลงค่าจาก gviz ให้เป็นข้อความแบบเดียวกับที่ Sheets API คืนมา */
function gvizCell(c: { v?: unknown; f?: string } | null): string {
  if (!c) return ''
  const v = c.v
  if (v === null || v === undefined) return ''
  if (typeof v === 'number' || typeof v === 'boolean') return String(v)
  if (typeof v === 'string') {
    // gviz ส่งวันที่มาเป็น "Date(2026,6,15)" — เดือนเริ่มนับที่ 0
    const m = v.match(/^Date\((\d+),(\d+),(\d+)(?:,(\d+),(\d+),(\d+))?\)$/)
    if (m) {
      const pad = (n: string | number) => String(n).padStart(2, '0')
      const date = `${m[1]}-${pad(Number(m[2]) + 1)}-${pad(m[3])}`
      return m[4] !== undefined ? `${date} ${pad(m[4])}:${pad(m[5])}:${pad(m[6])}` : date
    }
    return v
  }
  return String(v)
}

async function readViaPublicGviz(sheetId: string, tab: string): Promise<string[][]> {
  const url =
    `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq` +
    `?tqx=out:json&headers=1&sheet=${encodeURIComponent(tab)}`
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) throw new Error(`Public sheet read "${tab}" failed: ${res.status}`)

  const text = await res.text()
  const match = text.match(/setResponse\(([\s\S]*)\)/)
  if (!match) throw new Error(`Public sheet read "${tab}": unexpected response`)

  const json = JSON.parse(match[1])
  if (json.status !== 'ok') {
    const detail = json.errors?.[0]?.detailed_message ?? json.status
    throw new Error(`Public sheet read "${tab}": ${detail}`)
  }

  const headers: string[] = (json.table.cols ?? []).map((c: { label?: string }) => c.label ?? '')
  const rows: string[][] = (json.table.rows ?? []).map((r: { c: ({ v?: unknown; f?: string } | null)[] }) =>
    headers.map((_, i) => gvizCell(r.c?.[i] ?? null)),
  )
  return [headers, ...rows]
}

/**
 * อ่านทั้งแท็บออกมาเป็น string[][] (แถวแรกคือหัวคอลัมน์)
 * โยน error เมื่ออ่านไม่ได้ หรืออ่านได้แต่หัวคอลัมน์ไม่ตรงกับที่คาดไว้
 */
export async function readTab(
  sheetId: string,
  tab: string,
  options: ReadTabOptions = {},
): Promise<string[][]> {
  if (!sheetId) throw new Error('readTab: missing spreadsheet id')

  const rows = SHEETS_API_KEY
    ? await readViaApi(sheetId, tab)
    : await readViaPublicGviz(sheetId, tab)

  if (rows.length === 0) return rows

  if (!hasExpectedHeaders(rows[0], options.expectHeaders)) {
    throw new Error(
      `readTab: tab "${tab}" did not return the expected columns ` +
        `(got: ${rows[0].filter(Boolean).join(', ') || 'empty'})`,
    )
  }

  return rows
}

/** true เมื่อกำลังใช้ Sheets API v4 (มี API key) */
export const usingApiKey = Boolean(SHEETS_API_KEY)
