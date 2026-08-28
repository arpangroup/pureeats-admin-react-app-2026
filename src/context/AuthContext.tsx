import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { AUTH_TOKEN_STORAGE_KEY, AUTH_USER_STORAGE_KEY } from '@/config/env'
import { readStorage, removeStorage, writeStorage } from '@/lib/storage'
import { authService, type LoginPayload } from '@/services/authService'
import type { User } from '@/types/entities'

interface AuthContextValue {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  login: (payload: LoginPayload) => Promise<User>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

// Auth is intentionally isolated behind this one context. Swapping mock
// login for a real JWT/OAuth flow later only means editing
// src/services/authService.ts — this provider, ProtectedRoute, and every
// page that calls useAuth() stay the same.
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => readStorage<User | null>(AUTH_USER_STORAGE_KEY, null))
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const login = useCallback(async (payload: LoginPayload) => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await authService.login(payload)
      writeStorage(AUTH_USER_STORAGE_KEY, result.user)
      writeStorage(AUTH_TOKEN_STORAGE_KEY, result.token)
      setUser(result.user)
      return result.user
    } catch (err) {
      const message = (err as { message?: string })?.message ?? 'Unable to sign in'
      setError(message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const logout = useCallback(async () => {
    await authService.logout()
    removeStorage(AUTH_USER_STORAGE_KEY)
    removeStorage(AUTH_TOKEN_STORAGE_KEY)
    setUser(null)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({ user, isAuthenticated: !!user, isLoading, error, login, logout }),
    [user, isLoading, error, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
