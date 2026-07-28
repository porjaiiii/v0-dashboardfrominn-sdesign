// Mock data for the map page — monthly waste, drop-off pins, donations, and top contributors

export const TAMBON_LIST = ['บางกะเจ้า', 'บางยอ', 'บางกอบัว', 'บางกระสอบ', 'บางน้ำผึ้ง', 'ทรงคนอง']

export const WASTE_COLORS = {
  พลาสติก: '#6fc060',
  แก้ว: '#89b9ea',
  กระดาษ: '#c06060',
  อลูมิเนียม: '#d7ce56',
}

// Monthly waste data per tambon (kg per waste type, per month)
const monthlyBase: Record<string, { พลาสติก: number; แก้ว: number; กระดาษ: number; อลูมิเนียม: number }[]> = {
  บางกะเจ้า: [
    { พลาสติก: 180, แก้ว: 150, กระดาษ: 60, อลูมิเนียม: 10 },
    { พลาสติก: 120, แก้ว: 170, กระดาษ: 90, อลูมิเนียม: 50 },
    { พลาสติก: 200, แก้ว: 60, กระดาษ: 120, อลูมิเนียม: 50 },
    { พลาสติก: 155, แก้ว: 120, กระดาษ: 80, อลูมิเนียม: 40 },
    { พลาสติก: 50, แก้ว: 155, กระดาษ: 130, อลูมิเนียม: 75 },
    { พลาสติก: 130, แก้ว: 155, กระดาษ: 65, อลูมิเนียม: 135 },
    { พลาสติก: 0, แก้ว: 0, กระดาษ: 0, อลูมิเนียม: 0 },
    { พลาสติก: 0, แก้ว: 0, กระดาษ: 0, อลูมิเนียม: 0 },
    { พลาสติก: 0, แก้ว: 0, กระดาษ: 0, อลูมิเนียม: 0 },
    { พลาสติก: 0, แก้ว: 0, กระดาษ: 0, อลูมิเนียม: 0 },
    { พลาสติก: 0, แก้ว: 0, กระดาษ: 0, อลูมิเนียม: 0 },
    { พลาสติก: 0, แก้ว: 0, กระดาษ: 0, อลูมิเนียม: 0 },
  ],
  บางยอ: [
    { พลาสติก: 100, แก้ว: 80, กระดาษ: 40, อลูมิเนียม: 20 },
    { พลาสติก: 90, แก้ว: 110, กระดาษ: 60, อลูมิเนียม: 30 },
    { พลาสติก: 130, แก้ว: 70, กระดาษ: 90, อลูมิเนียม: 35 },
    { พลาสติก: 110, แก้ว: 95, กระดาษ: 55, อลูมิเนียม: 25 },
    { พลาสติก: 40, แก้ว: 120, กระดาษ: 100, อลูมิเนียม: 45 },
    { พลาสติก: 95, แก้ว: 130, กระดาษ: 50, อลูมิเนียม: 90 },
    { พลาสติก: 0, แก้ว: 0, กระดาษ: 0, อลูมิเนียม: 0 },
    { พลาสติก: 0, แก้ว: 0, กระดาษ: 0, อลูมิเนียม: 0 },
    { พลาสติก: 0, แก้ว: 0, กระดาษ: 0, อลูมิเนียม: 0 },
    { พลาสติก: 0, แก้ว: 0, กระดาษ: 0, อลูมิเนียม: 0 },
    { พลาสติก: 0, แก้ว: 0, กระดาษ: 0, อลูมิเนียม: 0 },
    { พลาสติก: 0, แก้ว: 0, กระดาษ: 0, อลูมิเนียม: 0 },
  ],
  บางกอบัว: [
    { พลาสติก: 140, แก้ว: 100, กระดาษ: 50, อลูมิเนียม: 15 },
    { พลาสติก: 105, แก้ว: 130, กระดาษ: 75, อลูมิเนียม: 40 },
    { พลาสติก: 170, แก้ว: 55, กระดาษ: 105, อลูมิเนียม: 45 },
    { พลาสติก: 130, แก้ว: 108, กระดาษ: 65, อลูมิเนียม: 32 },
    { พลาสติก: 45, แก้ว: 138, กระดาษ: 115, อลูมิเนียม: 60 },
    { พลาสติก: 112, แก้ว: 142, กระดาษ: 58, อลูมิเนียม: 112 },
    { พลาสติก: 0, แก้ว: 0, กระดาษ: 0, อลูมิเนียม: 0 },
    { พลาสติก: 0, แก้ว: 0, กระดาษ: 0, อลูมิเนียม: 0 },
    { พลาสติก: 0, แก้ว: 0, กระดาษ: 0, อลูมิเนียม: 0 },
    { พลาสติก: 0, แก้ว: 0, กระดาษ: 0, อลูมิเนียม: 0 },
    { พลาสติก: 0, แก้ว: 0, กระดาษ: 0, อลูมิเนียม: 0 },
    { พลาสติก: 0, แก้ว: 0, กระดาษ: 0, อลูมิเนียม: 0 },
  ],
  บางกระสอบ: [
    { พลาสติก: 90, แก้ว: 70, กระดาษ: 35, อลูมิเนียม: 12 },
    { พลาสติก: 75, แก้ว: 95, กระดาษ: 52, อลูมิเนียม: 28 },
    { พลาสติก: 115, แก้ว: 48, กระดาษ: 78, อลูมิเนียม: 32 },
    { พลาสติก: 98, แก้ว: 82, กระดาษ: 48, อลูมิเนียม: 22 },
    { พลาสติก: 35, แก้ว: 102, กระดาษ: 88, อลูมิเนียม: 40 },
    { พลาสติก: 82, แก้ว: 112, กระดาษ: 44, อลูมิเนียม: 78 },
    { พลาสติก: 0, แก้ว: 0, กระดาษ: 0, อลูมิเนียม: 0 },
    { พลาสติก: 0, แก้ว: 0, กระดาษ: 0, อลูมิเนียม: 0 },
    { พลาสติก: 0, แก้ว: 0, กระดาษ: 0, อลูมิเนียม: 0 },
    { พลาสติก: 0, แก้ว: 0, กระดาษ: 0, อลูมิเนียม: 0 },
    { พลาสติก: 0, แก้ว: 0, กระดาษ: 0, อลูมิเนียม: 0 },
    { พลาสติก: 0, แก้ว: 0, กระดาษ: 0, อลูมิเนียม: 0 },
  ],
  บางน้ำผึ้ง: [
    { พลาสติก: 160, แก้ว: 130, กระดาษ: 55, อลูมิเนียม: 18 },
    { พลาสติก: 112, แก้ว: 155, กระดาษ: 82, อลูมิเนียม: 45 },
    { พลาสติก: 188, แก้ว: 58, กระดาษ: 112, อลูมิเนียม: 48 },
    { พลาสติก: 145, แก้ว: 112, กระดาษ: 72, อลูมิเนียม: 38 },
    { พลาสติก: 48, แก้ว: 145, กระดาษ: 122, อลูมิเนียม: 70 },
    { พลาสติก: 122, แก้ว: 148, กระดาษ: 60, อลูมิเนียม: 125 },
    { พลาสติก: 0, แก้ว: 0, กระดาษ: 0, อลูมิเนียม: 0 },
    { พลาสติก: 0, แก้ว: 0, กระดาษ: 0, อลูมิเนียม: 0 },
    { พลาสติก: 0, แก้ว: 0, กระดาษ: 0, อลูมิเนียม: 0 },
    { พลาสติก: 0, แก้ว: 0, กระดาษ: 0, อลูมิเนียม: 0 },
    { พลาสติก: 0, แก้ว: 0, กระดาษ: 0, อลูมิเนียม: 0 },
    { พลาสติก: 0, แก้ว: 0, กระดาษ: 0, อลูมิเนียม: 0 },
  ],
  ทรงคนอง: [
    { พลาสติก: 120, แก้ว: 95, กระดาษ: 45, อลูมิเนียม: 14 },
    { พลาสติก: 88, แก้ว: 118, กระดาษ: 68, อลูมิเนียม: 36 },
    { พลาสติก: 148, แก้ว: 52, กระดาษ: 96, อลูมิเนียม: 40 },
    { พลาสติก: 122, แก้ว: 102, กระดาษ: 60, อลูมิเนียม: 30 },
    { พลาสติก: 42, แก้ว: 125, กระดาษ: 108, อลูมิเนียม: 54 },
    { พลาสติก: 105, แก้ว: 136, กระดาษ: 52, อลูมิเนียม: 100 },
    { พลาสติก: 0, แก้ว: 0, กระดาษ: 0, อลูมิเนียม: 0 },
    { พลาสติก: 0, แก้ว: 0, กระดาษ: 0, อลูมิเนียม: 0 },
    { พลาสติก: 0, แก้ว: 0, กระดาษ: 0, อลูมิเนียม: 0 },
    { พลาสติก: 0, แก้ว: 0, กระดาษ: 0, อลูมิเนียม: 0 },
    { พลาสติก: 0, แก้ว: 0, กระดาษ: 0, อลูมิเนียม: 0 },
    { พลาสติก: 0, แก้ว: 0, กระดาษ: 0, อลูมิเนียม: 0 },
  ],
}

