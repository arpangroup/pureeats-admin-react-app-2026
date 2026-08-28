import { apiClient } from '@/lib/apiClient'
import { mockDelay } from '@/lib/mockUtils'
import { IS_MOCK } from '@/config/env'
import { users } from '@/mocks/fixtures'
import type { User } from '@/types/entities'

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
}
