/**
 * คำสั่งอ่าน/เขียนข้อมูลของหน้าแอดมิน
 * - ตั้ง SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY แล้ว → อ่านจาก Supabase schema `app`
 * - ยังไม่ตั้ง → ใช้ข้อมูลตัวอย่างจาก ./mock (รูปแบบเดียวกัน) เพื่อให้พัฒนา UI ต่อได้
 *
 * ทุกฟังก์ชันคืนชนิดข้อมูลเดียวกันทั้งสองโหมด ดู ./types
 */

import { LOW_STOCK_THRESHOLD, RESTOCK_TARGET } from './constants'
import * as mock from './mock'
import { isSupabaseConfigured, quoteFilterValue, sbSelect, sbUpdate } from './supabase-rest'
import type {
  Coupon,
  DashboardSummary,
  FormulaRow,
  ListParams,
  Page,
  PointsAccount,
  Reward,
  RewardStockRow,
  RewardsOverview,
  User,
  WasteRecord,
  WasteSubtype,
  WasteType,
} from './types'

/* ───────────── helper ───────────── */

const offsetOf = (p: ListParams) => (p.page - 1) * p.pageSize

function paginate<T>(rows: T[], p: ListParams): Page<T> {
  return { rows: rows.slice(offsetOf(p), offsetOf(p) + p.pageSize), total: rows.length }
}

/** ค้นหาแบบ ilike (ตัด wildcard ที่ผู้ใช้พิมพ์มาเพื่อไม่ให้เปลี่ยนความหมายของ pattern) */
function likePattern(value: string): string {
  return `*${value.replace(/[*%,()]/g, ' ').trim()}*`
}

const includes = (haystack: (string | null | undefined)[], q?: string) =>
  !q || haystack.some((h) => (h ?? '').toLowerCase().includes(q.toLowerCase()))

/* ───────────── ผู้ใช้ / เจ้าหน้าที่ ───────────── */

const USER_SORT: Record<string, string> = {
  age: 'age_range.asc',
  name: 'full_name.asc',
  registered: 'registered_at.desc',
}

function userFilters(p: ListParams, prefix = ''): Record<string, string> {
  const f: Record<string, string> = {}
  if (p.subdistrict) f[`${prefix}subdistrict`] = `ilike.${likePattern(p.subdistrict)}`
  if (p.q) {
    const pat = likePattern(p.q)
    // ใช้ or ของ PostgREST — quote ค่าเพื่อกัน , ( ) หลุดเข้าไปเป็นเงื่อนไขอื่น
    const cols = ['full_name', 'nickname', 'phone_number', 'line_user_id']
    f[prefix ? `${prefix.slice(0, -1)}.or` : 'or'] =
      `(${cols.map((c) => `${c}.ilike.${quoteFilterValue(pat)}`).join(',')})`
  }
  return f
}

export async function getUsers(p: ListParams): Promise<Page<User>> {
  if (!isSupabaseConfigured()) {
    const rows = mock.MOCK_USERS.filter(
      (u) => includes([u.full_name, u.nickname, u.phone_number, u.line_user_id], p.q) && includes([u.subdistrict], p.subdistrict),
    )
    return paginate(rows, p)
  }
  return sbSelect<User>('users', {
    filters: { ...userFilters(p), order: USER_SORT[p.sort ?? ''] ?? USER_SORT.registered },
    limit: p.pageSize,
    offset: offsetOf(p),
  })
}

/** เจ้าหน้าที่ = admin_keys ที่ status = active แล้ว join กับ users */
export async function getStaff(p: ListParams): Promise<Page<User>> {
  if (!isSupabaseConfigured()) {
    const rows = mock.MOCK_ADMIN_KEYS.map((k) => k.user).filter(
      (u) => includes([u.full_name, u.nickname, u.phone_number, u.line_user_id], p.q) && includes([u.subdistrict], p.subdistrict),
    )
    return paginate(rows, p)
  }
  const sortCol = (USER_SORT[p.sort ?? ''] ?? USER_SORT.registered).split('.')
  const { rows, total } = await sbSelect<{ users: User }>('admin_keys', {
    select: 'key,users!inner(*)',
    filters: {
      status: 'eq.active',
      ...userFilters(p, 'users.'),
      order: `users(${sortCol[0]}).${sortCol[1]}`,
    },
    limit: p.pageSize,
    offset: offsetOf(p),
  })
  return { rows: rows.map((r) => r.users), total }
}

/* ───────────── รายการบันทึกขยะ ───────────── */

const RECORD_SORT: Record<string, string> = {
  time: 'recorded_at.desc',
  weight: 'weight_kg.desc.nullslast',
  points: 'points_earned.desc',
}

