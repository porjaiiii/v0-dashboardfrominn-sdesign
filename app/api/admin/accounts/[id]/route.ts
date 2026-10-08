import { NextResponse } from 'next/server'
import { getAccountById, updateAccounts } from '@/lib/auth/accounts'
import { adminActionRoute, field, jsonError, NO_STORE, ok, readBody } from '@/lib/auth/http'
import { sendDecisionEmail } from '@/lib/auth/mailers'
import { planAccountAction, protectedRefusal, STALE_MESSAGE } from '@/lib/auth/policy'
import { deleteAuthUser } from '@/lib/auth/supabase-auth'

type Ctx = { params: Promise<{ id: string }> }

const NOT_FOUND = 'ไม่พบบัญชีนี้ (อาจถูกลบไปแล้ว)'

/** อนุมัติ/ปฏิเสธ/เปลี่ยนบทบาท/ปิด/เปิดใช้งาน — บัญชี root และบัญชีของตัวเองแก้ไม่ได้ */
export const PATCH = adminActionRoute<Ctx>(async (req, actor, { params }) => {
  const target = await getAccountById((await params).id)
  if (!target) return jsonError(NOT_FOUND, 404)

  const body = await readBody(req)
  const plan = planAccountAction(actor.id, target, field(body, 'action'), body.role)
  if (!plan.ok) return jsonError(plan.error, plan.status)

  // อัปเดตแบบมีเงื่อนไข: ถ้าแอดมินอีกคนเปลี่ยนสถานะไปก่อน จะได้ 409 แทนการเขียนทับ
  const [updated] = await updateAccounts(
    { id: `eq.${target.id}`, status: `eq.${plan.expectStatus}`, is_root: 'is.false' },
    plan.patch,
  )
  if (!updated) return jsonError(STALE_MESSAGE, 409)

  const emailSent = plan.notify ? await sendDecisionEmail(updated, plan.notify) : undefined
  return NextResponse.json({ account: updated, emailSent }, { headers: NO_STORE })
})

export const DELETE = adminActionRoute<Ctx>(async (_req, actor, { params }) => {
  const target = await getAccountById((await params).id)
  if (!target) return jsonError(NOT_FOUND, 404)
  const refusal = protectedRefusal(actor.id, target)
  if (refusal) return jsonError(refusal.error, refusal.status)

  // ลบผู้ใช้ใน Supabase Auth → แถวใน dashboard.accounts ถูกลบตาม (on delete cascade)
  await deleteAuthUser(target.id)
  return ok()
})
