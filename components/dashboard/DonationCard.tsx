'use client'

import type { JSX } from 'react'
import { DONATIONS, type Donation } from '@/lib/map-data'

const fontStyle = {
  fontFamily: 'var(--font-ibm-plex-sans-thai), IBM Plex Sans Thai, sans-serif',
}

const TYPE_COLORS: Record<Donation['type'], { bg: string; text: string; border: string }> = {
  วัด: { bg: '#fef9ec', text: '#a07010', border: '#f0d060' },
  โรงเรียน: { bg: '#eef5ff', text: '#2a60a8', border: '#90b8e8' },
  ชุมชน: { bg: '#f0faf0', text: '#1d6b1d', border: '#80c880' },
}

/* Inline SVG icons per place type — no emoji */
const TYPE_ICONS: Record<Donation['type'], JSX.Element> = {
  วัด: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l2 4h4l-3 3 1 4-4-2-4 2 1-4-3-3h4z" />
      <rect x="6" y="14" width="12" height="8" rx="1" />
      <line x1="12" y1="14" x2="12" y2="22" />
    </svg>
  ),
  โรงเรียน: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="10" width="18" height="12" rx="1" />
      <path d="M12 2l9 8H3l9-8z" />
      <rect x="9" y="15" width="6" height="7" />
    </svg>
  ),
  ชุมชน: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 22V10l5-6h8l5 6v12" />
      <rect x="9" y="15" width="6" height="7" />
      <path d="M3 10h18" />
    </svg>
  ),
}

interface DonationCardProps {
  tambon: string
}

export default function DonationCard({ tambon }: DonationCardProps) {
  const donations = DONATIONS[tambon] || []
  const total = donations.reduce((sum, d) => sum + d.amount, 0)
  const totalDonors = donations.reduce((sum, d) => sum + d.donors, 0)

  return (
    <div
      style={{
        border: '2px solid rgba(0,0,0,0.12)',
        borderRadius: 12,
        padding: '16px 20px',
        backgroundColor: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        ...fontStyle,
      }}
    >
      <div className="flex items-center justify-between">
        <h3 style={{ color: '#154212', fontSize: 16, fontWeight: 700, margin: 0, ...fontStyle }}>
          ยอดเงินบริจาค
        </h3>
        <div
          style={{
            backgroundColor: '#154212',
            borderRadius: 8,
            padding: '3px 10px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
          }}
        >
          <span style={{ color: '#ffffff', fontSize: 13, fontWeight: 700, ...fontStyle, lineHeight: 1.3 }}>
            {total.toLocaleString()} ฿
          </span>
          <span style={{ color: '#9ed992', fontSize: 10, ...fontStyle, lineHeight: 1.2 }}>
            {totalDonors} ผู้บริจาค
          </span>
        </div>
      </div>

      <div className="flex flex-col" style={{ gap: 8 }}>
        {donations.map((d, i) => {
          const style = TYPE_COLORS[d.type]
          const maxAmount = Math.max(...donations.map((x) => x.amount))
          const pct = Math.round((d.amount / maxAmount) * 100)
          return (
            <div
              key={i}
              style={{
                border: `1.5px solid ${style.border}`,
                borderRadius: 10,
                padding: '8px 12px',
                backgroundColor: style.bg,
              }}
            >
              <div className="flex items-center justify-between" style={{ marginBottom: 5 }}>
                <div className="flex items-center" style={{ gap: 6 }}>
                  <span style={{ color: style.text, display: 'flex', alignItems: 'center' }}>{TYPE_ICONS[d.type]}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: style.text, ...fontStyle }}>
                    {d.place}
                  </span>
                </div>
                <div className="flex flex-col items-end">
                  <span style={{ fontSize: 14, fontWeight: 700, color: style.text, ...fontStyle }}>
                    {d.amount.toLocaleString()} ฿
                  </span>
                  <span style={{ fontSize: 10, color: '#888', ...fontStyle }}>
                    {d.donors} คน
                  </span>
                </div>
              </div>
              {/* Progress bar */}
              <div style={{ height: 5, backgroundColor: 'rgba(0,0,0,0.08)', borderRadius: 3, overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${pct}%`,
                    backgroundColor: style.text,
                    borderRadius: 3,
                    transition: 'width 0.4s ease',
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
