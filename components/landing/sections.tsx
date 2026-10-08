import Image from 'next/image'
import Link from 'next/link'
import { ADDRESS_LINES, COMPANY, HOWTO_VIDEO_EMBED_URL, LINE_OA_URL, PHONE } from '@/lib/site'
import type { ReactNode } from 'react'
import { DEEP, FOREST, LIME, Leaf, MID, RecycleBadge, photo } from './shared'
import BangKachaoMap from '@/components/dashboard/BangKachaoMap'
import MascotBin from './MascotBin'

/** ส่วนที่ใช้ซ้ำหลายหน้า: น้องรักษ์คือใคร / LINE OA / วิดีโอ / แบนเนอร์ชวน / ท้ายหน้า */

/* ───────── น้องรักษ์คือใคร: ข้อความ + 4 ขั้นตอนของระบบ ───────── */

function PhoneArt() {
  return (
    <svg viewBox="0 0 120 200" className="h-full w-auto" role="img" aria-label="LINE บนโทรศัพท์">
      <rect x="6" y="4" width="108" height="192" rx="14" fill="#fff" stroke="#16231a" strokeWidth="5" />
      <rect x="28" y="78" width="64" height="64" rx="16" fill="#06c755" />
      <path d="M60 90c-14 0-24 8.5-24 19 0 8 6 14.700 14 17.300-.5 2-1.500 5.500-1.700 6.300 0 0 0 1 .8.700.8-.2 9-5.800 13-8.500 8.500-.2 17.900-7.800 17.900-15.800 0-10.500-10-19-24-19z" fill="#fff" />
      <text x="60" y="113" textAnchor="middle" fontSize="11" fontWeight="700" fill="#06c755" fontFamily="sans-serif">LINE</text>
    </svg>
  )
}

function LaptopArt() {
  return (
    <svg viewBox="0 0 230 160" className="h-full w-auto" role="img" aria-label="Dashboard บนแล็ปท็อป">
      <rect x="22" y="6" width="186" height="120" rx="10" fill="#fff" stroke="#16231a" strokeWidth="5" />
      <rect x="40" y="20" width="62" height="14" rx="3" fill="#6f9e6e" />
      <rect x="110" y="20" width="62" height="14" rx="3" fill="#6f9e6e" />
      <g stroke="#cfe0cd" strokeWidth="1">
        <path d="M40 52h150M40 70h150M40 88h150M40 106h150" />
        <path d="M60 46v66M90 46v66M120 46v66M150 46v66M180 46v66" />
      </g>
      <path d="M42 108C56 82 66 76 78 90s22-30 36-22 18 24 32 6 24-30 42-38" fill="none" stroke="#154212" strokeWidth="2.2" strokeLinecap="round" />
      <rect x="8" y="126" width="214" height="14" rx="7" fill="#16231a" />
    </svg>
  )
}

function GlobeArt() {
  return (
    <svg viewBox="0 0 190 190" className="h-full w-auto" role="img" aria-label="โลก">
      <defs>
        <clipPath id="globe-clip"><circle cx="95" cy="95" r="92" /></clipPath>
      </defs>
      <circle cx="95" cy="95" r="92" fill="#3f9b3a" />
      <g clipPath="url(#globe-clip)" fill="#7fd070" opacity="0.85">
        <path d="M10 60c30-30 70-20 85 5s-20 40-50 35-45 25-60 5z" />
        <path d="M110 20c40-10 75 10 70 50s-45 20-60 50-30 10-30-30 0-60 20-70z" fill="#a6e28f" />
        <path d="M40 150c30-25 70-20 100 0s10 40-30 42-90 0-70-42z" />
      </g>
    </svg>
  )
}

/** ขนาดทั้งหมดของส่วนนี้อิงความกว้างกล่อง (cqw) เพื่อให้สัดส่วนตรงกับแบบทุกขนาดจอ — min = ขนาดอ่านได้บนมือถือ */
const cq = (min: number, vw: number, max: number) => `clamp(${min}px, ${vw}cqw, ${max}px)`

function StepBadge() {
  return (
    <span
      className="absolute left-[4.5%] top-[6%] flex items-center justify-center rounded-full"
      style={{ width: cq(40, 3.7, 70), height: cq(40, 3.7, 70), backgroundColor: '#7cc93a' }}
    >
      <Image src="/landing/recycle-icon.png" alt="" aria-hidden width={48} height={48} style={{ width: '55%', height: 'auto' }} />
    </span>
  )
}

