'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

export interface LiffProfile {
  userId: string
  displayName: string
  pictureUrl?: string
  statusMessage?: string
}

interface LiffContextType {
  isLiffReady: boolean
  isLoggedIn: boolean
  profile: LiffProfile | null
  liffLogin: () => void
  liffLogout: () => void
}

const LiffContext = createContext<LiffContextType>({
  isLiffReady: false,
  isLoggedIn: false,
  profile: null,
  liffLogin: () => {},
  liffLogout: () => {},
})

export function LiffProvider({ children }: { children: ReactNode }) {
  const [isLiffReady, setIsLiffReady] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [profile, setProfile] = useState<LiffProfile | null>(null)

  useEffect(() => {
    const initLiff = async () => {
      try {
        const liff = (await import('@line/liff')).default
        const liffId = process.env.NEXT_PUBLIC_LIFF_ID || '2010373397-WOHBL6M0'
        await liff.init({ liffId })
        setIsLiffReady(true)
        if (liff.isLoggedIn()) {
          setIsLoggedIn(true)
          const p = await liff.getProfile()
          setProfile({
            userId: p.userId,
            displayName: p.displayName,
            pictureUrl: p.pictureUrl,
            statusMessage: p.statusMessage,
          })
        }
      } catch (err) {
        console.error('LIFF init error:', err)
        setIsLiffReady(true)
      }
    }
    initLiff()
  }, [])

  const liffLogin = async () => {
    const liff = (await import('@line/liff')).default
    liff.login()
  }

  const liffLogout = async () => {
    const liff = (await import('@line/liff')).default
    liff.logout()
    setIsLoggedIn(false)
    setProfile(null)
  }

  return (
    <LiffContext.Provider value={{ isLiffReady, isLoggedIn, profile, liffLogin, liffLogout }}>
      {children}
    </LiffContext.Provider>
  )
}

export const useLiff = () => useContext(LiffContext)
