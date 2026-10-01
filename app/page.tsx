import Link from 'next/link'
import BangKachaoMap from '@/components/dashboard/BangKachaoMap'
import LandingStats from '@/components/landing/LandingStats'
import SiteNav from '@/components/landing/SiteNav'
import { AboutSection, CtaBanner, LineSection, SiteFooter } from '@/components/landing/sections'
import { DEEP, FOREST, LIME, Leaf, RecycleBadge, SOFT, photo } from '@/components/landing/shared'
import { LOGIN_HREF } from '@/lib/site'

/**
 * หน้าแรกสาธารณะ — ตามแบบ
 *
 * รูปภาพประกอบให้วางไว้ที่ public/landing/ (ชื่อไฟล์ตามที่อ้างด้านล่าง)
 * ถ้ายังไม่มีไฟล์ ส่วนนั้นจะแสดงเป็นพื้นสีไล่เฉด ไม่ทำให้หน้าพัง:
 *   hero.jpg, cta-bg.jpg, community-1.jpg, community-2.jpg,
 *   plastic.jpg, paper.jpg, glass.jpg, aluminium.jpg, line-qr.png, phone.png
 */

const TAMBON = ['บางกะเจ้า', 'บางยอ', 'บางกอบัว', 'บางน้ำผึ้ง', 'บางกระสอบ', 'ทรงคนอง']

const WASTE_TYPES = [
  { name: 'พลาสติก', bg: '#dff5c8', icon: '#8ed04a', file: 'plastic.jpg' },
  { name: 'กระดาษ', bg: '#fde4e0', icon: '#ef8a7f', file: 'paper.jpg' },
  { name: 'แก้ว', bg: '#def3fc', icon: '#48a6df', file: 'glass.jpg' },
  { name: 'อลูมิเนียม', bg: '#fdf3d3', icon: '#e8c445', file: 'aluminium.jpg' },
]

export default function LandingPage() {
  return (
    <div id="top" className="min-h-screen overflow-x-clip bg-white text-[#1c2a1a]">
      {/* ───────── Hero + เมนูบน ───────── */}
      <header className="relative overflow-hidden" style={{ ...photo('hero.jpg', FOREST), minHeight: 300 }}>
        <div className="absolute inset-0 bg-black/20" />
        <SiteNav active="home" variant="hero" />

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

      <AboutSection />

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
            <Link href="/sorting" className="inline-flex rounded-full bg-[#b8f26b] px-5 py-1 text-sm font-bold text-[#154212] hover:bg-[#c9f686]">
              ดูวิธีแยกขยะ →
            </Link>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
            {WASTE_TYPES.map((w) => (
              <div key={w.name} className="rounded-xl p-3" style={{ backgroundColor: w.bg }}>
                <RecycleBadge color={w.icon} />
                <div className="mt-2 text-xl font-bold md:text-2xl" style={{ color: DEEP }}>{w.name}</div>
                <div className="mt-2 h-24 rounded-lg md:h-32" style={photo(w.file, 'linear-gradient(135deg,#ffffff,#eef3e8)')} role="img" aria-label={w.name} />
              </div>
            ))}
          </div>
        </div>
      </section>

      <LineSection />
      <CtaBanner />
      <SiteFooter />
    </div>
  )
}
