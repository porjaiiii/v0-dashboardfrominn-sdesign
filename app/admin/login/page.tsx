import { redirect } from 'next/navigation'

/** หน้าเข้าสู่ระบบแอดมินเดิม — รวมกับ /login แล้ว (คงไว้ให้ลิงก์/บุ๊กมาร์กเก่ายังใช้ได้) */
export default async function AdminLoginRedirect({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { next } = await searchParams
  redirect(typeof next === 'string' ? `/login?next=${encodeURIComponent(next)}` : '/login')
}
