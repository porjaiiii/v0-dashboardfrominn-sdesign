export type MainCategory = 'plastic' | 'paper' | 'glass' | 'aluminum'

export interface WasteSubType {
  id: string
  name: string
  description: string
  color: string
}

export interface MainCategoryInfo {
  id: MainCategory
  label: string
  color: string
  bgColor: string
  borderColor: string
  subtypes: WasteSubType[]
}

/**
 * ลำดับและสีตามไฟล์ออกแบบ (sao.png)
 * - `color` = สีประจำประเภท (ใช้กับแท็บที่ถูกเลือก) เป็นสีเข้มชุดเดียวกับการ์ดสถิติ
 * - `subtypes[].color` = สีเฉดอ่อนของประเภทนั้น ใช้กับกราฟแท่งและแถบ progress
 *   (ค่าของหมวด "แก้ว" ถอดมาจากแบบโดยตรง หมวดอื่นไล่เฉดด้วยหลักการเดียวกัน)
 */
export const WASTE_CATEGORIES: MainCategoryInfo[] = [
  {
    id: 'plastic',
    label: 'พลาสติก',
    color: '#1b8014',
    bgColor: '#f0f9ee',
    borderColor: '#b8d8b2',
    subtypes: [
      { id: 'pet',   name: 'ขวดน้ำพลาสติกใส',   description: 'PET',  color: '#6fc060' },
      { id: 'hdpe',  name: 'ขวดน้ำพลาสติกขุ่น',  description: 'HDPE', color: '#8ccd7f' },
      { id: 'ldpe',  name: 'ฝาขวดน้ำพลาสติก',    description: 'LDPE', color: '#a9daa0' },
    ],
  },
  {
    id: 'glass',
    label: 'แก้ว',
    color: '#203a99',
    bgColor: '#f0f6fd',
    borderColor: '#a8c8e8',
    subtypes: [
      { id: 'clear',   name: 'ขวดแก้วครบลัง', description: 'ประเภทเดียวกัน', color: '#89b9ea' },
      { id: 'colored', name: 'ขวดแก้วรวม',    description: 'หลายประเภท',     color: '#a1c7ee' },
    ],
  },
  {
    id: 'paper',
    label: 'กระดาษ',
    color: '#b02e0d',
    bgColor: '#fff5f5',
    borderColor: '#e8b4b4',
    subtypes: [
      { id: 'cardboard', name: 'กระดาษลัง',              description: 'กล่อง', color: '#c06060' },
      { id: 'a4',        name: 'กระดาษสีขาว / A4',       description: 'A4',    color: '#d08585' },
      { id: 'mixed',     name: 'นิตยสาร / หนังสือพิมพ์', description: 'รวม',   color: '#e0aaaa' },
    ],
  },
  {
    id: 'aluminum',
    label: 'อลูมิเนียม',
    color: '#e4ca00',
    bgColor: '#fffbea',
    borderColor: '#e8d898',
    subtypes: [
      { id: 'can',   name: 'กระป๋องอลูมิเนียม', description: 'กระป๋องดื่ม', color: '#d7ce56' },
      { id: 'plate', name: 'ฝาอลูมิเนียม',       description: 'ฝากระป๋อง',  color: '#e2db7d' },
      { id: 'scrap', name: 'เศษอลูมิเนียม',      description: 'เศษโลหะ',    color: '#ede8a4' },
    ],
  },
]

// Mock kg per subtype per tambon
const BASE_KG: Record<MainCategory, Record<string, number[]>> = {
  plastic: {
    pet:   [55, 40, 65, 50, 15, 48, 0, 0, 0, 0, 0, 0],
    hdpe:  [35, 25, 45, 30, 10, 32, 0, 0, 0, 0, 0, 0],
    ldpe:  [20, 15, 25, 18,  8, 18, 0, 0, 0, 0, 0, 0],
  },
  paper: {
    cardboard: [30, 45, 55, 40, 60, 30, 0, 0, 0, 0, 0, 0],
    a4:        [15, 22, 28, 18, 30, 14, 0, 0, 0, 0, 0, 0],
    mixed:     [10, 18, 22, 15, 35, 18, 0, 0, 0, 0, 0, 0],
  },
  glass: {
    clear:   [80, 90, 35, 65, 85, 90, 0, 0, 0, 0, 0, 0],
    colored: [55, 65, 22, 45, 60, 60, 0, 0, 0, 0, 0, 0],
  },
  aluminum: {
    can:   [ 6, 24, 28, 20, 42, 62, 0, 0, 0, 0, 0, 0],
    plate: [ 3, 12, 14, 10, 20, 28, 0, 0, 0, 0, 0, 0],
    scrap: [ 1,  8,  8,  6, 10, 18, 0, 0, 0, 0, 0, 0],
  },
}

const TAMBON_SCALE: Record<string, number> = {
  บางกะเจ้า: 1.0,
  บางยอ:     0.65,
  บางกอบัว:  0.85,
  บางกระสอบ: 0.55,
  บางน้ำผึ้ง: 0.95,
  ทรงคนอง:  0.72,
}

export interface SubTypeMonthlyRow {
  month: string
  [subtypeId: string]: number | string
}

export function getSubtypeMonthlyData(
  tambon: string,
  category: MainCategory,
  year = 2569,
): SubTypeMonthlyRow[] {
  const scale = TAMBON_SCALE[tambon] ?? 1
  const catData = BASE_KG[category]
  const months = ['01','02','03','04','05','06','07','08','09','10','11','12']
  return months.map((m, i) => {
    const row: SubTypeMonthlyRow = { month: `${year}-${m}` }
    Object.entries(catData).forEach(([id, arr]) => {
      row[id] = Math.round(arr[i] * scale)
    })
    return row
  })
}

/** ยอดรวมต่อปีต่อ subtype */
export function getSubtypeTotal(tambon: string, category: MainCategory): Record<string, number> {
  const rows = getSubtypeMonthlyData(tambon, category)
  const totals: Record<string, number> = {}
  const cat = WASTE_CATEGORIES.find(c => c.id === category)!
  cat.subtypes.forEach(s => { totals[s.id] = 0 })
  rows.forEach(row => {
    cat.subtypes.forEach(s => {
      totals[s.id] += (row[s.id] as number) || 0
    })
  })
  return totals
}
