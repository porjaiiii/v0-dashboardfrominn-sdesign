/**
 * ชนิดข้อมูลของ Supabase schema `app` (ตรงกับไฟล์ SQL ที่ใช้สร้างตาราง)
 * ชื่อ field ตรงกับชื่อคอลัมน์ทุกตัว เพื่อให้ผลลัพธ์จาก PostgREST ใช้ได้ทันทีโดยไม่ต้องแปลง
 *
 * timestamptz / date ถูกส่งมาเป็น ISO string, numeric ส่งมาเป็น number
 */

export interface RefUserType {
  value: string
  is_tourist: boolean
  sort_order: number
  is_active: boolean
}

export interface WasteType {
  id: string
  name_th: string
  icon_path: string | null
  carbon_factor: number
  points_per_kg: number
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface WasteSubtype {
  waste_type_id: string
  id: string
  name_th: string
  description_th: string | null
  image_path: string | null
  sort_order: number
  is_active: boolean
  /** null = ใช้ค่าของ waste_types.points_per_kg */
  points_per_kg: number | null
}

export interface User {
  line_user_id: string
  display_user_id: string | null
  pdpa_consent: string | null
  full_name: string | null
  nickname: string | null
  phone_number: string | null
  gender: string | null
  age_range: string | null
  user_type: string | null
  address: string | null
  subdistrict: string | null
  occupation: string | null
  registration_date_th: string | null
  registered_at: string
  is_legacy: boolean
  created_at: string
  updated_at: string
}

export type WasteRecordStatus = 'pending' | 'done' | 'cancelled'

export interface WasteRecord {
  id: number
  line_user_id: string
  waste_type_id: string
  waste_subtype_id: string | null
  weight_kg: number | null
  image_urls: string[]
  carbon_reduction_kg: number
  points_earned: number
  status: WasteRecordStatus
  notes: string | null
  applied_carbon_factor: number | null
  applied_points_per_kg: number | null
  idempotency_key: string | null
  recorded_at: string
  is_legacy: boolean
  created_at: string
  updated_at: string
}

export interface PointsAccount {
  line_user_id: string
  lifetime_earned: number
  lifetime_spent: number
  total_weight_kg: number
  total_co2_kg: number
  tier: string
  last_updated: string
}

export interface PointLot {
  id: number
  line_user_id: string
  /** รูปแบบ YYYY-MM */
  period: string
  earned_points: number
  consumed_points: number
  remaining_points: number | null
  status: 'active' | 'expired'
  expires_at: string | null
  earned_at: string
  source_waste_id: number | null
  is_legacy: boolean
  created_at: string
}

export type PointTxKind = 'earn' | 'spend' | 'expire' | 'adjust'

export interface PointTransaction {
  tx_id: string
  line_user_id: string
  kind: PointTxKind
  points_delta: number
  co2_kg: number
  weight_kg: number
  category: string | null
  idempotency_key: string | null
  is_legacy: boolean
  occurred_at: string
  created_at: string
}

export interface PointLedgerEntry {
  id: number
  tx_id: string
  lot_id: number
  points_delta: number
  created_at: string
}

export interface SpendDetail {
  id: number
  tx_id: string
  line_user_id: string
  category: string
  item_name: string
  quantity: number
  points: number
  status: 'บริจาคสำเร็จ' | 'รอใช้งานคูปอง' | 'ใช้คูปองแล้ว'
  occurred_at: string
}

export interface Reward {
  id: number
  name: string
  description: string
  points: number
  image_path: string
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
  is_variable: boolean
  min_points: number | null
  /** null = ไม่จำกัดจำนวน */
  stock: number | null
}

export type CouponStatus = 'active' | 'used' | 'expired' | 'cancelled'

export interface Coupon {
  coupon_id: string
  line_user_id: string
  reward_id: number | null
  reward_name: string
  reward_description: string
  reward_image: string
  points_used: number
  tx_id: string | null
  status: CouponStatus
  redeemed_at: string
  used_at: string | null
  expires_at: string | null
  scanned_by: string | null
  redeem_type: 'pickup' | 'delivery' | null
  idempotency_key: string | null
  is_legacy: boolean
  created_at: string
}

export interface AdminKey {
  key: string
  status: 'unused' | 'active' | 'revoked'
  line_user_id: string | null
  activated_at: string | null
  /** คอลัมน์ชื่อ "MD" ใน schema */
  MD: string | null
}

export interface DonationCampaign {
  id: number
  name: string
  description: string
  image_path: string
  opened_at: string
  closes_at: string | null
  current_amount: number
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

/* ───────────── รูปแบบข้อมูลที่ API ส่งให้หน้าแอดมิน ───────────── */

export interface Page<T> {
  rows: T[]
  total: number
}

export interface ListParams {
  page: number
  pageSize: number
  q?: string
  sort?: string
  subdistrict?: string
  status?: string
}

export interface DashboardSummary {
  users: number
  totalWeightKg: number
  totalCo2Kg: number
  pointsIssued: number
}

/** แถวของหน้า "สูตรคะแนน" = 1 แถวต่อ subtype */
export interface FormulaRow {
  waste_type_id: string
  waste_subtype_id: string
  type_name: string
  subtype_name: string
  /** ค่าที่ใช้จริง = subtype.points_per_kg ?? type.points_per_kg */
  points_per_kg: number
  is_active: boolean
}

/** แถวของหน้า "สต๊อกรางวัล" */
export interface RewardStockRow {
  id: number
  name: string
  image_path: string
  stock: number | null
  /** จำนวนคูปองที่ยังไม่ได้ใช้ (coupons.status = 'active') */
  reserved: number
  is_active: boolean
}

export interface RewardsOverview {
  rewardTypes: number
  totalStock: number
  lowStock: { id: number; name: string; stock: number }[]
  outOfStock: number
  /** อันดับของรางวัลที่ถูกแลกมากที่สุด (นับจาก coupons ในช่วงที่เลือก) */
  topRedeemed: { name: string; count: number }[]
  pointsSpent: number
}
