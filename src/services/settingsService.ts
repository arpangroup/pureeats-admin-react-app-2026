import { apiClient } from '@/lib/apiClient'
import { mockDelay } from '@/lib/mockUtils'
import { IS_MOCK } from '@/config/env'
import { settings, paymentGateways, smsGateways } from '@/mocks/fixtures'
import { mockVerifyConfirmationPassword } from '@/services/appConfigService'
import type { PaymentGateway, SmsGateway } from '@/types/entities'

export interface CacheInfo {
  name: string
  estimatedSize: number | null
}

/**
 * The generic key/value settings store's own shape — deliberately not the `Setting` type from
 * types/entities.ts, which models a real DB row with an `id` (used elsewhere for an actual CRUD
 * resource). `/settings` and `/admin/settings` are keyed by `key` alone (a flat
 * `Record<string, string>` on the wire — see mapToSettings below); there's no per-entry id to have.
 */
export interface SettingKeyValue {
  key: string
  value: string
}

/**
 * '/payment-gateways' and '/sms-gateways' come back as the standard `{ data: T[] }` envelope like
 * everywhere else, not unwrapped — `unwrapArray` is a defensive normalizer so a shape mismatch
 * degrades to "show nothing" instead of crashing the whole Settings page (every tab, not just the
 * mismatched one — there's no error boundary here).
 */
function unwrapArray<T>(body: unknown): T[] {
  if (Array.isArray(body)) return body as T[]
  if (body && typeof body === 'object' && Array.isArray((body as { data?: unknown }).data)) {
    return (body as { data: T[] }).data
  }
  return []
}

/** '/settings' (unlike everything array-shaped above) comes back as `{ data: Record<string, string> }` — a flat key→value map, not a list of rows — converted here into the SettingKeyValue[] shape every caller on this side expects. */
function mapToSettings(map: Record<string, string> | undefined | null): SettingKeyValue[] {
  return Object.entries(map ?? {}).map(([key, value]) => ({ key, value }))
}

export const settingsService = {
  async getAll(): Promise<SettingKeyValue[]> {
    if (IS_MOCK) {
      await mockDelay()
      return [...settings]
    }
    const { data } = await apiClient.get<{ data: Record<string, string> }>('/settings')
    return mapToSettings(data.data)
  },

  /** Upserts several keys in one request — prefer this over calling update() in a loop when saving a whole form/tab at once. `confirmPassword` is only checked when the AppConfig-level settingsConfirmationEnabled flag is on — see ConfirmPasswordDialog / useSettingsConfirmation. */
  async updateMany(updates: Record<string, string>, confirmPassword?: string): Promise<SettingKeyValue[]> {
    if (IS_MOCK) {
      await mockDelay()
      mockVerifyConfirmationPassword(confirmPassword)
      Object.entries(updates).forEach(([key, value]) => {
        const index = settings.findIndex((s) => s.key === key)
        if (index === -1) settings.push({ id: settings.length ? Math.max(...settings.map((s) => s.id)) + 1 : 1, key, value })
        else settings[index] = { ...settings[index], value }
      })
      return [...settings]
    }
    const { data } = await apiClient.put<{ data: Record<string, string> }>('/admin/settings', { updates, confirmationPassword: confirmPassword })
    return mapToSettings(data.data)
  },

  async update(key: string, value: string, confirmPassword?: string): Promise<SettingKeyValue> {
    await this.updateMany({ [key]: value }, confirmPassword)
    return { key, value }
  },

  /** Admin-only listing (every row, active and inactive) — distinct from the public GET /payment-gateways the customer app reads, which only ever returns active ones and so can't be used to find a disabled gateway to re-enable. */
  async paymentGateways(): Promise<PaymentGateway[]> {
    if (IS_MOCK) {
      await mockDelay()
      return [...paymentGateways]
    }
    const { data } = await apiClient.get('/admin/payment-gateways')
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
    const { data } = await apiClient.patch<{ data: PaymentGateway }>(`/admin/payment-gateways/${id}`, { isActive })
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
