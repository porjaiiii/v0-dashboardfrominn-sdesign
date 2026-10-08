import Link from 'next/link'
import HeroCarousel from '@/components/landing/HeroCarousel'
import HeroScene from '@/components/landing/HeroScene'
import LandingStats from '@/components/landing/LandingStats'
import SiteNav from '@/components/landing/SiteNav'
import { AboutSection, CommunityBanner, CtaBanner, LineSection, SiteFooter } from '@/components/landing/sections'
import { DEEP, LIME, RecycleBadge, SOFT, photo } from '@/components/landing/shared'
import { LOGIN_HREF } from '@/lib/site'

/**
 * หน้าแรกสาธารณะ — ตามแบบ
 *
 * รูปภาพประกอบให้วางไว้ที่ public/landing/ (ชื่อไฟล์ตามที่อ้างด้านล่าง)
 * ถ้ายังไม่มีไฟล์ ส่วนนั้นจะแสดงเป็นพื้นสีไล่เฉด ไม่ทำให้หน้าพัง:
 *   cta-bg.jpg, plastic.jpg, paper.jpg, glass.jpg, aluminium.jpg, phone.png
 *   (hero-slide-1/2.webp, community-1/2.webp, line-qr.png มีแล้ว)
 */

const WASTE_TYPES = [
  { name: 'พลาสติก', bg: '#dff5c8', icon: '#8ed04a', file: 'plastic.jpg' },
  { name: 'กระดาษ', bg: '#fde4e0', icon: '#ef8a7f', file: 'paper.jpg' },
  { name: 'แก้ว', bg: '#def3fc', icon: '#48a6df', file: 'glass.jpg' },
  { name: 'อลูมิเนียม', bg: '#fdf3d3', icon: '#e8c445', file: 'aluminium.jpg' },
]

export default function LandingPage() {
  return (
    <div id="top" className="min-h-screen overflow-x-clip bg-white text-[#1c2a1a]">
      {/* ───────── แบนเนอร์เลื่อนได้ + เมนูบน ───────── */}
      <header className="relative">
        <h1 className="sr-only">เปลี่ยนขยะให้มีคุณค่า กับ “น้องรักษ์”</h1>
        <HeroCarousel />
        <div className="absolute inset-x-0 top-0 z-40">
          <SiteNav active="home" variant="hero" />
        </div>
        {/* จอเล็กอ่านข้อความในรูปไม่ได้/กดปุ่มในรูปไม่ได้ จึงมีปุ่มจริงใต้แบนเนอร์ */}
        <div className="flex justify-center gap-3 bg-[#e0f8c6] px-4 py-3 md:hidden">
          <Link href={LOGIN_HREF} className="rounded-full bg-[#154212] px-5 py-2 text-sm font-bold text-white">
            เริ่มใช้งานน้องรักษ์ →
          </Link>
          <Link href="/about" className="rounded-full bg-white px-5 py-2 text-sm font-bold text-[#154212]">
            รู้จักน้องรักษ์
          </Link>
        </div>
      </header>

      {/* ───────── แถบน้องรักษ์เดินเก็บขยะ คั่นระหว่างแบนเนอร์กับส่วนแนะนำ ───────── */}
      <section
        aria-hidden
        className="relative w-full overflow-hidden"
        style={{ height: 'clamp(170px, 24vw, 280px)', background: 'linear-gradient(#ffffff 0%, #eefbd9 60%, #e0f8c6 100%)' }}
      >
        <HeroScene />
      </section>

      <AboutSection />
      <CommunityBanner />

      {/* ───────── สถิติ ───────── */}
      <section className="px-4 py-6 md:px-16">
        <div className="mx-auto max-w-5xl">
          <LandingStats />
        </div>
      </section>

      {/* ───────── เสียงของชุมชน ───────── */}
      <section className="px-4 pb-8 md:px-16">
        <div className="mx-auto grid max-w-5xl gap-3 md:grid-cols-2 md:gap-5">
          <div className="h-[240px] rounded-xl md:h-[300px]" style={photo('community-1.webp', SOFT)} role="img" aria-label="กิจกรรมคัดแยกขยะในชุมชน" />
          <div>
            <div className="h-[170px] rounded-xl md:h-[190px]" style={photo('community-2.webp', SOFT)} role="img" aria-label="การรับขยะในชุมชน" />
            <h3 className="mt-3 text-2xl font-bold" style={{ color: DEEP }}>น้องรักษ์จากเสียงของชุมชน</h3>
            <p className="mt-1 text-[13px] leading-6 text-[#2f7d32]">
              ทีมงานน้องรักษ์ลงพื้นที่พูดคุยกับคนในชุมชนคุ้งบางกะเจ้า เพื่อทำความเข้าใจพฤติกรรมการจัดการขยะ รับฟังปัญหา
              และนำความคิดเห็นมาพัฒนาระบบให้ตอบโจทย์การใช้งานจริง
            </p>
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
