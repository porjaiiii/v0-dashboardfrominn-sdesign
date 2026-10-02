'use client'

import AdminShell from '@/components/dashboard/AdminShell'
import {
  Co2ChartPanel,
  MonthlySummary,
  RewardsPanel,
  TotalsRow,
  UsersChartPanel,
  WasteChartPanel,
} from '@/components/dashboard/DashboardPanels'
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

      <div className="flex flex-col gap-4">
        <TotalsRow />

        <div className="grid gap-4 lg:grid-cols-2">
          <UsersChartPanel />
          <WasteChartPanel />
          <Co2ChartPanel />
          <RewardsPanel />
        </div>

        <MonthlySummary />
      </div>
    </AdminShell>
  )
}
