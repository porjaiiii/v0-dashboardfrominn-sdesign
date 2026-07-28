'use client'

import { TOP_CONTRIBUTORS, type Contributor } from '@/lib/map-data'

const fontStyle = {
  fontFamily: 'var(--font-ibm-plex-sans-thai), IBM Plex Sans Thai, sans-serif',
}

const BADGE_STYLES: Record<Contributor['badge'], { bg: string; border: string; rankColor: string; barColor: string }> = {
  gold:    { bg: '#fffbea', border: '#f0c040', rankColor: '#c8960c', barColor: '#d4a017' },
  silver:  { bg: '#f5f5f5', border: '#b0b8c0', rankColor: '#7a8898', barColor: '#8898a8' },
  bronze:  { bg: '#fff5ec', border: '#d49060', rankColor: '#a05820', barColor: '#b07040' },
  regular: { bg: '#f4f9f2', border: '#b8d8b2', rankColor: '#2d7a1f', barColor: '#2d7a1f' },
}

/* SVG medal icon — shown for top-3 ranks */
function MedalIcon({ rank }: { rank: number }) {
  const colors: Record<number, { ring: string; fill: string; text: string }> = {
    1: { ring: '#c8960c', fill: '#f0c040', text: '#7a5000' },
    2: { ring: '#7a8898', fill: '#b0b8c0', text: '#3a4a56' },
    3: { ring: '#a05820', fill: '#d49060', text: '#5a2800' },
  }
  const c = colors[rank]
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <circle cx="14" cy="14" r="13" fill={c.fill} stroke={c.ring} strokeWidth="1.5" />
      <text x="14" y="19" textAnchor="middle" fontSize="13" fontWeight="700" fill={c.text}>
        {rank}
      </text>
    </svg>
  )
}

/* SVG flame icon for streak */
function FlameIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#e05c00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" title="ส่งต่อเนื่อง">
      <path d="M12 2C9 7 6 9 6 13a6 6 0 0 0 12 0c0-5-3-7-6-11z" />
      <path d="M12 22c-2.2 0-4-1.8-4-4 0-2.5 2-4 4-6 2 2 4 3.5 4 6a4 4 0 0 1-4 4z" fill="#ff8c00" stroke="none" />
    </svg>
  )
}

/** แสดงชื่อบางส่วน เช่น "สมชาย ร***" */
function maskName(name: string): string {
  const parts = name.trim().split(' ')
  return parts
    .map((part, i) => {
      if (i === 0) {
        // ชื่อ: แสดง 1 ตัวอักษร + ***
        return part.charAt(0) + '***'
      }
      // นามสกุล: แสดง 1 ตัวอักษร + ***
      return part.charAt(0) + '***'
    })
    .join(' ')
}

interface TopContributorsProps {
  tambon: string
}

export default function TopContributors({ tambon }: TopContributorsProps) {
  const contributors = TOP_CONTRIBUTORS[tambon] || []
  const max = contributors[0]?.totalKg || 1

  return (
    <div
      style={{
        border: '2px solid rgba(0,0,0,0.12)',
        borderRadius: 12,
        padding: '16px 20px',
        backgroundColor: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      <div className="flex items-center justify-between" style={{ marginBottom: 2 }}>
        <h3 style={{ color: '#154212', fontSize: 16, fontWeight: 700, margin: 0, ...fontStyle }}>
          ผู้ส่งขยะสูงสุดประจำตำบล
        </h3>
        <span
          style={{
            fontSize: 11,
            color: '#666',
            backgroundColor: '#f0f7ee',
            border: '1px solid #b8d8b2',
            borderRadius: 20,
            padding: '2px 10px',
            ...fontStyle,
          }}
        >
          ประจำปี 2569
        </span>
      </div>

      {contributors.map((c) => {
        const style = BADGE_STYLES[c.badge]
        const pct = Math.round((c.totalKg / max) * 100)
        return (
          <div
            key={c.rank}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '8px 12px',
              borderRadius: 10,
              backgroundColor: style.bg,
              border: `1.5px solid ${style.border}`,
            }}
          >
            {/* Avatar initial */}
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                backgroundColor: c.badge === 'regular' ? '#c5e0c0' : style.border,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: 16,
                color: style.rankColor,
                flexShrink: 0,
                ...fontStyle,
              }}
            >
              {c.avatar}
            </div>

            {/* Name + progress bar */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="flex items-center justify-between" style={{ marginBottom: 3 }}>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#154212',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: 130,
                    ...fontStyle,
                  }}
                >
                  {maskName(c.name)}
                </span>
                <div className="flex items-center" style={{ gap: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: style.rankColor, ...fontStyle }}>
                    {c.totalKg} KG
                  </span>
                  {c.streak >= 5 && <FlameIcon />}
                </div>
              </div>
              <div style={{ height: 5, backgroundColor: 'rgba(0,0,0,0.08)', borderRadius: 3, overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${pct}%`,
                    backgroundColor: style.barColor,
                    borderRadius: 3,
                    transition: 'width 0.4s ease',
                  }}
                />
              </div>
              <span style={{ fontSize: 10, color: '#888', ...fontStyle }}>
                ส่งต่อเนื่อง {c.streak} เดือน
              </span>
            </div>

            {/* Rank badge — medal SVG for top 3, plain number for rest */}
            <div style={{ flexShrink: 0 }}>
              {c.badge !== 'regular' ? (
                <MedalIcon rank={c.rank} />
              ) : (
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    backgroundColor: style.border,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: 13,
                    color: style.rankColor,
                    ...fontStyle,
                  }}
                >
                  #{c.rank}
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
