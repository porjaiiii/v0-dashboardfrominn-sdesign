/**
 * ข้อมูลตัวอย่างในรูปแบบเดียวกับตารางใน Supabase
 * ใช้แทนเมื่อยังไม่ได้ตั้ง SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY เพื่อให้หน้าแอดมินยังแสดงผลได้
 * เมื่อเชื่อม Supabase แล้วไฟล์นี้จะไม่ถูกใช้ (ลบทิ้งได้)
 */

import type { AdminKey, Coupon, Reward, User, WasteRecord, WasteSubtype, WasteType } from './types'

const NOW = '2026-09-30T00:00:00+07:00'

const user = (
  line_user_id: string,
  display_user_id: string | null,
  full_name: string,
  nickname: string,
  phone_number: string,
  gender: string,
  age_range: string,
  user_type: string,
  occupation: string,
  registered_at: string,
): User => ({
  line_user_id,
  display_user_id,
  pdpa_consent: 'accepted',
  full_name,
  nickname,
  phone_number,
  gender,
  age_range,
  user_type,
  address: null,
  subdistrict: 'บางกอบัว',
  occupation,
  registration_date_th: null,
  registered_at,
  is_legacy: false,
  created_at: registered_at,
  updated_at: registered_at,
})

export const MOCK_USERS: User[] = [
  user('Uf1a2b3c4d5', null, 'สมชาย ใจดี', 'สมชาย', '081-234-5678', 'ชาย', '25-34', 'ผู้ใช้ทั่วไป', 'พนักงานบริษัท', '2024-01-12T09:00:00+07:00'),
  user('Ux2y3z4w5e6', null, 'นันทพร สุขใจ', 'นันทพร', '081-987-6543', 'หญิง', '35-44', 'ผู้ใช้ทั่วไป', 'ครู', '2024-01-15T09:00:00+07:00'),
  user('Ub3c4d5e6f7', 'กิตติพงษ์ วงศ์สว่าง', 'กิตติพงษ์ วงศ์สว่าง', 'กิตติพงษ์', '089-123-4567', 'ชาย', '18-24', 'ผู้ใช้ทั่วไป', 'นักศึกษา', '2024-01-18T09:00:00+07:00'),
  user('Ua4b5c6d7e8', null, 'สุภาพร บุญชัย', 'สุภาพร', '081-555-1234', 'หญิง', '45-54', 'ผู้ใช้ทั่วไป', 'เจ้าของกิจการ', '2024-01-22T09:00:00+07:00'),
  user('Ue5f6g7h8i9', 'ธนพล วรพงษ์', 'ธนพล วรพงษ์', 'ธนพล', '089-901-2345', 'ชาย', '55+', 'ผู้ใช้ทั่วไป', 'เกษียณ', '2024-01-25T09:00:00+07:00'),
  user('Uj6k7l8m9n0', null, 'พิมพา รุ่งเรือง', 'พิมพา', '081-777-8888', 'หญิง', '25-34', 'ผู้ใช้ทั่วไป', 'พนักงานบริษัท', '2024-01-28T09:00:00+07:00'),
  user('Uo7p8q9r0s1', 'วีรศักดิ์ นิยมไทย', 'วีรศักดิ์ นิยมไทย', 'วีรศักดิ์', '089-444-5555', 'ชาย', '35-44', 'ผู้ใช้ทั่วไป', 'พนักงานบริษัท', '2024-02-01T09:00:00+07:00'),
  user('Up9q0r1s2t3', null, 'สุวิมล สุขมาล', 'สุวิมล', '081-222-3333', 'หญิง', '18-24', 'ผู้ใช้ทั่วไป', 'นักศึกษา', '2024-02-05T09:00:00+07:00'),
  user('Uv1w2x3y4z5', 'รัฐพล ศรีสมุทร', 'รัฐพล ศรีสมุทร', 'รัฐพล', '089-666-7777', 'ชาย', '45-54', 'ผู้ใช้ทั่วไป', 'เจ้าของกิจการ', '2024-02-10T09:00:00+07:00'),
  user('Ua2b3c4d5e6', null, 'นภาพร วงศ์สว่าง', 'นภาพร', '081-888-9999', 'หญิง', '25-34', 'ผู้ใช้ทั่วไป', 'ครู', '2024-02-12T09:00:00+07:00'),
]

