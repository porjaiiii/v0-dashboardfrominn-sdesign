'use client'

import { ReactNode, useRef, useState } from 'react'
import AdminShell from '@/components/dashboard/AdminShell'
import { Badge, Chevron, PageTitle, STATUS_COLORS, Toggle, solidBtn } from '@/components/dashboard/admin-ui'
import { ADMIN_COLORS } from '@/lib/admin-tokens'
import { fontStyle } from '@/lib/design-tokens'

const LABEL = { color: ADMIN_COLORS.navy, fontSize: 14, fontWeight: 600, margin: '14px 0 6px', ...fontStyle } as const
const HINT = { color: ADMIN_COLORS.cardIcon, fontSize: 12, marginTop: 4, ...fontStyle } as const
const INPUT = {
  width: '100%',
  height: 44,
  padding: '0 16px',
  borderRadius: 8,
  border: `1.5px solid ${ADMIN_COLORS.navy}`,
  color: ADMIN_COLORS.navy,
  fontSize: 15,
  fontWeight: 500,
  outline: 'none',
  backgroundColor: '#ffffff',
  ...fontStyle,
} as const

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section style={{ border: '1px solid #dfe3ee', borderRadius: 8, padding: '18px 14px', marginBottom: 14, ...fontStyle }}>
      <h2 style={{ color: ADMIN_COLORS.navy, fontSize: 18, fontWeight: 600, margin: 0 }}>{title}</h2>
      {children}
    </section>
  )
}

function SelectField({ value, options, onChange }: { value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <div style={{ position: 'relative' }}>
      <select value={value} onChange={(e) => onChange(e.target.value)} style={{ ...INPUT, appearance: 'none', cursor: 'pointer' }}>
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
      <span style={{ position: 'absolute', right: 14, top: 13, pointerEvents: 'none' }}>
        <Chevron />
      </span>
    </div>
  )
}

function ToggleRow({ title, checked, onChange }: { title: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ color: ADMIN_COLORS.navy, fontSize: 13, fontWeight: 600 }}>{title}</div>
      <div className="flex items-center justify-between" style={{ marginTop: 4 }}>
        <span style={{ color: ADMIN_COLORS.navy, fontSize: 15, fontWeight: 600 }}>{checked ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}</span>
        <Toggle label={title} checked={checked} onChange={onChange} />
      </div>
    </div>
  )
}

function UsageBar({ label, value, pct, color, track }: { label: string; value: string; pct: number; color: string; track: string }) {
  return (
    <div style={{ marginTop: 12 }}>
      <div className="flex justify-between" style={{ fontSize: 13, fontWeight: 600 }}>
        <span style={{ color: ADMIN_COLORS.navy }}>{label}</span>
        <span style={{ color }}>{value}</span>
      </div>
      <div style={{ height: 6, borderRadius: 999, backgroundColor: track, marginTop: 6, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', backgroundColor: color, borderRadius: 999 }} />
      </div>
    </div>
  )
}

const BUGS = [
  { no: 1, title: 'หน้าแดชบอร์ดโหลดช้า', status: 'แก้ไขแล้ว', color: '#1e3a9f', date: '12 ม.ค. 2568' },
  { no: 2, title: 'รูปภาพไม่แสดงในรายงาน', status: 'กำลังดำเนินการ', color: STATUS_COLORS.yellow, date: '10 ม.ค. 2568' },
  { no: 3, title: 'คะแนนไม่อัปเดตหลังรับขยะ', status: 'รอตรวจสอบ', color: STATUS_COLORS.red, date: '08 ม.ค. 2568' },
]

const FILES = [
  { name: 'คู่มือการใช้งานระบบ v2.1.pdf', size: '2.4 MB' },
  { name: 'นโยบายความเป็นส่วนตัว.pdf', size: '1.1 MB' },
  { name: 'รายงานสรุปประจำปี 2568.xlsx', size: '856 KB' },
]

function CameraIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 8h3l2-3h6l2 3h3v11H4zM12 17a4 4 0 100-8 4 4 0 000 8z" />
    </svg>
  )
}

