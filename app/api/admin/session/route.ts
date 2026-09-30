import { NextRequest, NextResponse } from 'next/server'
import { SESSION_COOKIE, authMode, verifySessionToken } from '@/lib/db/admin-session'

/** ให้หน้าเว็บถามว่าล็อกอินอยู่ไหม: { authenticated, mode } */
export async function GET(req: NextRequest) {
  const mode = authMode()
  const authenticated = mode === 'open' || (mode === 'password' && verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value))
  return NextResponse.json({ authenticated, mode }, { headers: { 'Cache-Control': 'no-store' } })
}
