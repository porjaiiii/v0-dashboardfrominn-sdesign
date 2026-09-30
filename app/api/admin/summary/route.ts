import { getSummary } from '@/lib/db/admin-queries'
import { handle } from '@/lib/db/route-helpers'

export const GET = handle(() => getSummary())
