import { NextRequest, NextResponse } from 'next/server'
import { NO_STORE, requireAccount } from '@/lib/auth/http'

/** ให้หน้าเว็บถามว่าใครล็อกอินอยู่: { account } หรือ 401 */
export async function GET(req: NextRequest) {
  const result = await requireAccount(req, 'signed-in')
  return 'denied' in result ? result.denied : NextResponse.json({ account: result.account }, { headers: NO_STORE })
}
