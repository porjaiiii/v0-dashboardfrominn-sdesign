import { getUsers } from '@/lib/db/admin-queries'
import { listRoute } from '@/lib/db/route-helpers'

export const GET = listRoute(getUsers)
