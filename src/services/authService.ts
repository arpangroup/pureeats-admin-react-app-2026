import { apiClient } from '@/lib/apiClient'
import { mockDelay, nextMockId } from '@/lib/mockUtils'
import { buildMockJwt, decodeJwtPayload } from '@/lib/jwt'
import { IS_MOCK } from '@/config/env'
import { users } from '@/mocks/fixtures'
import { mapFrontendRole } from '@/types/auth'
import type { User } from '@/types/entities'
import type {
  AuthTokenResponse,
  LoginChallengeRequest,
  LoginChallengeResponse,
  RefreshTokenRequest,
  ResendOtpRequest,
  ResendOtpResponse,
  SignupRequest,
  VerifyOtpRequest,
} from '@/types/auth'

export interface LoginPayload {
  email: string
  password: string
}

export interface LoginResult {
  user: User
  token: string
}

/** Demo accounts shown on the login screen in mock mode. Any password works. */
export const DEMO_ACCOUNTS: { label: string; email: string; role: User['role'] }[] = [
  { label: 'Admin', email: 'arpan@pureeats.in', role: 'admin' },
  { label: 'Restaurant Owner', email: 'ravi@spicegarden.in', role: 'restaurant-owner' },
]

// --- Mock OTP-challenge simulation -----------------------------------
// The real backend issues a challengeId per register/otp-send call and
// verifies it with a one-time code. In mock mode we replicate the same
// shape in-memory, always accepting "123456" as the code, so the
// Login/Register/Verify screens exercise identical UI logic in both modes.
interface MockChallenge {
  destination: string
  purpose: 'register' | 'login'
  userId: number
  name: string
  email: string
  phone: string
  role: User['role']
}

const mockChallenges = new Map<string, MockChallenge>()
const MOCK_OTP = '123456'

function maskDestination(value: string): string {
  if (value.includes('@')) {
    const [local, domain] = value.split('@')
    return `${local.slice(0, 2)}***@${domain}`
  }
  return `${'*'.repeat(Math.max(0, value.length - 2))}${value.slice(-2)}`
}

function mockChallengeResponse(challengeId: string, destination: string): LoginChallengeResponse {
  return {
    success: true,
    message: 'OTP sent (mock mode — use 123456).',
    challengeId,
    maskedDestination: maskDestination(destination),
    expiresIn: 300,
    resendAvailableIn: 10,
  }
}

export const authService = {
  async login({ email }: LoginPayload): Promise<LoginResult> {
    if (IS_MOCK) {
      await mockDelay()
      const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase())
      if (!user) {
        throw { message: 'No account found with that email in the demo dataset.' }
      }
      if (!user.isActive) {
        throw { message: 'This account has been deactivated.' }
      }
      return { user, token: `mock-token-${user.id}-${Date.now()}` }
    }
    const { data } = await apiClient.post<LoginResult>('/auth/login', { email })
    return data
  },

  async logout(): Promise<void> {
    if (IS_MOCK) {
      await mockDelay(150)
      return
    }
    await apiClient.post('/auth/logout')
  },

  async register(payload: SignupRequest): Promise<LoginChallengeResponse> {
    if (IS_MOCK) {
      await mockDelay()
      const challengeId = `mock-challenge-${nextMockId()}`
      mockChallenges.set(challengeId, {
        destination: payload.email,
        purpose: 'register',
        userId: nextMockId(),
        name: payload.fullName,
        email: payload.email,
        phone: '',
        role: 'customer',
      })
      return mockChallengeResponse(challengeId, payload.email)
    }
    const { data } = await apiClient.post<{ data: LoginChallengeResponse }>('/auth/register', payload)
    return data.data
  },

  async requestOtp(payload: LoginChallengeRequest): Promise<LoginChallengeResponse> {
    if (IS_MOCK) {
      await mockDelay()
      const destination = payload.method === 'EMAIL' ? payload.email : payload.phone
      const existing = users.find((u) =>
        payload.method === 'EMAIL' ? u.email.toLowerCase() === payload.email.toLowerCase() : u.phone === payload.phone,
      )
      const challengeId = `mock-challenge-${nextMockId()}`
      mockChallenges.set(challengeId, existing
        ? { destination, purpose: 'login', userId: existing.id, name: existing.name, email: existing.email, phone: existing.phone, role: existing.role }
        : { destination, purpose: 'login', userId: nextMockId(), name: destination, email: payload.method === 'EMAIL' ? payload.email : '', phone: payload.method === 'PHONE' ? payload.phone : '', role: 'customer' })
      return mockChallengeResponse(challengeId, destination)
    }
    const { data } = await apiClient.post<{ data: LoginChallengeResponse }>('/auth/otp/send', payload)
    return data.data
  },

  async resendOtp(payload: ResendOtpRequest): Promise<ResendOtpResponse> {
    if (IS_MOCK) {
      await mockDelay()
      const challenge = mockChallenges.get(payload.challengeId)
      if (!challenge) throw { message: 'Challenge not found or expired.' }
      return { success: true, message: 'OTP resent (mock mode — use 123456).', expiresIn: 300, resendAvailableIn: 10 }
    }
    const { data } = await apiClient.post<{ data: ResendOtpResponse }>('/auth/otp/resend', payload)
    return data.data
  },

  async verifyOtp(payload: VerifyOtpRequest): Promise<AuthTokenResponse> {
    if (IS_MOCK) {
      await mockDelay()
      const challenge = mockChallenges.get(payload.challengeId)
      if (!challenge) throw { message: 'Challenge not found or expired.' }
      if (payload.otp !== MOCK_OTP) throw { message: `Invalid OTP. Use ${MOCK_OTP} in mock mode.` }
      mockChallenges.delete(payload.challengeId)
      const claims = {
        sub: String(challenge.userId),
        name: challenge.name,
        email: challenge.email,
        phone: challenge.phone,
        role: mapFrontendRole(challenge.role),
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 900,
      }
      return {
        accessToken: buildMockJwt(claims),
        refreshToken: buildMockJwt({ ...claims, typ: 'refresh', exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30 }),
        tokenType: 'Bearer',
        expiresIn: 900,
      }
    }
    const { data } = await apiClient.post<{ data: AuthTokenResponse }>('/auth/otp/verify', payload)
    return data.data
  },

  async refreshToken(payload: RefreshTokenRequest): Promise<AuthTokenResponse> {
    if (IS_MOCK) {
      await mockDelay(150)
      const claims = decodeJwtPayload<Record<string, unknown>>(payload.refreshToken)
      if (!claims) throw { message: 'Invalid refresh token.' }
      const now = Math.floor(Date.now() / 1000)
      return {
        accessToken: buildMockJwt({ ...claims, typ: undefined, iat: now, exp: now + 900 }),
        refreshToken: buildMockJwt({ ...claims, typ: 'refresh', iat: now, exp: now + 60 * 60 * 24 * 30 }),
        tokenType: 'Bearer',
        expiresIn: 900,
      }
    }
    const { data } = await apiClient.post<{ data: AuthTokenResponse }>('/auth/refresh', payload)
    return data.data
  },

  /** Live-mode single-session logout — the backend expects the refresh token in the body. */
  async logoutSession(refreshToken: string): Promise<void> {
    if (IS_MOCK) {
      await mockDelay(150)
      return
    }
    await apiClient.post('/auth/logout', { refreshToken })
  },

  async logoutAll(): Promise<void> {
    if (IS_MOCK) {
      await mockDelay(150)
      return
    }
    await apiClient.post('/auth/logout-all')
  },
}