export type WasteTypeKey = 'พลาสติก' | 'แก้ว' | 'กระดาษ' | 'อลูมิเนียม'

export interface MonthlyRow {
  month: string
  พลาสติก: number
  แก้ว: number
  กระดาษ: number
  อลูมิเนียม: number
}

export function getMonthlyData(tambon: string, year = 2569): MonthlyRow[] {
  const base = monthlyBase[tambon] || monthlyBase['บางกะเจ้า']
  const months = ['01','02','03','04','05','06','07','08','09','10','11','12']
  return months.map((m, i) => ({
    month: `${year}-${m}`,
    ...base[i],
  }))
}

// Drop-off points per tambon (x,y in the 340x346 SVG coordinate space)
export interface DropOffPoint {
  id: string
  name: string
  x: number
  y: number
  type: 'bin' | 'temple' | 'school' | 'community'
}

export const DROP_OFF_POINTS: Record<string, DropOffPoint[]> = {
  บางกะเจ้า: [
    { id: 'bk1', name: 'จุดทิ้งหน้าวัดบางกะเจ้า', x: 148, y: 55, type: 'temple' },
    { id: 'bk2', name: 'จุดชุมชนซอย 3', x: 165, y: 80, type: 'bin' },
    { id: 'bk3', name: 'โรงเรียนบางกะเจ้า', x: 140, y: 105, type: 'school' },
    { id: 'bk4', name: 'ศาลาประชาคม', x: 180, y: 68, type: 'community' },
  ],
  บางยอ: [
    { id: 'by1', name: 'วัดบางยอ', x: 100, y: 170, type: 'temple' },
    { id: 'by2', name: 'จุดทิ้งตลาด', x: 115, y: 200, type: 'bin' },
    { id: 'by3', name: 'อบต.บางยอ', x: 90, y: 215, type: 'community' },
  ],
  บางกอบัว: [
    { id: 'bgb1', name: 'วัดบางกอบัว', x: 248, y: 90, type: 'temple' },
    { id: 'bgb2', name: 'จุดทิ้งริมคลอง', x: 265, y: 115, type: 'bin' },
    { id: 'bgb3', name: 'โรงเรียนบางกอบัว', x: 238, y: 130, type: 'school' },
  ],
  บางกระสอบ: [
    { id: 'bks1', name: 'วัดบางกระสอบ', x: 192, y: 235, type: 'temple' },
    { id: 'bks2', name: 'จุดชุมชน 1', x: 175, y: 255, type: 'bin' },
    { id: 'bks3', name: 'จุดชุมชน 2', x: 210, y: 260, type: 'community' },
  ],
  บางน้ำผึ้ง: [
    { id: 'bnp1', name: 'วัดบางน้ำผึ้ง', x: 268, y: 165, type: 'temple' },
    { id: 'bnp2', name: 'ตลาดน้ำบางน้ำผึ้ง', x: 285, y: 190, type: 'bin' },
    { id: 'bnp3', name: 'โรงเรียน', x: 255, y: 200, type: 'school' },
    { id: 'bnp4', name: 'ศาลาชุมชน', x: 295, y: 175, type: 'community' },
  ],
  ทรงคนอง: [
    { id: 'sk1', name: 'วัดทรงคนอง', x: 55, y: 265, type: 'temple' },
    { id: 'sk2', name: 'จุดทิ้งหมู่บ้าน', x: 70, y: 285, type: 'bin' },
    { id: 'sk3', name: 'ศาลาประชาคม', x: 40, y: 278, type: 'community' },
  ],
}

