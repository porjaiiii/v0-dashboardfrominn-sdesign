'use client'

import AdminShell from '@/components/dashboard/AdminShell'
import AdminStatCards from '@/components/dashboard/AdminStatCards'
import { fontStyle } from '@/lib/design-tokens'
import { ADMIN_COLORS } from '@/lib/admin-tokens'

export default function AdminDashboardPage() {
  return (
    <AdminShell activeHref="/admin/dashboard">
      <h1
        style={{
          color: ADMIN_COLORS.navy,
          fontSize: 24,
          fontWeight: 600,
          lineHeight: '32px',
          margin: '14px 0 16px',
          ...fontStyle,
        }}
      >
        Dashboard
      </h1>
      <AdminStatCards />
    </AdminShell>
  )
}
