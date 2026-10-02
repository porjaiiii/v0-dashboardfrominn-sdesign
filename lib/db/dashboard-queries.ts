/**
 * ข้อมูลหน้า Dashboard แอดมิน — รวมข้อมูลดิบเป็นรายเดือน (เวลาไทย UTC+7)
 *
 * แหล่งข้อมูล (Supabase schema app):
 *   ผู้ใช้            users.registered_at
 *   ขยะ              waste_records (status = done): recorded_at, weight_kg, carbon_reduction_kg
 *   คะแนน            point_transactions (kind = earn | spend): occurred_at, points_delta
 *   ของรางวัลที่แลก    coupons (ไม่นับ cancelled): reward_name, redeemed_at
 *
 * ยังไม่เชื่อม Supabase → สร้างข้อมูลตัวอย่างจำลอง (deterministic) แล้วรวมด้วยโค้ดชุดเดียวกัน
 * TODO: ถ้าข้อมูลมาก ให้สร้าง SQL view/RPC สรุปรายเดือนฝั่งฐานข้อมูลแทนการดึงทุกแถวมารวมที่นี่
 */

import { isSupabaseConfigured, sbSelectAll } from './supabase-rest'
import type { DashboardChange, DashboardData, DashboardMonth } from './types'

interface RawData {
  userDates: string[]
  wastes: { at: string; kg: number; co2: number }[]
  /** points_delta: earn เป็นบวก, spend เป็นลบ */
  points: { at: string; kind: 'earn' | 'spend'; delta: number }[]
  coupons: { name: string; at: string }[]
}

const TH_MONTHS_FULL = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม']

/* ───────────── เวลาไทย ───────────── */

/** ISO → [ปี, เดือน 1–12] ตามเวลาไทย */
function ym(iso: string): [number, number] | null {
  const t = new Date(iso).getTime()
  if (!Number.isFinite(t)) return null
  const d = new Date(t + 7 * 3600 * 1000)
  return [d.getUTCFullYear(), d.getUTCMonth() + 1]
}

const key = (y: number, m: number) => y * 12 + (m - 1)

/* ───────────── โหลดข้อมูลดิบ ───────────── */

async function loadFromSupabase(): Promise<RawData> {
  const [users, wastes, points, coupons] = await Promise.all([
    sbSelectAll<{ registered_at: string }>('users', { select: 'registered_at', filters: { order: 'line_user_id.asc' } }),
    sbSelectAll<{ recorded_at: string; weight_kg: number | null; carbon_reduction_kg: number }>('waste_records', {
      select: 'recorded_at,weight_kg,carbon_reduction_kg',
      filters: { status: 'eq.done', order: 'id.asc' },
    }),
    sbSelectAll<{ occurred_at: string; kind: 'earn' | 'spend'; points_delta: number }>('point_transactions', {
      select: 'occurred_at,kind,points_delta',
      filters: { kind: 'in.(earn,spend)', order: 'tx_id.asc' },
    }),
    sbSelectAll<{ reward_name: string; redeemed_at: string }>('coupons', {
      select: 'reward_name,redeemed_at',
      filters: { status: 'neq.cancelled', order: 'coupon_id.asc' },
    }),
  ])
  return {
    userDates: users.map((u) => u.registered_at),
    wastes: wastes.map((w) => ({ at: w.recorded_at, kg: Number(w.weight_kg ?? 0), co2: Number(w.carbon_reduction_kg ?? 0) })),
    points: points.map((p) => ({ at: p.occurred_at, kind: p.kind, delta: Number(p.points_delta) })),
    coupons: coupons.map((c) => ({ name: c.reward_name, at: c.redeemed_at })),
  }
}

/** ข้อมูลตัวอย่าง (ไม่ใช่ข้อมูลจริง) ไล่ย้อนหลัง 24 เดือนจากเดือนปัจจุบัน — ผลคงที่ในแต่ละเดือน */
function buildMock(now: Date): RawData {
  const [cy, cm] = ym(now.toISOString())!
  const iso = (offsetMonths: number, day: number) => {
    const k = key(cy, cm) - offsetMonths
    const y = Math.floor(k / 12)
    const m = (k % 12) + 1
    return `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}T10:00:00+07:00`
  }
  const raw: RawData = { userDates: [], wastes: [], points: [], coupons: [] }
  const names = ['มาม่ารสแซ่บ', 'ผงซักฟอก', 'น้ำตาล', 'ช้างสาร', 'เกลืออร่อย', 'ทูน่ากระป๋อง']
  for (let off = 23; off >= 0; off--) {
    const age = 23 - off // 0 = เก่าสุด
    const newUsers = 8 + Math.round(age * 1.1) + (age % 3) * 3
    for (let i = 0; i < newUsers; i++) raw.userDates.push(iso(off, 1 + ((i * 7) % 27)))
    const records = 22 + age * 3 + (age % 4) * 6
    for (let i = 0; i < records; i++) {
      const kg = 1 + ((i * 13 + age) % 40) / 10
      raw.wastes.push({ at: iso(off, 1 + ((i * 5) % 27)), kg, co2: kg * 0.5 })
      raw.points.push({ at: iso(off, 1 + ((i * 5) % 27)), kind: 'earn', delta: Math.round(kg * 10) })
    }
    const redeemed = 6 + (age % 5) * 3 + Math.round(age / 3)
    for (let i = 0; i < redeemed; i++) {
      raw.coupons.push({ name: names[(i + age) % names.length], at: iso(off, 2 + ((i * 3) % 26)) })
      raw.points.push({ at: iso(off, 2 + ((i * 3) % 26)), kind: 'spend', delta: -(60 + ((i * 17) % 80)) })
    }
  }
  return raw
}

