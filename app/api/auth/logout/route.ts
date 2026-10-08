import { NextRequest } from 'next/server'
import { FOREIGN_ORIGIN_MESSAGE, isSameOrigin, jsonError, ok } from '@/lib/auth/http'
import { clearSessionCookie } from '@/lib/auth/session'

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) return jsonError(FOREIGN_ORIGIN_MESSAGE, 403)
  const res = ok()
  clearSessionCookie(res)
  return res
}
