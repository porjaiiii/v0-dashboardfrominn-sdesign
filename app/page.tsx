import Image from 'next/image'
import Link from 'next/link'
import BangKachaoMap from '@/components/dashboard/BangKachaoMap'
import LandingStats from '@/components/landing/LandingStats'

/**
 * หน้าแรกสาธารณะ — ตามแบบ
 *
 * รูปภาพประกอบให้วางไว้ที่ public/landing/ (ชื่อไฟล์ตามที่อ้างด้านล่าง)
 * ถ้ายังไม่มีไฟล์ ส่วนนั้นจะแสดงเป็นพื้นสีไล่เฉด ไม่ทำให้หน้าพัง:
 *   hero.jpg, cta-bg.jpg, community-1.jpg, community-2.jpg,
 *   plastic.jpg, paper.jpg, glass.jpg, aluminium.jpg, line-qr.png, phone.png
 */

const LOGIN_HREF = '/admin/login?next=/admin/dashboard'
const LINE_OA_URL = '#' // TODO: ใส่ลิงก์ LINE Official Account

const DEEP = '#154212'
const LIME = '#e0f8c6'

/** รูปพื้นหลัง: ใช้ไฟล์ถ้ามี ไม่มีก็เห็นสีไล่เฉดที่รองอยู่ */
const photo = (file: string, fallback: string) => ({
  backgroundImage: `url(/landing/${file}), ${fallback}`,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
})

const FOREST = 'linear-gradient(135deg, #0f3a16 0%, #2b6b2f 50%, #143d1a 100%)'
const SOFT = 'linear-gradient(135deg, #cfe9b6, #a8d58a)'

const NAV = [
  { href: '#top', label: 'หน้าหลัก' },
  { href: '#about', label: 'รู้จักน้องรักษ์' },
  { href: '#sort', label: 'แยกขยะ' },
  { href: '#community', label: 'ข้อมูลการจัดการขยะ' },
  { href: '#contact', label: 'ติดต่อเรา' },
]

const TAMBON = ['บางกะเจ้า', 'บางยอ', 'บางกอบัว', 'บางน้ำผึ้ง', 'บางกระสอบ', 'ทรงคนอง']

const WASTE_TYPES = [
  { name: 'พลาสติก', bg: '#dff5c8', icon: '#8ed04a', file: 'plastic.jpg' },
  { name: 'กระดาษ', bg: '#fde4e0', icon: '#ef8a7f', file: 'paper.jpg' },
  { name: 'แก้ว', bg: '#def3fc', icon: '#48a6df', file: 'glass.jpg' },
  { name: 'อลูมิเนียม', bg: '#fdf3d3', icon: '#e8c445', file: 'aluminium.jpg' },
]

const LINE_STEPS = [
  { title: 'บันทึกขยะ', text: 'บันทึกขยะรีไซเคิลของคุณ' },
  { title: 'สะสมคะแนน', text: 'เปลี่ยนการรีไซเคิลเป็นคะแนน' },
  { title: 'แลกรางวัล', text: 'ใช้คะแนนแลกรางวัลและสิทธิประโยชน์' },
]

function RecycleBadge({ color }: { color: string }) {
  return (
    <span className="inline-flex h-9 w-9 items-center justify-center rounded-full text-white" style={{ backgroundColor: color }}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M7 19H4l3-5M17 5h3l-3 5M12 3l-2 4h4zM9 21l3-5 3 5z" />
      </svg>
    </span>
  )
}

function Leaf({ className }: { className: string }) {
  return (
    <svg aria-hidden viewBox="0 0 120 60" className={`pointer-events-none absolute ${className}`} fill="#a8e063" opacity="0.7">
      <path d="M0 55C20 10 70 0 120 8c-5 40-50 60-120 47z" />
    </svg>
  )
}

