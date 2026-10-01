import type { Metadata } from 'next'
import SiteNav from '@/components/landing/SiteNav'
import { AboutSection, CtaBanner, LineSection, SiteFooter, VideoSection } from '@/components/landing/sections'

export const metadata: Metadata = { title: 'รู้จักน้องรักษ์ - Digital Waste' }

export default function AboutPage() {
  return (
    <div className="min-h-screen overflow-x-clip bg-white text-[#1c2a1a]">
      <SiteNav active="about" />
      <AboutSection />
      <LineSection />
      <VideoSection />
      <CtaBanner />
      <SiteFooter />
    </div>
  )
}