export const MOCK_STAFF_USERS: User[] = [
  user('Ua1b2c3d4e5', 'admin01', 'วิภา รักษ์โลก', 'วิ', '089-876-5432', 'หญิง', '35-44', 'แอดมิน', '-', '2023-03-05T09:00:00+07:00'),
  user('Ua2c3d4e5f6', 'admin02', 'สมศักดิ์ มั่นคง', 'ศักดิ์', '081-555-1234', 'ชาย', '45-54', 'เจ้าหน้าที่', '-', '2023-05-12T09:00:00+07:00'),
  user('Ub3c4d5e6f8', 'admin03', 'กิตติพงษ์ วงศ์สว่าง', 'กิตติ', '089-123-4567', 'ชาย', '18-24', 'แอดมิน', '-', '2023-05-18T09:00:00+07:00'),
  user('Ua4b5c6d7e9', 'admin04', 'สุภาพร บุญชัย', 'สุ', '081-555-1234', 'หญิง', '45-54', 'เจ้าหน้าที่', '-', '2023-05-22T09:00:00+07:00'),
  user('Ue5f6g7h8j0', 'admin05', 'ธนพล วรพงษ์', 'ธนพล', '089-901-2345', 'ชาย', '55+', 'แอดมิน', '-', '2023-05-25T09:00:00+07:00'),
]

export const MOCK_ADMIN_KEYS: (AdminKey & { user: User })[] = MOCK_STAFF_USERS.map((u, i) => ({
  key: `KEY-${i + 1}`,
  status: 'active',
  line_user_id: u.line_user_id,
  activated_at: u.registered_at,
  MD: null,
  user: u,
}))

const rec = (
  id: number,
  line_user_id: string,
  waste_type_id: string,
  weight_kg: number,
  status: WasteRecord['status'],
  recorded_at: string,
  is_legacy = false,
): WasteRecord => ({
  id,
  line_user_id,
  waste_type_id,
  waste_subtype_id: null,
  weight_kg,
  image_urls: [],
  carbon_reduction_kg: weight_kg / 2,
  points_earned: Math.round(weight_kg * 10),
  status,
  notes: null,
  applied_carbon_factor: 0.5,
  applied_points_per_kg: 10,
  idempotency_key: null,
  recorded_at,
  is_legacy,
  created_at: recorded_at,
  updated_at: recorded_at,
})

export const MOCK_WASTE_RECORDS: WasteRecord[] = [
  rec(1, 'Uf1a2b3c4d5', 'plastic', 2.5, 'done', '2024-01-12T09:30:00+07:00'),
  rec(2, 'Ua2c3d4e5f6', 'glass', 1.8, 'pending', '2024-01-12T10:15:00+07:00'),
  rec(3, 'Ub3c4d5e6f7', 'paper', 3.2, 'done', '2024-01-12T11:05:00+07:00'),
  rec(4, 'Ua4b5c6d7e8', 'aluminium', 0.5, 'cancelled', '2024-01-12T12:40:00+07:00', true),
  rec(5, 'Ue5f6g7h8i9', 'glass', 4.0, 'done', '2024-01-13T08:10:00+07:00'),
  rec(6, 'Uj6k7l8m9n0', 'plastic', 2.1, 'pending', '2024-01-13T09:25:00+07:00'),
  rec(7, 'Uo7p8q9r0s1', 'paper', 1.9, 'done', '2024-01-13T11:50:00+07:00'),
  rec(8, 'Up9q0r1s2t3', 'aluminium', 0.7, 'cancelled', '2024-01-13T14:20:00+07:00'),
  rec(9, 'Uv1w2x3y4z5', 'glass', 3.5, 'done', '2024-01-14T08:45:00+07:00'),
  rec(10, 'Ua2b3c4d5e6', 'plastic', 2.8, 'pending', '2024-01-14T10:10:00+07:00', true),
  rec(11, 'Ux2y3z4w5e6', 'glass', 1.6, 'done', '2024-01-14T12:55:00+07:00'),
  rec(12, 'Uy7a8b9c0d1', 'paper', 2.4, 'done', '2024-01-15T09:15:00+07:00'),
]