// Donations data per tambon
export interface Donation {
  place: string
  type: 'วัด' | 'โรงเรียน' | 'ชุมชน'
  amount: number
  donors: number
}

export const DONATIONS: Record<string, Donation[]> = {
  บางกะเจ้า: [
    { place: 'วัดบางกะเจ้า', type: 'วัด', amount: 12500, donors: 48 },
    { place: 'โรงเรียนบางกะเจ้า', type: 'โรงเรียน', amount: 7800, donors: 32 },
    { place: 'ศาลาชุมชนซอย 3', type: 'ชุมชน', amount: 4200, donors: 21 },
  ],
  บางยอ: [
    { place: 'วัดบางยอ', type: 'วัด', amount: 9800, donors: 38 },
    { place: 'อบต.บางยอ', type: 'ชุมชน', amount: 5500, donors: 27 },
  ],
  บางกอบัว: [
    { place: 'วัดบางกอบัว', type: 'วัด', amount: 11200, donors: 44 },
    { place: 'โรงเรียนบางกอบัว', type: 'โรงเรียน', amount: 6300, donors: 28 },
    { place: 'ชุมชนริมคลอง', type: 'ชุมชน', amount: 3800, donors: 18 },
  ],
  บางกระสอบ: [
    { place: 'วัดบางกระสอบ', type: 'วัด', amount: 8400, donors: 33 },
    { place: 'ชุมชนหมู่ 2', type: 'ชุมชน', amount: 3200, donors: 16 },
  ],
  บางน้ำผึ้ง: [
    { place: 'วัดบางน้ำผึ้ง', type: 'วัด', amount: 14600, donors: 55 },
    { place: 'ตลาดน้ำบางน้ำผึ้ง', type: 'ชุมชน', amount: 8900, donors: 40 },
    { place: 'โรงเรียนบางน้ำผึ้ง', type: 'โรงเรียน', amount: 5100, donors: 24 },
  ],
  ทรงคนอง: [
    { place: 'วัดทรงคนอง', type: 'วัด', amount: 10500, donors: 42 },
    { place: 'ศาลาชุมชนทรงคนอง', type: 'ชุมชน', amount: 4700, donors: 22 },
  ],
}

