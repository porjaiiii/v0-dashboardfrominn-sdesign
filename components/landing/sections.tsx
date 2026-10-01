import Image from 'next/image'
import Link from 'next/link'
import { ADDRESS_LINES, COMPANY, HOWTO_VIDEO_EMBED_URL, LINE_OA_URL, PHONE } from '@/lib/site'
import { DEEP, FOREST, LIME, Leaf, RecycleBadge, photo } from './shared'
import MascotBin from './MascotBin'

/** ส่วนที่ใช้ซ้ำหลายหน้า: น้องรักษ์คือใคร / LINE OA / วิดีโอ / แบนเนอร์ชวน / ท้ายหน้า */

export function AboutSection() {
  return (
    <section id="about" className="relative overflow-hidden px-5 py-10 md:px-16" style={{ backgroundColor: LIME }}>
      <Leaf className="-right-6 top-4 h-16 w-40 rotate-6" />
      <Leaf className="right-24 top-28 hidden h-10 w-24 -rotate-12 md:block" />
      <div className="relative mx-auto flex max-w-5xl items-center gap-6 md:gap-12">
        <div className="shrink-0 px-[40px] md:px-[52px]">
          <MascotBin size={110} />
        </div>
        <div>
          <h2 className="text-2xl font-bold md:text-3xl" style={{ color: DEEP }}>น้องรักษ์คือใคร?</h2>
          <p className="mt-3 text-[14px] leading-7 md:text-lg md:leading-8" style={{ color: '#2f7d32' }}>
            น้องรักษ์คือแพลตฟอร์มที่ช่วยให้การจัดการขยะรีไซเคิลในชุมชนเป็นเรื่องง่าย ตั้งแต่การคัดแยก บันทึกขยะ เก็บคะแนน
            ไปจนถึงการนำขยะกลับเข้าสู่กระบวนการรีไซเคิล
          </p>
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