function GlobeWithLeaves() {
  return (
    <div className="relative h-full">
      <GlobeArt />
      <Image src="/landing/shapes/leaf.png" alt="" aria-hidden width={398} height={160} className="absolute -right-[22%] top-[2%] w-[34%] -rotate-[75deg]" />
      <Image src="/landing/shapes/leaf.png" alt="" aria-hidden width={398} height={160} className="absolute -left-[26%] bottom-[10%] w-[34%] rotate-[25deg]" />
      <Image src="/landing/shapes/leaf.png" alt="" aria-hidden width={398} height={160} className="absolute -right-[20%] bottom-[8%] w-[30%] -rotate-[20deg]" />
    </div>
  )
}

const ABOUT_STEPS: { title: string; text: string; art: ReactNode; artH: string }[] = [
  { title: 'บันทึกข้อมูลขยะ', text: 'ให้คนในพื้นที่บันทึกขยะผ่าน LINE', art: <PhoneArt />, artH: cq(130, 10.7, 210) },
  {
    title: 'จัดการการรับขยะ',
    text: 'ข้อมูลจากการดำเนินงานถูกรวบรวมไว้ในระบบเดียว',
    art: <Image src="/landing/bin.webp" alt="" aria-hidden width={1895} height={1690} style={{ height: '100%', width: 'auto' }} />,
    artH: cq(120, 10.5, 200),
  },
  { title: 'ติดตามข้อมูล', text: 'ติดตามปริมาณขยะและข้อมูลการดำเนินงานผ่าน Dashboard', art: <LaptopArt />, artH: cq(110, 9.4, 180) },
  { title: 'ติดตามผลลัพธ์', text: 'ติดตามปริมาณขยะที่รวบรวมและผลลัพธ์ด้านสิ่งแวดล้อม', art: <GlobeWithLeaves />, artH: cq(110, 10, 190) },
]

function StepArrow() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke={DEEP}
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className="mx-auto rotate-90 md:rotate-0"
      style={{ width: cq(28, 2.4, 46), height: cq(28, 2.4, 46) }}
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  )
}

export function AboutSection() {
  return (
    <section id="about" className="relative overflow-hidden" style={{ backgroundColor: LIME }}>
      <Leaf className="-right-10 -top-4 h-24 w-64 md:h-32 md:w-80" />
      <Leaf className="right-[46%] top-[34%] hidden h-14 w-36 -rotate-12 md:block" />
      <Leaf className="-right-8 top-[66%] hidden h-24 w-24 rotate-[100deg] md:block" />

      {/* กล่องนี้เป็น container: ขนาดฟอนต์/การ์ดด้านในใช้หน่วย cqw ตามความกว้างกล่อง */}
      <div className="relative mx-auto w-full max-w-[1760px] px-[3%] py-8 md:py-[2.6cqw]" style={{ containerType: 'inline-size' }}>
        <div className="relative md:min-h-[27cqw]">
          <div className="flex items-center gap-4 md:gap-[3.2cqw]">
            <div className="shrink-0" style={{ padding: `0 ${cq(30, 2, 40)}` }}>
              <MascotBin size={cq(110, 12.5, 230)} />
            </div>
            <div className="md:max-w-[36cqw]">
              <h2 className="font-bold" style={{ color: DEEP, fontSize: cq(28, 3, 58) }}>น้องรักษ์คือใคร?</h2>
              <p className="mt-3 md:mt-[1.6cqw]" style={{ color: MID, fontSize: cq(14, 1.6, 30), lineHeight: 2.1 }}>
                น้องรักษ์ คือแพลตฟอร์มดิจิทัลที่ช่วยให้ทีมจัดการขยะในพื้นที่บันทึก จัดเก็บ และติดตามข้อมูลขยะได้อย่างเป็นระบบ
              </p>
            </div>
          </div>

          {/* ภาพอุปกรณ์ (แท็บเล็ต + โทรศัพท์) เป็นพื้นหลังด้านขวาของหัวข้อ */}
          <Image
            src="/landing/about-devices.png"
            alt="ตัวอย่างหน้าจอ Dashboard และ LINE น้องรักษ์"
            width={1181}
            height={680}
            className="mt-6 h-auto w-full md:pointer-events-none md:absolute md:right-0 md:top-1/2 md:mt-0 md:w-[45cqw] md:-translate-y-1/2"
          />
        </div>

        <ol className="mt-8 grid items-stretch gap-3 md:mt-[2.4cqw] md:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr] md:gap-[0.5cqw]">
          {ABOUT_STEPS.flatMap((st, i) => {
            const card = (
              <li key={st.title} className="overflow-hidden bg-white/80" style={{ borderRadius: cq(24, 2.1, 40) }}>
                <div className="relative flex items-center justify-center bg-gradient-to-b from-white/30 to-white/60 md:pl-[14%]" style={{ height: cq(170, 14.1, 265) }}>
                  <StepBadge />
                  <div style={{ height: st.artH }}>{st.art}</div>
                </div>
                <div style={{ padding: `${cq(14, 1.6, 30)} ${cq(18, 1.7, 32)} ${cq(20, 2.2, 40)}` }}>
                  <h3 className="font-bold" style={{ color: DEEP, fontSize: cq(20, 2.1, 40) }}>{st.title}</h3>
                  <p className="mt-2" style={{ color: DEEP, fontSize: cq(14, 1.6, 30), lineHeight: 1.75 }}>{st.text}</p>
                </div>
              </li>
            )
            return i < ABOUT_STEPS.length - 1
              ? [card, <li key={`a${i}`} aria-hidden className="flex list-none items-center justify-center"><StepArrow /></li>]
              : [card]
          })}
        </ol>
      </div>
    </section>
  )
}

