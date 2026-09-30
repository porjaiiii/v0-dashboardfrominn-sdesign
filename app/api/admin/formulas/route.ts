import { NextRequest } from 'next/server'
import { getFormulas, updateSubtypeActive } from '@/lib/db/admin-queries'
import { handle, listRoute } from '@/lib/db/route-helpers'

export const GET = listRoute(getFormulas)

/** body: { updates: [{ waste_type_id, waste_subtype_id, is_active }] } */
export const PATCH = handle(async (req: NextRequest) => {
  const body = (await req.json().catch(() => null)) as {
    updates?: { waste_type_id: string; waste_subtype_id: string; is_active: boolean }[]
  } | null
  if (!body?.updates || !Array.isArray(body.updates) || body.updates.length > 200) {
    throw new Error('รูปแบบข้อมูลไม่ถูกต้อง')
  }
  for (const u of body.updates) {
    await updateSubtypeActive(String(u.waste_type_id), String(u.waste_subtype_id), Boolean(u.is_active))
  }
  return { ok: true }
})
