import { NextRequest } from 'next/server'
import { getRewardStock, updateRewardStock } from '@/lib/db/admin-queries'
import { handle, listRoute } from '@/lib/db/route-helpers'

export const GET = listRoute(getRewardStock)

/** body: { updates: [{ id: number, stock: number }] } */
export const PATCH = handle(async (req: NextRequest) => {
  const body = (await req.json().catch(() => null)) as { updates?: { id: number; stock: number }[] } | null
  if (!body?.updates || !Array.isArray(body.updates) || body.updates.length > 200) {
    throw new Error('รูปแบบข้อมูลไม่ถูกต้อง')
  }
  for (const u of body.updates) await updateRewardStock(Number(u.id), Number(u.stock))
  return { ok: true }
})
