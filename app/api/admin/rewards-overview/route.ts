import { getRewardsOverview } from '@/lib/db/admin-queries'
import { handle } from '@/lib/db/route-helpers'

export const GET = handle(async (req) => {
  const now = new Date()
  const fallback = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  return getRewardsOverview(req.nextUrl.searchParams.get('period') || fallback)
})