/* ───────────── รวมผล ───────────── */

/** % เปลี่ยนแปลงเทียบเดือนก่อน (null เมื่อเดือนก่อนเป็น 0/ไม่มีข้อมูล) — ปัดทศนิยม 1 ตำแหน่ง */
function pct(cur: number, prev: number): number | null {
  if (!(prev > 0)) return null
  return Math.round(((cur - prev) / prev) * 1000) / 10
}

export function aggregate(raw: RawData, year: number, now: Date): DashboardData {
  const cur = ym(now.toISOString())!
  const curKey = key(cur[0], cur[1])

  const newUsers = new Map<number, number>()
  const weight = new Map<number, number>()
  const co2 = new Map<number, number>()
  const spent = new Map<number, number>()
  const earned = new Map<number, number>()
  const add = (m: Map<number, number>, k: number, v: number) => m.set(k, (m.get(k) ?? 0) + v)

  raw.userDates.forEach((d) => {
    const p = ym(d)
    if (p) add(newUsers, key(p[0], p[1]), 1)
  })
  raw.wastes.forEach((w) => {
    const p = ym(w.at)
    if (!p) return
    add(weight, key(p[0], p[1]), w.kg)
    add(co2, key(p[0], p[1]), w.co2)
  })
  raw.points.forEach((pt) => {
    const p = ym(pt.at)
    if (!p) return
    if (pt.kind === 'spend') add(spent, key(p[0], p[1]), Math.abs(pt.delta))
    else add(earned, key(p[0], p[1]), pt.delta)
  })

  // ปีที่มีข้อมูล: ตั้งแต่ปีแรกสุดที่พบจนถึงปีปัจจุบัน
  const allKeys = [...newUsers.keys(), ...weight.keys(), ...spent.keys(), ...earned.keys()]
  const minYear = allKeys.length ? Math.floor(Math.min(...allKeys) / 12) : cur[0]
  const years: number[] = []
  for (let y = cur[0]; y >= Math.min(minYear, cur[0]); y--) years.push(y)
  const selected = years.includes(year) ? year : cur[0]

  // สะสมตามลำดับเดือน
  const sum = (m: Map<number, number>, upto: number) => {
    let t = 0
    m.forEach((v, k) => {
      if (k <= upto) t += v
    })
    return t
  }

  const months: DashboardMonth[] = []
  for (let m = 1; m <= 12; m++) {
    const k = key(selected, m)
    if (k > curKey) {
      months.push({ month: m, users: null, newUsers: null, weightKg: null, co2CumKg: null })
      continue
    }
    months.push({
      month: m,
      users: sum(newUsers, k),
      newUsers: newUsers.get(k) ?? 0,
      weightKg: round1(weight.get(k) ?? 0),
      co2CumKg: round1(sum(co2, k)),
    })
  }

  const val = (mp: Map<number, number>, k: number) => mp.get(k) ?? 0
  const change: DashboardChange = {
    newUsers: pct(val(newUsers, curKey), val(newUsers, curKey - 1)),
    weightKg: pct(val(weight, curKey), val(weight, curKey - 1)),
    co2Kg: pct(val(co2, curKey), val(co2, curKey - 1)),
    pointsSpent: pct(val(spent, curKey), val(spent, curKey - 1)),
  }

  const byName = new Map<string, number>()
  let redeemedCount = 0
  raw.coupons.forEach((c) => {
    const p = ym(c.at)
    if (!p || p[0] !== selected) return
    redeemedCount++
    byName.set(c.name, (byName.get(c.name) ?? 0) + 1)
  })
  let pointsEarned = 0
  earned.forEach((v, k) => {
    if (Math.floor(k / 12) === selected) pointsEarned += v
  })

  return {
    year: selected,
    years,
    totals: {
      users: raw.userDates.length,
      weightKg: round1(sum(weight, Infinity)),
      co2Kg: round1(sum(co2, Infinity)),
      pointsSpent: Math.round(sum(spent, Infinity)),
    },
    months,
    current: {
      label: `${TH_MONTHS_FULL[cur[1] - 1]} ${cur[0]}`,
      newUsers: val(newUsers, curKey),
      weightKg: round1(val(weight, curKey)),
      co2Kg: round1(val(co2, curKey)),
      pointsSpent: Math.round(val(spent, curKey)),
      change,
    },
    rewards: {
      pointsEarned: Math.round(pointsEarned),
      redeemedCount,
      top: [...byName].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 5),
    },
  }
}

const round1 = (n: number) => Math.round(n * 10) / 10

export async function getDashboard(year: number): Promise<DashboardData> {
  const now = new Date()
  const raw = isSupabaseConfigured() ? await loadFromSupabase() : buildMock(now)
  return aggregate(raw, year, now)
}