export default function SystemInfoPage() {
  const [name, setName] = useState('น้องรักษ์สองตัวบาท')
  const [logo, setLogo] = useState<string | null>(null)
  const [language, setLanguage] = useState('ภาษาไทย (TH)')
  const [timezone, setTimezone] = useState('(UTC+07:00) Bangkok')
  const [rate, setRate] = useState('ตามราคาแต้มต่อประเภทขยะ')
  const [minPoints, setMinPoints] = useState('ตามกำหนดในหน้าสต๊อก')
  const [expireDays, setExpireDays] = useState('365')
  const [line, setLine] = useState(true)
  const [email, setEmail] = useState(false)
  const [savedMsg, setSavedMsg] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const pickLogo = (file?: File) => {
    if (!file) return
    if (logo) URL.revokeObjectURL(logo)
    setLogo(URL.createObjectURL(file))
  }

  const save = () => {
    // TODO: บันทึกลงฐานข้อมูลจริง
    setSavedMsg(true)
    setTimeout(() => setSavedMsg(false), 2000)
  }

  return (
    <AdminShell activeHref="/admin/system-info">
      <PageTitle title="ตั้งค่าระบบ" subtitle="จัดการตั้งค่าระบบทั่วไป" />

      <Section title="ตั้งค่าทั่วไป">
        <div style={LABEL}>ชื่อระบบ</div>
        <input style={INPUT} value={name} onChange={(e) => setName(e.target.value)} />
        <div style={LABEL}>โลโก้</div>
        <div className="flex items-center" style={{ gap: 12 }}>
          <button
            type="button"
            aria-label="อัปโหลดโลโก้"
            onClick={() => fileRef.current?.click()}
            style={{
              width: 64,
              height: 64,
              borderRadius: 8,
              border: '1px solid #c9cfe4',
              backgroundColor: '#f3f5fb',
              cursor: 'pointer',
              fontSize: 26,
              color: ADMIN_COLORS.navy,
              overflow: 'hidden',
              padding: 0,
            }}
          >
            {logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logo} alt="โลโก้" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            ) : (
              '+'
            )}
          </button>
          <button type="button" onClick={() => fileRef.current?.click()} style={{ ...solidBtn, height: 42, backgroundColor: ADMIN_COLORS.cardIcon, borderColor: ADMIN_COLORS.cardIcon }}>
            + เลือกรูปภาพใหม่
          </button>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => pickLogo(e.target.files?.[0])} />
        </div>
        <div style={LABEL}>ภาษาเริ่มต้น</div>
        <SelectField value={language} options={['ภาษาไทย (TH)', 'English (EN)']} onChange={setLanguage} />
        <div style={LABEL}>โซนเวลา</div>
        <SelectField value={timezone} options={['(UTC+07:00) Bangkok', '(UTC+08:00) Singapore', '(UTC+00:00) London']} onChange={setTimezone} />
      </Section>

      <Section title="ตั้งค่าคะแนน">
        <div style={LABEL}>อัตราแลกคะแนนเริ่มต้น</div>
        <input style={INPUT} value={rate} onChange={(e) => setRate(e.target.value)} />
        <div style={HINT}>ทุกๆ 1 บาท ต่อที่คะแนน</div>
        <div style={LABEL}>คะแนนขั้นต่ำในการแลกของรางวัล</div>
        <input style={INPUT} value={minPoints} onChange={(e) => setMinPoints(e.target.value)} />
        <div style={LABEL}>วันหมดอายุคะแนน</div>
        <input style={INPUT} inputMode="numeric" value={expireDays} onChange={(e) => setExpireDays(e.target.value.replace(/\D/g, ''))} />
        <div style={HINT}>วัน</div>
      </Section>

      <Section title="ตั้งค่าการแจ้งเตือน">
        <ToggleRow title="LINE Notification" checked={line} onChange={setLine} />
        <ToggleRow title="แจ้งเตือนผ่านอีเมล" checked={email} onChange={setEmail} />
      </Section>

      <Section title="รายงานปัญหาและบั๊ก">
        <div style={{ border: '1px solid #e2e5ee', borderRadius: 6, overflow: 'hidden', marginTop: 12 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ backgroundColor: '#eef1f9', color: ADMIN_COLORS.navy, height: 34, textAlign: 'left' }}>
                <th style={{ padding: '0 10px', width: 60 }}>ลำดับ</th>
                <th>หัวข้อปัญหา</th>
                <th style={{ width: 160 }}>สถานะ</th>
                <th style={{ width: 120 }}>วันที่รายงาน</th>
              </tr>
            </thead>
            <tbody>
              {BUGS.map((b) => (
                <tr key={b.no} style={{ height: 34, borderTop: '1px solid #e8ebf4', color: ADMIN_COLORS.navy }}>
                  <td style={{ padding: '0 10px' }}>{b.no}</td>
                  <td>{b.title}</td>
                  <td>
                    <Badge color={b.color}>{b.status}</Badge>
                  </td>
                  <td>{b.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button type="button" style={{ ...solidBtn, backgroundColor: ADMIN_COLORS.cardIcon, borderColor: ADMIN_COLORS.cardIcon, marginTop: 12, height: 42 }}>
          + รายงานปัญหาใหม่
        </button>
      </Section>

      <Section title="ข้อมูลการจัดเก็บโดยรวม (Supabase)">
        <UsageBar label="พื้นที่จัดเก็บ Database" value="1.2 GB / 8 GB (15%)" pct={15} color={ADMIN_COLORS.cardIcon} track="#dfe5f7" />
        <UsageBar label="พื้นที่จัดเก็บ Storage" value="3.5 GB / 5 GB (70%)" pct={70} color={STATUS_COLORS.yellow} track="#fbf1cf" />
        <UsageBar label="จำนวน API Requests วันนี้" value="12,450 / 500,000 (2.5%)" pct={2.5} color={ADMIN_COLORS.cardIcon} track="#dfe5f7" />
        <div className="flex justify-between" style={{ marginTop: 14, fontSize: 13, fontWeight: 600, color: ADMIN_COLORS.navy }}>
          <span>จำนวน Users ที่ Active</span>
          <span>1,248 คน</span>
        </div>
      </Section>

      <Section title="คลังรูปภาพขยะในระบบ">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginTop: 14 }}>
          {Array.from({ length: 6 }, (_, i) => (
            <div
              key={i}
              className="flex flex-col items-center justify-center"
              style={{ height: 86, border: '1.5px dashed #555', borderRadius: 4, textAlign: 'center', gap: 4 }}
            >
              <CameraIcon />
              <span style={{ fontSize: 10, fontWeight: 600, color: '#333' }}>ถ่ายรูปขยะ:</span>
              <span style={{ fontSize: 9, color: '#555' }}>(กรุณาถ่ายรูปขยะพร้อมตัวเลขน้ำหนัก)</span>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between" style={{ marginTop: 12 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: ADMIN_COLORS.navy }}>รูปภาพทั้งหมด: 2,456 รูป | ใช้พื้นที่: 1.8 GB</span>
          <button type="button" style={{ ...solidBtn, backgroundColor: ADMIN_COLORS.cardIcon, borderColor: ADMIN_COLORS.cardIcon, height: 42 }}>
            จัดการคลังรูปภาพ
          </button>
        </div>
      </Section>

      <Section title="เอกสารและไฟล์เพิ่มเติม">
        <div className="flex flex-col" style={{ gap: 10, marginTop: 12 }}>
          {FILES.map((f) => (
            <div
              key={f.name}
              className="flex items-center justify-between"
              style={{ height: 52, padding: '0 10px', borderRadius: 6, backgroundColor: '#eef4ff', border: '1px solid #dbe4f7' }}
            >
              <div className="flex items-center" style={{ gap: 10 }}>
                <span aria-hidden style={{ width: 28, height: 28, borderRadius: 6, backgroundColor: '#dfe8fb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  📄
                </span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: ADMIN_COLORS.navy }}>{f.name}</div>
                  <div style={{ fontSize: 11, color: '#555' }}>{f.size}</div>
                </div>
              </div>
              <button type="button" style={{ ...solidBtn, backgroundColor: ADMIN_COLORS.cardIcon, borderColor: ADMIN_COLORS.cardIcon, height: 34, fontSize: 13, padding: '0 14px' }}>
                ดาวน์โหลด
              </button>
            </div>
          ))}
        </div>
        <button type="button" style={{ ...solidBtn, backgroundColor: ADMIN_COLORS.cardIcon, borderColor: ADMIN_COLORS.cardIcon, marginTop: 12, height: 42 }}>
          + อัปโหลดเอกสารใหม่
        </button>
      </Section>

      <div className="flex items-center justify-end" style={{ gap: 14 }}>
        {savedMsg && <span style={{ color: '#154212', fontWeight: 600, ...fontStyle }}>บันทึกแล้ว</span>}
        <button type="button" onClick={save} style={{ ...solidBtn, height: 46, padding: '0 26px', fontSize: 16 }}>
          บันทึกการตั้งค่า
        </button>
      </div>
    </AdminShell>
  )
}
