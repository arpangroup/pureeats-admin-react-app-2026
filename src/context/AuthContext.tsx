import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { AUTH_REFRESH_TOKEN_STORAGE_KEY, AUTH_TOKEN_STORAGE_KEY, AUTH_USER_STORAGE_KEY, IS_MOCK } from '@/config/env'
import { readStorage, removeStorage, writeStorage } from '@/lib/storage'
import { decodeJwtPayload } from '@/lib/jwt'
import { authService, type LoginPayload } from '@/services/authService'
import type { User } from '@/types/entities'
import type {
  AccessTokenClaims,
  LoginChallengeRequest,
  LoginChallengeResponse,
  ResendOtpResponse,
  SignupRequest,
  VerifyOtpRequest,
} from '@/types/auth'
import { mapBackendRole } from '@/types/auth'

interface AuthContextValue {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  login: (payload: LoginPayload) => Promise<User>
  logout: () => Promise<void>
  register: (payload: SignupRequest) => Promise<LoginChallengeResponse>
  requestOtp: (payload: LoginChallengeRequest) => Promise<LoginChallengeResponse>
  verifyOtp: (payload: VerifyOtpRequest) => Promise<User>
  resendOtp: (challengeId: string) => Promise<ResendOtpResponse>
  logoutAll: () => Promise<void>
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
    if (IS_MOCK) {
      await authService.logout()
    } else {
      const refreshToken = readStorage<string | null>(AUTH_REFRESH_TOKEN_STORAGE_KEY, null)
      if (refreshToken) await authService.logoutSession(refreshToken)
    }
    removeStorage(AUTH_USER_STORAGE_KEY)
    removeStorage(AUTH_TOKEN_STORAGE_KEY)
    removeStorage(AUTH_REFRESH_TOKEN_STORAGE_KEY)
    setUser(null)
  }, [])

  const register = useCallback(async (payload: SignupRequest) => {
    setIsLoading(true)
    setError(null)
    try {
      return await authService.register(payload)
    } catch (err) {
      setError((err as { message?: string })?.message ?? 'Unable to register')
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const requestOtp = useCallback(async (payload: LoginChallengeRequest) => {
    setIsLoading(true)
    setError(null)
    try {
      return await authService.requestOtp(payload)
    } catch (err) {
      setError((err as { message?: string })?.message ?? 'Unable to send OTP')
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const verifyOtp = useCallback(async (payload: VerifyOtpRequest) => {
    setIsLoading(true)
    setError(null)
    try {
      const tokens = await authService.verifyOtp(payload)
      const claims = decodeJwtPayload<AccessTokenClaims>(tokens.accessToken)
      if (!claims) throw { message: 'Received an unreadable session token.' }
      const now = new Date().toISOString()
      const verifiedUser: User = {
        id: Number(claims.sub),
        name: claims.name,
        email: claims.email,
        phone: claims.phone ?? '',
        photo: null,
        isActive: true,
        role: mapBackendRole(claims.role),
        deliveryGuyDetailId: claims.deliveryGuyDetailId ?? null,
        createdAt: now,
        updatedAt: now,
      }
      writeStorage(AUTH_USER_STORAGE_KEY, verifiedUser)
      writeStorage(AUTH_TOKEN_STORAGE_KEY, tokens.accessToken)
      writeStorage(AUTH_REFRESH_TOKEN_STORAGE_KEY, tokens.refreshToken)
      setUser(verifiedUser)
      return verifiedUser
    } catch (err) {
      setError((err as { message?: string })?.message ?? 'Unable to verify OTP')
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const resendOtp = useCallback(async (challengeId: string) => {
    try {
      return await authService.resendOtp({ challengeId })
    } catch (err) {
      setError((err as { message?: string })?.message ?? 'Unable to resend OTP')
      throw err
    }
  }, [])

  const logoutAll = useCallback(async () => {
    await authService.logoutAll()
    removeStorage(AUTH_USER_STORAGE_KEY)
    removeStorage(AUTH_TOKEN_STORAGE_KEY)
    removeStorage(AUTH_REFRESH_TOKEN_STORAGE_KEY)
    setUser(null)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({ user, isAuthenticated: !!user, isLoading, error, login, logout, register, requestOtp, verifyOtp, resendOtp, logoutAll }),
    [user, isLoading, error, login, logout, register, requestOtp, verifyOtp, resendOtp, logoutAll],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