// Top waste contributors per tambon
export interface Contributor {
  rank: number
  name: string
  avatar: string // initials
  totalKg: number
  streak: number // months in a row
  badge: 'gold' | 'silver' | 'bronze' | 'regular'
}

export const TOP_CONTRIBUTORS: Record<string, Contributor[]> = {
  บางกะเจ้า: [
    { rank: 1, name: 'สมชาย รักษ์โลก', avatar: 'ส', totalKg: 248, streak: 6, badge: 'gold' },
    { rank: 2, name: 'นิดา สีเขียว', avatar: 'น', totalKg: 215, streak: 5, badge: 'silver' },
    { rank: 3, name: 'ประเสริฐ ใจดี', avatar: 'ป', totalKg: 198, streak: 6, badge: 'bronze' },
    { rank: 4, name: 'สุภาพร คุ้งน้ำ', avatar: 'ส', totalKg: 176, streak: 4, badge: 'regular' },
    { rank: 5, name: 'วิไล มณีเขียว', avatar: 'ว', totalKg: 154, streak: 3, badge: 'regular' },
  ],
  บางยอ: [
    { rank: 1, name: 'มานิต บางยอ', avatar: 'ม', totalKg: 210, streak: 6, badge: 'gold' },
    { rank: 2, name: 'ลักขณา ใบบัว', avatar: 'ล', totalKg: 185, streak: 5, badge: 'silver' },
    { rank: 3, name: 'ธีรพล คลองดี', avatar: 'ธ', totalKg: 162, streak: 4, badge: 'bronze' },
    { rank: 4, name: 'อนงค์ สุขใจ', avatar: 'อ', totalKg: 145, streak: 3, badge: 'regular' },
    { rank: 5, name: 'ชาตรี ริมน้ำ', avatar: 'ช', totalKg: 128, streak: 2, badge: 'regular' },
  ],
  บางกอบัว: [
    { rank: 1, name: 'บัวทอง คุ้งแม่น้ำ', avatar: 'บ', totalKg: 235, streak: 6, badge: 'gold' },
    { rank: 2, name: 'ศิริ กอบัว', avatar: 'ศ', totalKg: 204, streak: 5, badge: 'silver' },
    { rank: 3, name: 'ปราณี แม่น้ำ', avatar: 'ป', totalKg: 188, streak: 6, badge: 'bronze' },
    { rank: 4, name: 'สุรชัย เขียวขจี', avatar: 'ส', totalKg: 165, streak: 4, badge: 'regular' },
    { rank: 5, name: 'กมลา ร่มไม้', avatar: 'ก', totalKg: 142, streak: 3, badge: 'regular' },
  ],
  บางกระสอบ: [
    { rank: 1, name: 'อรุณ กระสอบ', avatar: 'อ', totalKg: 198, streak: 5, badge: 'gold' },
    { rank: 2, name: 'วรรณา ชลธี', avatar: 'ว', totalKg: 175, streak: 4, badge: 'silver' },
    { rank: 3, name: 'เกษม สายน้ำ', avatar: 'เ', totalKg: 155, streak: 4, badge: 'bronze' },
    { rank: 4, name: 'นงลักษณ์ ป่าเขา', avatar: 'น', totalKg: 138, streak: 3, badge: 'regular' },
    { rank: 5, name: 'ไพรัตน์ คนดี', avatar: 'ไ', totalKg: 120, streak: 2, badge: 'regular' },
  ],
  บางน้ำผึ้ง: [
    { rank: 1, name: 'จันทร์เพ็ญ น้ำผึ้ง', avatar: 'จ', totalKg: 265, streak: 6, badge: 'gold' },
    { rank: 2, name: 'เพชร ตลาดน้ำ', avatar: 'เ', totalKg: 238, streak: 6, badge: 'silver' },
    { rank: 3, name: 'กาญจนา ชลบุรี', avatar: 'ก', totalKg: 212, streak: 5, badge: 'bronze' },
    { rank: 4, name: 'ทองสุข สิ่งแวดล้อม', avatar: 'ท', totalKg: 188, streak: 4, badge: 'regular' },
    { rank: 5, name: 'รัตนา สีเขียว', avatar: 'ร', totalKg: 165, streak: 3, badge: 'regular' },
  ],
  ทรงคนอง: [
    { rank: 1, name: 'สมศรี ทรงคนอง', avatar: 'ส', totalKg: 222, streak: 6, badge: 'gold' },
    { rank: 2, name: 'พิชัย ใจบุญ', avatar: 'พ', totalKg: 196, streak: 5, badge: 'silver' },
    { rank: 3, name: 'นภา คูคลอง', avatar: 'น', totalKg: 178, streak: 4, badge: 'bronze' },
    { rank: 4, name: 'ชัยวัฒน์ ร่มบัว', avatar: 'ช', totalKg: 158, streak: 3, badge: 'regular' },
    { rank: 5, name: 'สุมาลี ธรรมชาติ', avatar: 'ส', totalKg: 135, streak: 2, badge: 'regular' },
  ],
}
