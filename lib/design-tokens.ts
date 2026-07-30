/**
 * Design tokens ถอดค่าจากไฟล์ออกแบบ (sao.png) แบบวัดพิกเซลจริง
 * ใช้ร่วมกันทุก component เพื่อให้หน้าตาตรงกับแบบ
 */

export const fontStyle = {
  fontFamily: 'var(--font-ibm-plex-sans-thai), IBM Plex Sans Thai, sans-serif',
} as const

export const COLORS = {
  /** เขียวเข้มหลัก — sidebar, ตัวหนังสือหัวข้อ, เส้นขอบปุ่ม */
  green: '#154212',
  /** เขียวเข้มพิเศษ — แถบเมนูที่ถูกเลือกใน sidebar */
  greenDeep: '#11350e',
  /** เขียวหัว sidebar (แถบโลโก้) */
  greenHeader: '#446841',
  /** เขียวอ่อนสด — จุด/แถบ progress ของการ์ดสรุปรวม */
  accent: '#83bc3c',

  /** สีประจำประเภทขยะ */
  plastic: '#1b8014',
  glass: '#203a99',
  paper: '#b02e0d',
  aluminium: '#e4ca00',

  /** เส้นขอบการ์ด + เส้นกริดกราฟ */
  border: '#cccccc',
  grid: '#cccccc',
  /** พื้นที่ตำบลที่ยังไม่ถูกเลือกบนแผนที่ + เส้นแม่น้ำ */
  mapIdle: '#e2e2e2',
  mapStroke: '#bcbcbc',
  /** รางของแถบ progress */
  track: '#e5e5e5',

  white: '#ffffff',
} as const

/** สีตามชื่อประเภทขยะภาษาไทย (ใช้กับกราฟโดนัท / เส้น / แท่ง) */
export const WASTE_COLORS: Record<string, string> = {
  พลาสติก: COLORS.plastic,
  แก้ว: COLORS.glass,
  กระดาษ: COLORS.paper,
  อลูมิเนียม: COLORS.aluminium,
}

export const WASTE_TYPE_ORDER = ['พลาสติก', 'แก้ว', 'กระดาษ', 'อลูมิเนียม'] as const

/** การ์ดขาวขอบเทา มุมมน 10 (ใช้ทั้งการ์ดกราฟ, การ์ดแผนที่, การ์ดโดนัท) */
export const cardStyle = {
  backgroundColor: COLORS.white,
  border: `2px solid ${COLORS.border}`,
  borderRadius: 10,
} as const

/** หัวข้อในการ์ด */
export const cardTitleStyle = {
  color: COLORS.green,
  fontSize: 24,
  fontWeight: 600,
  lineHeight: '36px',
  margin: 0,
  ...fontStyle,
} as const

/** ความสูงมาตรฐานของ pill (dropdown / ปุ่ม / แท็บ) ในแบบ */
export const PILL_HEIGHT = 36

/** ปุ่ม pill แบบเส้นขอบ / แบบทึบ */
export function pillStyle(
  active: boolean,
  activeColor: string = COLORS.green,
  opts: { minWidth?: number; paddingX?: number } = {},
) {
  return {
    height: PILL_HEIGHT,
    minWidth: opts.minWidth,
    padding: `0 ${opts.paddingX ?? 20}px`,
    borderRadius: 10,
    border: `2px solid ${active ? activeColor : COLORS.green}`,
    backgroundColor: active ? activeColor : COLORS.white,
    color: active ? COLORS.white : COLORS.green,
    fontSize: 16,
    fontWeight: 600,
    cursor: 'pointer',
    whiteSpace: 'nowrap' as const,
    transition: 'background-color .15s ease, border-color .15s ease, color .15s ease',
    ...fontStyle,
  }
}

/** สไตล์ tick ของแกนกราฟ */
export const axisTickStyle = {
  fill: COLORS.green,
  fontSize: 12,
  fontWeight: 600,
  fontFamily: 'IBM Plex Sans Thai, sans-serif',
} as const

/** คำกำกับแกน เช่น "น้ำหนัก (KG)" */
export const axisCaptionStyle = {
  color: COLORS.green,
  fontSize: 12,
  fontWeight: 600,
  ...fontStyle,
} as const

export const tooltipStyle = {
  borderRadius: 10,
  border: `2px solid ${COLORS.green}`,
  fontSize: 14,
  fontFamily: 'IBM Plex Sans Thai, sans-serif',
} as const