export async function getWasteRecords(p: ListParams): Promise<Page<WasteRecord>> {
  if (!isSupabaseConfigured()) {
    const subOf = (id: string) => mock.MOCK_USERS.find((u) => u.line_user_id === id)?.subdistrict
    const rows = mock.MOCK_WASTE_RECORDS.filter(
      (r) => (!p.status || r.status === p.status) && includes([subOf(r.line_user_id)], p.subdistrict),
    )
    return paginate(rows, p)
  }
  const filters: Record<string, string> = { order: RECORD_SORT[p.sort ?? ''] ?? RECORD_SORT.time }
  if (p.status) filters.status = `eq.${p.status}`
  if (p.subdistrict) filters['users.subdistrict'] = `ilike.${likePattern(p.subdistrict)}`
  return sbSelect<WasteRecord>('waste_records', {
    select: p.subdistrict ? '*,users!inner(subdistrict)' : '*',
    filters,
    limit: p.pageSize,
    offset: offsetOf(p),
  })
}

/* ───────────── สรุปตัวเลข Dashboard ───────────── */

export async function getSummary(): Promise<DashboardSummary> {
  if (!isSupabaseConfigured()) {
    const done = mock.MOCK_WASTE_RECORDS.filter((r) => r.status === 'done')
    return {
      users: mock.MOCK_USERS.length,
      totalWeightKg: done.reduce((s, r) => s + (r.weight_kg ?? 0), 0),
      totalCo2Kg: done.reduce((s, r) => s + r.carbon_reduction_kg, 0),
      pointsIssued: done.reduce((s, r) => s + r.points_earned, 0),
    }
  }
  const [{ total: users }, accounts] = await Promise.all([
    sbSelect<{ line_user_id: string }>('users', { select: 'line_user_id', limit: 1 }),
    // TODO: ถ้าข้อมูลเยอะ ให้สร้าง SQL view/RPC สรุปผลฝั่งฐานข้อมูลแทนการรวมตรงนี้
    sbSelect<Pick<PointsAccount, 'lifetime_earned' | 'total_weight_kg' | 'total_co2_kg'>>('points_accounts', {
      select: 'lifetime_earned,total_weight_kg,total_co2_kg',
      limit: 100000,
    }),
  ])
  return {
    users,
    totalWeightKg: accounts.rows.reduce((s, a) => s + Number(a.total_weight_kg), 0),
    totalCo2Kg: accounts.rows.reduce((s, a) => s + Number(a.total_co2_kg), 0),
    pointsIssued: accounts.rows.reduce((s, a) => s + Number(a.lifetime_earned), 0),
  }
}

/* ───────────── สต๊อกรางวัล ───────────── */

function activeCouponCount(coupons: Pick<Coupon, 'reward_id' | 'status'>[]): Map<number, number> {
  const m = new Map<number, number>()
  coupons.forEach((c) => {
    if (c.reward_id !== null && c.status === 'active') m.set(c.reward_id, (m.get(c.reward_id) ?? 0) + 1)
  })
  return m
}

export async function getRewardStock(p: ListParams): Promise<Page<RewardStockRow>> {
  let rewards: Reward[]
  let coupons: Pick<Coupon, 'reward_id' | 'status'>[]
  if (!isSupabaseConfigured()) {
    rewards = mock.MOCK_REWARDS
    coupons = mock.MOCK_COUPONS
  } else {
    const [r, c] = await Promise.all([
      sbSelect<Reward>('rewards', { filters: { order: 'sort_order.asc,id.asc' }, limit: 1000 }),
      sbSelect<Pick<Coupon, 'reward_id' | 'status'>>('coupons', {
        select: 'reward_id,status',
        filters: { status: 'eq.active' },
        limit: 100000,
      }),
    ])
    rewards = r.rows
    coupons = c.rows
  }
  const reserved = activeCouponCount(coupons)
  let rows: RewardStockRow[] = rewards.map((r) => ({
    id: r.id,
    name: r.name,
    image_path: r.image_path,
    stock: r.stock,
    reserved: reserved.get(r.id) ?? 0,
    is_active: r.is_active,
  }))
  if (p.q) rows = rows.filter((r) => r.name.includes(p.q!))
  if (p.sort === 'stock_asc') rows.sort((a, b) => (a.stock ?? Infinity) - (b.stock ?? Infinity))
  if (p.sort === 'stock_desc') rows.sort((a, b) => (b.stock ?? -1) - (a.stock ?? -1))
  return paginate(rows, p)
}

export async function updateRewardStock(id: number, stock: number): Promise<void> {
  if (!Number.isInteger(stock) || stock < 0) throw new Error('stock ต้องเป็นจำนวนเต็มตั้งแต่ 0 ขึ้นไป')
  if (!isSupabaseConfigured()) {
    const r = mock.MOCK_REWARDS.find((x) => x.id === id)
    if (r) r.stock = stock
    return
  }
  await sbUpdate('rewards', { id: `eq.${id}` }, { stock, updated_at: new Date().toISOString() })
}

