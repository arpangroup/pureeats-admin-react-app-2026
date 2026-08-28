import { apiClient } from '@/lib/apiClient'
import { mockDelay } from '@/lib/mockUtils'
import { IS_MOCK } from '@/config/env'
import { settings, paymentGateways, smsGateways } from '@/mocks/fixtures'
import type { PaymentGateway, Setting, SmsGateway } from '@/types/entities'

export const settingsService = {
  async getAll(): Promise<Setting[]> {
    if (IS_MOCK) {
      await mockDelay()
      return [...settings]
    }
    const { data } = await apiClient.get<Setting[]>('/settings')
    return data
  },

  async update(key: string, value: string): Promise<Setting> {
    if (IS_MOCK) {
      await mockDelay()
      const index = settings.findIndex((s) => s.key === key)
      if (index === -1) throw { message: `Unknown setting: ${key}` }
      settings[index] = { ...settings[index], value }
      return settings[index]
    }
    const { data } = await apiClient.put<Setting>(`/settings/${key}`, { value })
    return data
  },

  async paymentGateways(): Promise<PaymentGateway[]> {
    if (IS_MOCK) {
      await mockDelay()
      return [...paymentGateways]
    }
    const { data } = await apiClient.get<PaymentGateway[]>('/payment-gateways')
    return data
  },

  async togglePaymentGateway(id: number, isActive: boolean): Promise<PaymentGateway> {
    if (IS_MOCK) {
      await mockDelay()
      const index = paymentGateways.findIndex((g) => g.id === id)
      if (index === -1) throw { message: 'Gateway not found' }
      paymentGateways[index] = { ...paymentGateways[index], isActive }
      return paymentGateways[index]
    }
    const { data } = await apiClient.patch<PaymentGateway>(`/payment-gateways/${id}`, { isActive })
    return data
  },

  async smsGateways(): Promise<SmsGateway[]> {
    if (IS_MOCK) {
      await mockDelay()
      return [...smsGateways]
    }
    const { data } = await apiClient.get<SmsGateway[]>('/sms-gateways')
    return data
  },
}
