'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

export interface EmailUser {
  email: string
  name: string
}

interface AuthContextType {
  emailUser: EmailUser | null
  emailLogin: (email: string, password: string) => Promise<boolean>
  emailLogout: () => void
}

const AuthContext = createContext<AuthContextType>({
  emailUser: null,
  emailLogin: async () => false,
  emailLogout: () => {},
})

// Simple mock email auth — replace with real backend calls as needed
const MOCK_USERS: Record<string, { password: string; name: string }> = {
  'admin@bangkachao.go.th': { password: 'admin1234', name: 'ผู้ดูแลระบบ' },
  'user@bangkachao.go.th': { password: 'user1234', name: 'เจ้าหน้าที่' },
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [emailUser, setEmailUser] = useState<EmailUser | null>(null)

  const emailLogin = async (email: string, password: string): Promise<boolean> => {
    const found = MOCK_USERS[email]
    if (found && found.password === password) {
      setEmailUser({ email, name: found.name })
      return true
    }
    return false
  }

  const emailLogout = () => {
    setEmailUser(null)
  }

  return (
    <AuthContext.Provider value={{ emailUser, emailLogin, emailLogout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