/* ───────────── ภาพรวมของรางวัล ───────────── */

export async function getRewardsOverview(period: string): Promise<RewardsOverview> {
  // period = YYYY-MM (ค.ศ.)
  if (!/^\d{4}-\d{2}$/.test(period)) throw new Error('period ต้องอยู่ในรูปแบบ YYYY-MM')
  const [y, m] = period.split('-').map(Number)
  const from = new Date(Date.UTC(y, m - 1, 1)).toISOString()
  const to = new Date(Date.UTC(y, m, 1)).toISOString()

  let rewards: Reward[]
  let coupons: Pick<Coupon, 'reward_name' | 'points_used' | 'status' | 'redeemed_at'>[]
  if (!isSupabaseConfigured()) {
    rewards = mock.MOCK_REWARDS
    coupons = mock.MOCK_COUPONS.filter((c) => c.redeemed_at >= from && c.redeemed_at < to)
  } else {
    const [r, c] = await Promise.all([
      sbSelect<Reward>('rewards', { limit: 1000 }),
      sbSelect<Pick<Coupon, 'reward_name' | 'points_used' | 'status' | 'redeemed_at'>>('coupons', {
        select: 'reward_name,points_used,status,redeemed_at',
        // and=(...) ใช้กรองช่วงเวลาสองด้านบนคอลัมน์เดียวกัน
        filters: { and: `(redeemed_at.gte.${from},redeemed_at.lt.${to})` },
        limit: 100000,
      }),
    ])
    rewards = r.rows
    coupons = c.rows
  }

  const counted = coupons.filter((c) => c.status !== 'cancelled')
  const byName = new Map<string, number>()
  counted.forEach((c) => byName.set(c.reward_name, (byName.get(c.reward_name) ?? 0) + 1))

  const tracked = rewards.filter((r) => r.is_active && r.stock !== null)
  return {
    rewardTypes: rewards.filter((r) => r.is_active).length,
    totalStock: tracked.reduce((s, r) => s + (r.stock ?? 0), 0),
    lowStock: tracked
      .filter((r) => (r.stock ?? 0) <= LOW_STOCK_THRESHOLD)
      .map((r) => ({ id: r.id, name: r.name, stock: r.stock ?? 0 }))
      .sort((a, b) => a.stock - b.stock),
    outOfStock: tracked.filter((r) => r.stock === 0).length,
    topRedeemed: [...byName].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 5),
    pointsSpent: counted.reduce((s, c) => s + c.points_used, 0),
  }
}

export { RESTOCK_TARGET }

/* ───────────── สูตรคะแนน ───────────── */

export async function getFormulas(p: ListParams): Promise<Page<FormulaRow>> {
  let types: WasteType[]
  let subtypes: WasteSubtype[]
  if (!isSupabaseConfigured()) {
    types = mock.MOCK_WASTE_TYPES
    subtypes = mock.MOCK_WASTE_SUBTYPES
  } else {
    const [t, s] = await Promise.all([
      sbSelect<WasteType>('waste_types', { filters: { order: 'sort_order.asc' }, limit: 1000 }),
      sbSelect<WasteSubtype>('waste_subtypes', { filters: { order: 'sort_order.asc' }, limit: 5000 }),
    ])
    types = t.rows
    subtypes = s.rows
  }
  const typeById = new Map(types.map((t) => [t.id, t]))
  let rows: FormulaRow[] = subtypes
    .filter((s) => typeById.has(s.waste_type_id))
    .map((s) => {
      const t = typeById.get(s.waste_type_id)!
      return {
        waste_type_id: s.waste_type_id,
        waste_subtype_id: s.id,
        type_name: t.name_th,
        subtype_name: s.name_th,
        points_per_kg: Number(s.points_per_kg ?? t.points_per_kg),
        is_active: s.is_active,
      }
    })
  if (p.q) rows = rows.filter((r) => `${r.type_name}${r.subtype_name}`.includes(p.q!))
  if (p.status === 'active') rows = rows.filter((r) => r.is_active)
  if (p.status === 'inactive') rows = rows.filter((r) => !r.is_active)
  if (p.sort === 'points_asc') rows.sort((a, b) => a.points_per_kg - b.points_per_kg)
  if (p.sort === 'points_desc') rows.sort((a, b) => b.points_per_kg - a.points_per_kg)
  return paginate(rows, p)
}

export async function updateSubtypeActive(waste_type_id: string, waste_subtype_id: string, is_active: boolean): Promise<void> {
  if (!isSupabaseConfigured()) {
    const s = mock.MOCK_WASTE_SUBTYPES.find((x) => x.waste_type_id === waste_type_id && x.id === waste_subtype_id)
    if (s) s.is_active = is_active
    return
  }
  await sbUpdate('waste_subtypes', { waste_type_id: `eq.${waste_type_id}`, id: `eq.${waste_subtype_id}` }, { is_active })
}
