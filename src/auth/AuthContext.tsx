import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { User } from '../types'
import { fetchCurrentUser, login as apiLogin, logout as apiLogout, register as apiRegister } from '../api/auth'
import type { LoginPayload, RegisterPayload } from '../api/auth'

interface AuthContextValue {
  user: User | null
  isLoading: boolean
  login: (payload: LoginPayload) => Promise<User>
  register: (payload: RegisterPayload) => Promise<User>
  logout: () => Promise<void>
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refresh = useCallback(async () => {
    const current = await fetchCurrentUser()
    setUser(current)
  }, [])

  useEffect(() => {
    let cancelled = false

    fetchCurrentUser().then((current) => {
      if (!cancelled) {
        setUser(current)
        setIsLoading(false)
      }
    })

    return () => {
      cancelled = true
    }
  }, [])

  const login = useCallback(async (payload: LoginPayload) => {
    const loggedIn = await apiLogin(payload)
    setUser(loggedIn)
    return loggedIn
  }, [])

  const register = useCallback(async (payload: RegisterPayload) => {
    const registered = await apiRegister(payload)
    setUser(registered)
    return registered
  }, [])

  const logout = useCallback(async () => {
    await apiLogout()
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({ user, isLoading, login, register, logout, refresh }),
    [user, isLoading, login, register, logout, refresh],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