/* ───────── ชุมชนต้นแบบ คุ้งบางกะเจ้า (แบนเนอร์ใต้การ์ดขั้นตอน) ───────── */

const TAMBON = ['บางกะเจ้า', 'บางยอ', 'บางกอบัว', 'บางน้ำผึ้ง', 'บางกระสอบ', 'ทรงคนอง']

export function CommunityBanner() {
  return (
    <section id="community" className="px-[3%] pb-8 pt-1 md:pb-12" style={{ backgroundColor: LIME }}>
      <div className="mx-auto max-w-[1760px]">
        {/* จอกว้าง: ใช้ภาพแบนเนอร์ (ข้อความอยู่ในรูป) */}
        <Image
          src="/landing/community-banner.webp"
          alt={`ชุมชนต้นแบบของน้องรักษ์ คุ้งบางกะเจ้า — น้องรักษ์เริ่มต้นจากการนำแนวคิดการจัดการขยะมาประยุกต์ใช้กับชุมชนคุ้งบางกะเจ้า เพื่อสร้างระบบที่เชื่อมโยงคนในชุมชน เจ้าหน้าที่ และการจัดการขยะเข้าด้วยกัน 6 ตำบลคุ้งบางกะเจ้า: ${TAMBON.join(', ')}`}
          width={2000}
          height={521}
          className="hidden h-auto w-full md:block"
        />

        {/* จอเล็ก: ภาพแบนเนอร์อ่านไม่ออก จึงแสดงเป็นข้อความ + แผนที่แทน */}
        <div className="overflow-hidden rounded-2xl bg-[#2f7d32] p-5 text-white md:hidden">
          <div className="text-base font-semibold text-[#d6f5b0]">ชุมชนต้นแบบของน้องรักษ์</div>
          <h2 className="text-4xl font-bold">คุ้งบางกะเจ้า</h2>
          <p className="mt-3 text-[14px] leading-7">
            น้องรักษ์เริ่มต้นจากการนำแนวคิดการจัดการขยะมาประยุกต์ใช้กับชุมชนคุ้งบางกะเจ้า เพื่อสร้างระบบที่เชื่อมโยงคนในชุมชน
            เจ้าหน้าที่ และการจัดการขยะเข้าด้วยกัน
          </p>
          <div className="mt-4 flex items-center gap-4 rounded-xl bg-white p-4 text-[#154212]">
            <div className="w-[48%] shrink-0 [&_svg]:h-auto [&_svg]:w-full">
              <BangKachaoMap selectedDistrict="ทุกตำบล" />
            </div>
            <div>
              <div className="font-bold">6 ตำบลคุ้งบางกะเจ้า</div>
              <ul className="mt-2 list-disc pl-5 text-[13px] leading-6">
                {TAMBON.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

const LINE_STEPS = [
  { title: 'บันทึกขยะ', text: 'บันทึกขยะรีไซเคิลของคุณ' },
  { title: 'สะสมคะแนน', text: 'เปลี่ยนการรีไซเคิลเป็นคะแนน' },
  { title: 'แลกรางวัล', text: 'ใช้คะแนนแลกรางวัลและสิทธิประโยชน์' },
]

export function LineSection() {
  const qr = (
    <>
      <span className="block h-[124px] w-[124px] rounded bg-white" style={photo('line-qr.png', 'linear-gradient(135deg,#fff,#eee)')} role="img" aria-label="QR Code LINE Official Account" />
      <span className="text-xs font-semibold" style={{ color: DEEP }}>สแกนเพื่อเริ่มใช้งาน</span>
    </>
  )
  const qrClass = 'flex w-[150px] flex-col items-center gap-2 rounded-xl p-3 text-center'
  return (
    <section className="px-4 py-8 md:px-16">
      <div className="mx-auto grid max-w-5xl items-center gap-6 md:grid-cols-[1.3fr_1fr]">
        <div>
          <div className="text-xl" style={{ color: DEEP }}>เริ่มต้นง่าย ๆ ผ่าน</div>
          <h2 className="text-3xl font-bold" style={{ color: DEEP }}>LINE Official Account</h2>
          <div className="mt-4 flex flex-wrap items-start gap-5">
            {LINE_OA_URL ? (
              <a href={LINE_OA_URL} target="_blank" rel="noopener noreferrer" className={qrClass} style={{ backgroundColor: LIME }}>
                {qr}
              </a>
            ) : (
              <div className={qrClass} style={{ backgroundColor: LIME }}>{qr}</div>
            )}
            <ul className="flex min-w-[220px] flex-1 flex-col gap-3">
              {LINE_STEPS.map((s) => (
                <li key={s.title} className="flex items-start gap-3">
                  <RecycleBadge color="#7cc93a" />
                  <div>
                    <div className="text-lg font-bold" style={{ color: DEEP }}>{s.title}</div>
                    <div className="text-[13px] text-[#2f7d32]">{s.text}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="relative mx-auto h-[300px] w-full max-w-[280px]">
          <div className="absolute -right-6 bottom-0 h-[220px] w-[220px] rounded-full" style={{ backgroundColor: LIME }} />
          <div className="relative h-full w-full rounded-[28px]" style={photo('phone.png', 'transparent')} role="img" aria-label="ตัวอย่างหน้าจอ LINE น้องรักษ์" />
        </div>
      </div>
    </section>
  )
}

/** วิดีโอวิธีใช้งาน — ถ้ายังไม่ตั้ง HOWTO_VIDEO_EMBED_URL จะแสดงกรอบ "เร็ว ๆ นี้" */
export function VideoSection() {
  return (
    <section className="px-4 pb-10 md:px-16">
      <div className="mx-auto max-w-5xl">
        <h2 className="text-center text-3xl font-bold md:text-5xl" style={{ color: DEEP }}>วิธีใช้งาน</h2>
        <div className="mt-4 aspect-video overflow-hidden rounded-2xl bg-[#0e2a10]">
          {HOWTO_VIDEO_EMBED_URL ? (
            <iframe
              src={HOWTO_VIDEO_EMBED_URL}
              title="วิดีโอวิธีใช้งานน้องรักษ์"
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              loading="lazy"
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-white/80">
              <svg width="56" height="56" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M8 5v14l11-7z" /></svg>
              <span className="text-sm font-semibold">วิดีโอวิธีใช้งาน เร็ว ๆ นี้</span>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

export function CtaBanner() {
  return (
    <section className="relative px-4 py-14 text-center md:py-20" style={photo('cta-bg.jpg', FOREST)}>
      <div className="absolute inset-0 bg-black/25" />
      <h2 className="relative text-2xl font-bold text-white drop-shadow md:text-4xl">อยากให้น้องรักษ์ไปอยู่ในชุมชนของคุณ?</h2>
      <div className="relative mt-5 flex justify-center gap-3">
        <Link href="/contact" className="rounded-full bg-[#b8f26b] px-5 py-1.5 text-sm font-bold text-[#154212] hover:bg-[#c9f686]">
          ร่วมกับน้องรักษ์
        </Link>
        <Link href="/contact" className="rounded-full bg-white px-5 py-1.5 text-sm font-bold text-[#154212] hover:bg-[#f1f1f1]">
          ติดต่อเรา
        </Link>
      </div>
      <div className="absolute bottom-0 right-6 hidden md:block">
        <MascotBin size={96} label="น้องรักษ์อยู่ในถังขยะ (ชวนร่วมโครงการ)" />
      </div>
    </section>
  )
}

export function SiteFooter() {
  return (
    <footer className="px-5 py-8 md:px-16" style={{ backgroundColor: LIME }}>
      <div className="mx-auto flex max-w-5xl flex-wrap items-start gap-8">
        <Image src="/landing/mascot.webp" alt="" width={36} height={39} />
        <div className="min-w-[240px] flex-1 text-sm leading-7" style={{ color: DEEP }}>
          <div className="font-bold">{COMPANY}</div>
          {ADDRESS_LINES.map((l) => (
            <div key={l}>{l}</div>
          ))}
        </div>
        <div className="text-sm leading-7" style={{ color: DEEP }}>
          <div className="font-bold">ติดต่อ</div>
          <a href={`tel:${PHONE.replace(/\s/g, '')}`}>{PHONE}</a>
        </div>
      </div>
    </footer>
  )
}