const wt = (id: string, name_th: string, points_per_kg: number, sort_order: number): WasteType => ({
  id,
  name_th,
  icon_path: null,
  carbon_factor: 0.5,
  points_per_kg,
  sort_order,
  is_active: true,
  created_at: NOW,
  updated_at: NOW,
})

export const MOCK_WASTE_TYPES: WasteType[] = [
  wt('plastic', 'พลาสติก', 10, 1),
  wt('glass', 'แก้ว', 8, 2),
  wt('paper', 'กระดาษ', 5, 3),
  wt('aluminium', 'อลูมิเนียม', 15, 4),
]

const st = (waste_type_id: string, id: string, name_th: string, sort_order: number): WasteSubtype => ({
  waste_type_id,
  id,
  name_th,
  description_th: null,
  image_path: null,
  sort_order,
  is_active: true,
  points_per_kg: null,
})

export const MOCK_WASTE_SUBTYPES: WasteSubtype[] = [
  st('plastic', 'pet', 'ขวดพลาสติกใส PET', 1),
  st('glass', 'clear', 'ขวดแก้วใส/เขียว', 1),
  st('paper', 'a4', 'กระดาษขาว A4', 1),
  st('aluminium', 'can', 'กระป๋องอลูมิเนียม', 1),
]

const reward = (id: number, name: string, stock: number | null, is_active = true): Reward => ({
  id,
  name,
  description: '',
  points: 100,
  image_path: '',
  sort_order: id,
  is_active,
  created_at: NOW,
  updated_at: NOW,
  is_variable: false,
  min_points: null,
  stock,
})

export const MOCK_REWARDS: Reward[] = [
  reward(1, 'มาม่ารสแซ่บ', 26),
  reward(2, 'ผงซักฟอก', 85),
  reward(3, 'น้ำตาล', 50),
  reward(4, 'ช้างสาร', 10),
  reward(5, 'มาม่ารสเปรี้ยว', 8),
  reward(6, 'ทูน่ากระป๋อง', 30),
  reward(7, 'เกลืออร่อย', 0),
]

const coupon = (n: number, reward_id: number, reward_name: string, status: Coupon['status']): Coupon => ({
  coupon_id: `C${n}`,
  line_user_id: MOCK_USERS[n % MOCK_USERS.length].line_user_id,
  reward_id,
  reward_name,
  reward_description: '',
  reward_image: '',
  points_used: 100,
  tx_id: null,
  status,
  redeemed_at: '2026-09-15T10:00:00+07:00',
  used_at: null,
  expires_at: null,
  scanned_by: null,
  redeem_type: 'pickup',
  idempotency_key: null,
  is_legacy: false,
  created_at: NOW,
})

export const MOCK_COUPONS: Coupon[] = [
  ...Array.from({ length: 2 }, (_, i) => coupon(i, 1, 'มาม่ารสแซ่บ', 'active')),
  ...Array.from({ length: 21 }, (_, i) => coupon(10 + i, 1, 'มาม่ารสแซ่บ', 'used')),
  ...Array.from({ length: 17 }, (_, i) => coupon(40 + i, 7, 'เกลืออร่อย', 'used')),
  ...Array.from({ length: 10 }, (_, i) => coupon(70 + i, 2, 'ผงซักฟอก', 'used')),
]
