import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import SiteNav from '@/components/landing/SiteNav'
import { CtaBanner, SiteFooter } from '@/components/landing/sections'
import { DEEP } from '@/components/landing/shared'
import { ADDRESS_LINES, COMPANY, EMAIL, OPENING_HOURS, PHONE } from '@/lib/site'

export const metadata: Metadata = { title: 'ติดต่อเรา - Digital Waste' }

const svg = {
  width: 22,
  height: 22,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
}

function Icon({ children }: { children: ReactNode }) {
  return (
    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#8cc63f] text-white">
      {children}
    </span>
  )
}

function InfoCard({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="rounded-3xl bg-[#f1fde3] p-6">
      <Icon>{icon}</Icon>
      <div className="mt-5 text-lg" style={{ color: DEEP }}>{label}</div>
      <div className="mt-2 text-xl font-semibold leading-8 md:text-2xl" style={{ color: DEEP }}>{children}</div>
    </div>
  )
}

export default function ContactPage() {
  return (
    <div className="min-h-screen overflow-x-clip bg-white text-[#1c2a1a]">
      <SiteNav active="contact" />

      <main className="px-4 py-10 md:px-12">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-center text-4xl font-bold md:text-6xl" style={{ color: DEEP }}>ติดต่อเรา</h1>

          <div className="mt-8 grid gap-5 md:grid-cols-3">
            <InfoCard
              label="เบอร์ติดต่อ"
              icon={<svg {...svg}><path d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z" /></svg>}
            >
              <a href={`tel:${PHONE.replace(/\s/g, '')}`}>{PHONE}</a>
            </InfoCard>
            <InfoCard
              label="Email"
              icon={<svg {...svg}><path d="M12 20c4.4 0 8-3.1 8-7s-3.6-7-8-7-8 3.1-8 7c0 1.8.8 3.4 2 4.6V21l3.5-1.6c.8.4 1.6.6 2.5.6z" /></svg>}
            >
              <a href={`mailto:${EMAIL}`} className="break-all">{EMAIL}</a>
            </InfoCard>
            <InfoCard
              label="เวลาทำการ"
              icon={<svg {...svg}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>}
            >
              <span className="text-lg md:text-xl">{OPENING_HOURS}</span>
            </InfoCard>
          </div>

          <div className="mt-5 rounded-3xl bg-[#f1fde3] p-6">
            <Icon>
              <svg {...svg}><path d="M12 21s7-6.2 7-11a7 7 0 10-14 0c0 4.8 7 11 7 11z" /><circle cx="12" cy="10" r="2.5" /></svg>
            </Icon>
            <div className="mt-5 text-lg" style={{ color: DEEP }}>ที่อยู่</div>
            <div className="mt-2 text-2xl font-bold md:text-3xl" style={{ color: DEEP }}>{COMPANY}</div>
            <div className="mt-2 text-lg leading-8 md:text-2xl" style={{ color: DEEP }}>{ADDRESS_LINES.join(' ')}</div>
          </div>
        </div>
      </main>

      <CtaBanner />
      <SiteFooter />
    </div>
  )
}
