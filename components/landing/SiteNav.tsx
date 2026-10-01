import Image from 'next/image'
import Link from 'next/link'
import { LOGIN_HREF, NAV_ITEMS, type NavKey } from '@/lib/site'

/**
 * เมนูบนของเว็บสาธารณะ
 * - variant "hero": ตัวหนังสือขาว วางทับรูปส่วนบนสุดของหน้าแรก
 * - variant "light": ตัวหนังสือเขียวเข้ม บนแถบเขียวอ่อนไล่เฉด ใช้กับหน้าย่อย
 */
export default function SiteNav({ active, variant = 'light' }: { active: NavKey; variant?: 'hero' | 'light' }) {
  const hero = variant === 'hero'
  return (
    <nav
      aria-label="เมนูหลัก"
      className={`relative z-20 flex items-center gap-3 px-4 py-3 md:px-8 ${hero ? '' : 'text-[#154212]'}`}
      style={hero ? undefined : { background: 'linear-gradient(#a9c996, #e0f8c6)' }}
    >
      <Link href="/" className={`flex shrink-0 items-center gap-2 text-[11px] font-semibold md:text-sm ${hero ? 'text-white' : ''}`}>
        <Image src="/landing/mascot.webp" alt="" width={24} height={26} />
        <span className="hidden sm:inline">Digital Waste</span>
      </Link>

      <ul className={`flex min-w-0 flex-1 items-center justify-center gap-1 overflow-x-auto text-[11px] font-semibold md:gap-3 md:text-sm [scrollbar-width:none] ${hero ? 'text-white' : ''}`}>
        {NAV_ITEMS.map((n) => {
          const on = n.key === active
          return (
            <li key={n.key} className="shrink-0">
              <Link
                href={n.href}
                aria-current={on ? 'page' : undefined}
                className={`block rounded-full px-3 py-1 ${on ? 'bg-white text-[#154212]' : hero ? 'hover:bg-white/15' : 'hover:bg-white/50'}`}
              >
                {n.label}
              </Link>
            </li>
          )
        })}
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
        className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold text-white md:text-sm ${hero ? 'bg-[#2f7d32] hover:bg-[#256628]' : 'bg-[#154212] hover:bg-[#0f3010]'}`}
      >
        เข้าสู่ระบบ
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
        </svg>
      </Link>
    </nav>
  )
}
