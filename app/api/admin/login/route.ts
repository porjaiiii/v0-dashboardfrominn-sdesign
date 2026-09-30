import { NextRequest, NextResponse } from 'next/server'
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  authMode,
  checkPassword,
  createSessionToken,
} from '@/lib/db/admin-session'

export async function POST(req: NextRequest) {
  if (authMode() !== 'password') {
    return NextResponse.json({ error: 'ยังไม่ได้ตั้งค่า ADMIN_PASSWORD บนเซิร์ฟเวอร์' }, { status: 501 })
  }
  const body = (await req.json().catch(() => null)) as { password?: unknown } | null
  const password = typeof body?.password === 'string' ? body.password : ''

  if (!checkPassword(password)) {
    // หน่วงเวลาให้การเดารหัสช้าลง
    await new Promise((r) => setTimeout(r, 800))
    return NextResponse.json({ error: 'รหัสผ่านไม่ถูกต้อง' }, { status: 401 })
  }

  const res = NextResponse.json({ ok: true })
  res.cookies.set(SESSION_COOKIE, createSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
  })
  return res
}
