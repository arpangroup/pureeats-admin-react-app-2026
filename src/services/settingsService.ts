import { apiClient } from '@/lib/apiClient'
import { mockDelay } from '@/lib/mockUtils'
import { IS_MOCK } from '@/config/env'
import { settings, paymentGateways, smsGateways } from '@/mocks/fixtures'
import type { PaymentGateway, Setting, SmsGateway } from '@/types/entities'

export interface CacheInfo {
  name: string
  estimatedSize: number | null
}

/**
 * The live backend's actual shape for these three ('/settings' returns a flat key→value map, not a
 * `Setting[]`; '/payment-gateways' and '/sms-gateways' come back as the standard `{ data: T }`
 * envelope like everywhere else, not unwrapped) doesn't match what this file originally assumed —
 * this page was built ahead of a backend contract that never quite landed. `unwrapArray` is a
 * defensive normalizer so a shape mismatch degrades to "show nothing" instead of crashing the whole
 * Settings page (every tab, not just the mismatched one — there's no error boundary here).
 */
function unwrapArray<T>(body: unknown): T[] {
  if (Array.isArray(body)) return body as T[]
  if (body && typeof body === 'object' && Array.isArray((body as { data?: unknown }).data)) {
    return (body as { data: T[] }).data
  }
  return []
}

export const settingsService = {
  async getAll(): Promise<Setting[]> {
    if (IS_MOCK) {
      await mockDelay()
      return [...settings]
    }
    const { data } = await apiClient.get('/settings')
    return unwrapArray<Setting>(data)
  },

  async update(key: string, value: string): Promise<Setting> {
    if (IS_MOCK) {
      await mockDelay()
      const index = settings.findIndex((s) => s.key === key)
      if (index === -1) throw { message: `Unknown setting: ${key}` }
      settings[index] = { ...settings[index], value }
      return settings[index]
    }
    const { data } = await apiClient.put<{ data: Setting }>(`/settings/${key}`, { value })
    return data.data
  },

  async paymentGateways(): Promise<PaymentGateway[]> {
    if (IS_MOCK) {
      await mockDelay()
      return [...paymentGateways]
    }
    const { data } = await apiClient.get('/payment-gateways')
    return unwrapArray<PaymentGateway>(data)
  },

  async togglePaymentGateway(id: number, isActive: boolean): Promise<PaymentGateway> {
    if (IS_MOCK) {
      await mockDelay()
      const index = paymentGateways.findIndex((g) => g.id === id)
      if (index === -1) throw { message: 'Gateway not found' }
      paymentGateways[index] = { ...paymentGateways[index], isActive }
      return paymentGateways[index]
    }
    const { data } = await apiClient.patch<{ data: PaymentGateway }>(`/payment-gateways/${id}`, { isActive })
    return data.data
  },

  async smsGateways(): Promise<SmsGateway[]> {
    if (IS_MOCK) {
      await mockDelay()
      return [...smsGateways]
    }
    const { data } = await apiClient.get('/sms-gateways')
    return unwrapArray<SmsGateway>(data)
  },

  /** Live mode only — there's no real backend cache to inspect in mock mode. */
  async listCaches(): Promise<CacheInfo[]> {
    if (IS_MOCK) return []
    const { data } = await apiClient.get<{ data: CacheInfo[] }>('/admin/cache')
    return data.data
  },

  /** Clears every server-side cache (restaurants, menus, coupons, ...) so the next request re-reads straight from the database. Returns the names that were cleared. */
  async clearAllCaches(): Promise<string[]> {
    if (IS_MOCK) return []
    const { data } = await apiClient.post<{ data: { clearedCaches: string[] } }>('/admin/cache/clear')
    return data.data.clearedCaches
  },
}
