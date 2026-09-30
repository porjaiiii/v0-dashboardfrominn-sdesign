/** ค่าคงที่ที่ใช้ทั้งฝั่ง client และ server (ไม่มีอยู่ใน schema จึงกำหนดที่นี่) */

/** สต๊อกที่ถือว่า "เต็ม 100%" ใช้คำนวณแถบเปอร์เซ็นต์ในหน้าสต๊อกรางวัล (schema ไม่มีคอลัมน์ max_stock) */
export const STOCK_FULL_LEVEL = 100

/** สต๊อกต่ำกว่าหรือเท่ากับค่านี้ = "ของใกล้หมด" */
export const LOW_STOCK_THRESHOLD = 10

/** คำแนะนำเติมสต๊อก: เติมให้ถึงระดับนี้ */
export const RESTOCK_TARGET = 30

export const PAGE_SIZE = 10

/** เพิ่มคอลัมน์ตำบลจริงของบางกะเจ้า — ค่า "ทุกตำบล" = ไม่กรอง */
export const ALL_SUBDISTRICTS = 'ทุกตำบล'
export const SUBDISTRICTS = ['บางกอบัว', 'บางกะเจ้า', 'บางยอ', 'บางน้ำผึ้ง', 'ทรงคนอง', 'หนองปรือ']