export default function LandingPage() {
  return (
    <div id="top" className="min-h-screen bg-white text-[#1c2a1a]">
      {/* ───────── Hero + เมนูบน ───────── */}
      <header className="relative overflow-hidden" style={{ ...photo('hero.jpg', FOREST), minHeight: 300 }}>
        <div className="absolute inset-0 bg-black/20" />

        <nav className="relative z-10 flex items-center gap-3 px-4 py-3 md:px-8">
          <Link href="/" className="flex shrink-0 items-center gap-2 text-[11px] font-semibold text-white">
            <Image src="/mascot-icon.png" alt="" width={22} height={26} />
            <span className="hidden sm:inline">Digital Waste</span>
          </Link>
          <ul className="flex min-w-0 flex-1 items-center justify-center gap-1 overflow-x-auto text-[11px] font-semibold text-white md:gap-3 md:text-sm [scrollbar-width:none]">
            {NAV.map((n, i) => (
              <li key={n.href} className="shrink-0">
                <a
                  href={n.href}
                  className={`rounded-full px-3 py-1 ${i === 0 ? 'bg-white text-[#154212]' : 'hover:bg-white/15'}`}
                >
                  {n.label}
                </a>
              </li>
            ))}
          </ul>
          <label className="relative hidden shrink-0 sm:block">
            <span className="sr-only">ค้นหา</span>
            <input type="search" className="h-7 w-28 rounded-full bg-white px-3 pr-8 text-xs text-[#154212] outline-none md:w-40" />
            <svg className="absolute right-2.5 top-1.5" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#154212" strokeWidth="2.4" strokeLinecap="round" aria-hidden>
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-4-4" />
            </svg>
          </label>
          <Link
            href={LOGIN_HREF}
            className="flex shrink-0 items-center gap-1.5 rounded-full bg-[#2f7d32] px-3 py-1 text-[11px] font-semibold text-white hover:bg-[#256628] md:text-sm"
          >
            เข้าสู่ระบบ
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
              <circle cx="12" cy="8" r="4" />
              <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
            </svg>
          </Link>
        </nav>

        <div className="relative z-10 px-5 pb-10 pt-6 md:px-16 md:pb-16 md:pt-10">
          <h1 className="text-[34px] font-bold leading-[1.15] text-white drop-shadow-lg md:text-[56px]">
            เปลี่ยนขยะให้มีคุณค่า
            <br />
            กับ
            <span className="mx-1 text-[#a6f23a] [text-shadow:0_0_2px_#154212,0_2px_0_#154212,2px_0_0_#154212,-2px_0_0_#154212]">
              “น้องรักษ์”
            </span>
          </h1>
          <div className="mt-4 max-w-[380px] rounded-xl bg-white/25 px-5 py-3 text-center text-[13px] font-semibold leading-relaxed text-white backdrop-blur-sm md:ml-auto md:mr-10 md:max-w-[460px] md:text-base">
            แพลตฟอร์มจัดการขยะรีไซเคิลที่เชื่อมโยงคนในชุมชน การคัดแยกขยะ และการสร้างคุณค่าให้เกิดขึ้นอย่างยั่งยืน
          </div>
          <div className="mt-4 md:ml-auto md:mr-10 md:max-w-[460px] md:text-center">
            <Link
              href={LOGIN_HREF}
              className="inline-flex rounded-full bg-[#b8f26b] px-5 py-1.5 text-sm font-bold text-[#154212] shadow hover:bg-[#c9f686]"
            >
              เริ่มใช้งานน้องรักษ์ →
            </Link>
          </div>
        </div>
      </header>

      {/* ───────── น้องรักษ์คือใคร ───────── */}
      <section id="about" className="relative overflow-hidden px-5 py-10 md:px-16" style={{ backgroundColor: LIME }}>
        <Leaf className="-right-6 top-4 h-16 w-40 rotate-6" />
        <Leaf className="right-24 top-28 hidden h-10 w-24 -rotate-12 md:block" />
        <div className="relative mx-auto flex max-w-5xl items-center gap-6 md:gap-12">
          <Image src="/logo-mascot.png" alt="น้องรักษ์" width={110} height={150} className="h-auto w-[84px] shrink-0 md:w-[130px]" />
          <div>
            <h2 className="text-2xl font-bold md:text-3xl" style={{ color: DEEP }}>น้องรักษ์คือใคร?</h2>
            <p className="mt-3 text-[14px] leading-7 md:text-lg md:leading-8" style={{ color: '#2f7d32' }}>
              น้องรักษ์คือแพลตฟอร์มที่ช่วยให้การจัดการขยะรีไซเคิลในชุมชนเป็นเรื่องง่าย ตั้งแต่การคัดแยก บันทึกขยะ เก็บคะแนน
              ไปจนถึงการนำขยะกลับเข้าสู่กระบวนการรีไซเคิล
            </p>
          </div>
        </div>
      </section>

      {/* ───────── สถิติ ───────── */}
      <section className="px-4 py-6 md:px-16">
        <div className="mx-auto max-w-5xl">
          <LandingStats />
        </div>
      </section>

      {/* ───────── เสียงของชุมชน ───────── */}
      <section className="px-4 pb-8 md:px-16">
        <div className="mx-auto grid max-w-5xl gap-3 md:grid-cols-2 md:gap-5">
          <div className="h-[240px] rounded-xl md:h-[300px]" style={photo('community-1.jpg', SOFT)} role="img" aria-label="กิจกรรมคัดแยกขยะในชุมชน" />
          <div>
            <div className="h-[170px] rounded-xl md:h-[190px]" style={photo('community-2.jpg', SOFT)} role="img" aria-label="การรับขยะในชุมชน" />
            <h3 className="mt-3 text-2xl font-bold" style={{ color: DEEP }}>น้องรักษ์จากเสียงของชุมชน</h3>
            <p className="mt-1 text-[13px] leading-6 text-[#2f7d32]">
              ทีมงานน้องรักษ์ลงพื้นที่พูดคุยกับคนในชุมชนคุ้งบางกะเจ้า เพื่อทำความเข้าใจพฤติกรรมการจัดการขยะ รับฟังปัญหา
              และนำความคิดเห็นมาพัฒนาระบบให้ตอบโจทย์การใช้งานจริง
            </p>
          </div>
        </div>
      </section>

      {/* ───────── ชุมชนต้นแบบ ───────── */}
      <section id="community" className="relative overflow-hidden px-4 py-8 md:px-16" style={{ backgroundColor: LIME }}>
        <Leaf className="-left-6 top-6 h-14 w-32 -rotate-12" />
        <div className="relative mx-auto grid max-w-5xl items-center gap-5 md:grid-cols-2">
          <div className="px-1">
            <div className="text-lg font-bold" style={{ color: '#2f7d32' }}>ชุมชนต้นแบบของน้องรักษ์</div>
            <h2 className="text-4xl font-bold md:text-5xl" style={{ color: DEEP }}>คุ้งบางกะเจ้า</h2>
            <p className="mt-3 text-[13px] leading-6 text-[#2f7d32] md:text-base md:leading-7">
              น้องรักษ์เริ่มต้นจากการนำแนวคิดการจัดการขยะมาประยุกต์ใช้กับชุมชนคุ้งบางกะเจ้า เพื่อสร้างระบบที่เชื่อมโยงคนในชุมชน
              เจ้าหน้าที่ และการจัดการขยะเข้าด้วยกัน
            </p>
          </div>
          <div className="flex items-center gap-4 rounded-xl bg-white p-4 shadow-sm">
            <div className="w-[48%] shrink-0 [&_svg]:h-auto [&_svg]:w-full">
              <BangKachaoMap selectedDistrict="ทุกตำบล" />
            </div>
            <div>
              <div className="font-bold" style={{ color: DEEP }}>6 ตำบลคุ้งบางกะเจ้า</div>
              <ul className="mt-2 list-disc pl-5 text-[13px] leading-6 text-[#154212]">
                {TAMBON.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ───────── แยกขยะ ───────── */}
      <section id="sort" className="px-4 pb-8 md:px-16" style={{ backgroundColor: LIME }}>
        <div className="mx-auto max-w-5xl rounded-2xl bg-white p-4 md:p-6">
          <h2 className="text-center text-3xl font-bold md:text-4xl" style={{ color: DEEP }}>แยกขยะให้ถูกประเภท</h2>
          <div className="mt-3 text-center">
            <Link href="/waste-types" className="inline-flex rounded-full bg-[#b8f26b] px-5 py-1 text-sm font-bold text-[#154212] hover:bg-[#c9f686]">
              ดูวิธีแยกขยะ →
            </Link>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
            {WASTE_TYPES.map((w) => (
              <div key={w.name} className="rounded-xl p-3" style={{ backgroundColor: w.bg }}>
                <div className="flex items-center gap-3">
                  <RecycleBadge color={w.icon} />
                </div>
                <div className="mt-2 text-xl font-bold md:text-2xl" style={{ color: DEEP }}>{w.name}</div>
                <div className="mt-2 h-24 rounded-lg md:h-32" style={photo(w.file, 'linear-gradient(135deg,#ffffff,#eef3e8)')} role="img" aria-label={w.name} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── LINE OA ───────── */}
      <section className="px-4 py-8 md:px-16">
        <div className="mx-auto grid max-w-5xl items-center gap-6 md:grid-cols-[1.3fr_1fr]">
          <div>
            <div className="text-xl" style={{ color: DEEP }}>เริ่มต้นง่าย ๆ ผ่าน</div>
            <h2 className="text-3xl font-bold" style={{ color: DEEP }}>LINE Official Account</h2>
            <div className="mt-4 flex flex-wrap items-start gap-5">
              <a href={LINE_OA_URL} className="flex w-[150px] flex-col items-center gap-2 rounded-xl p-3 text-center" style={{ backgroundColor: LIME }}>
                <span className="block h-[124px] w-[124px] rounded bg-white" style={photo('line-qr.png', 'linear-gradient(135deg,#fff,#eee)')} role="img" aria-label="QR Code LINE Official Account" />
                <span className="text-xs font-semibold" style={{ color: DEEP }}>สแกนเพื่อเริ่มใช้งาน</span>
              </a>
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
          <div className="mx-auto h-[300px] w-full max-w-[280px] rounded-[28px]" style={photo('phone.png', 'transparent')} role="img" aria-label="ตัวอย่างหน้าจอ LINE น้องรักษ์" />
        </div>
      </section>

      {/* ───────── CTA ───────── */}
      <section className="relative overflow-hidden px-4 py-14 text-center md:py-20" style={photo('cta-bg.jpg', FOREST)}>
        <div className="absolute inset-0 bg-black/25" />
        <h2 className="relative text-2xl font-bold text-white drop-shadow md:text-4xl">อยากให้น้องรักษ์ไปอยู่ในชุมชนของคุณ?</h2>
        <div className="relative mt-5 flex justify-center gap-3">
          <a href="#contact" className="rounded-full bg-[#b8f26b] px-5 py-1.5 text-sm font-bold text-[#154212] hover:bg-[#c9f686]">
            ร่วมกับน้องรักษ์
          </a>
          <a href="#contact" className="rounded-full bg-white px-5 py-1.5 text-sm font-bold text-[#154212] hover:bg-[#f1f1f1]">
            ติดต่อเรา
          </a>
        </div>
        <Image src="/logo-mascot.png" alt="" width={70} height={100} className="absolute bottom-0 right-4 hidden h-auto w-[64px] md:block" />
      </section>

      {/* ───────── ท้ายหน้า ───────── */}
      <footer id="contact" className="px-5 py-8 md:px-16" style={{ backgroundColor: LIME }}>
        <div className="mx-auto flex max-w-5xl flex-wrap items-start gap-8">
          <Image src="/mascot-icon.png" alt="" width={32} height={39} />
          <div className="min-w-[240px] flex-1 text-sm leading-7" style={{ color: DEEP }}>
            <div className="font-bold">บริษัท เลิร์นดู วิสาหกิจเพื่อสังคม จำกัด</div>
            <div>เลขที่ 68/7 หมู่ที่ 3 ตำบลบางกอบัว</div>
            <div>อำเภอพระประแดง จังหวัดสมุทรปราการ 10130</div>
          </div>
          <div className="text-sm leading-7" style={{ color: DEEP }}>
            <div className="font-bold">ติดต่อเรา</div>
            <a href="tel:0925054994">092 505 4994</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
