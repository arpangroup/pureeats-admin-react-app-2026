import { apiClient } from '@/lib/apiClient'
import { mockDelay, paginate } from '@/lib/mockUtils'
import { IS_MOCK } from '@/config/env'
import {
  wallets,
  transactions,
  restaurantPayouts,
  restaurantEarnings,
  deliveryCollections,
  deliveryCollectionLogs,
  restaurants,
  users,
} from '@/mocks/fixtures'
import type { ListParams, Paginated } from '@/types/common'
import type {
  Transaction,
  RestaurantPayout,
  RestaurantEarning,
  DeliveryCollection,
  DeliveryCollectionLog,
} from '@/types/entities'

export interface TransactionRow extends Transaction {
  walletName: string
}

export const walletService = {
  async transactions(params: ListParams = {}): Promise<Paginated<TransactionRow>> {
    if (IS_MOCK) {
      await mockDelay()
      const rows: TransactionRow[] = transactions.map((t) => ({
        ...t,
        walletName: wallets.find((w) => w.id === t.walletId)?.name ?? 'Unknown wallet',
      }))
      return paginate(rows, params, ['walletName', 'payableType', 'uuid'])
    }
    const { data } = await apiClient.get<Paginated<TransactionRow>>('/wallet/transactions', { params })
    return data
  },
}

export interface PayoutRow extends RestaurantPayout {
  restaurantName: string
}

export const payoutService = {
  async list(params: ListParams = {}): Promise<Paginated<PayoutRow>> {
    if (IS_MOCK) {
      await mockDelay()
      const rows: PayoutRow[] = restaurantPayouts.map((p) => ({
        ...p,
        restaurantName: restaurants.find((r) => r.id === p.restaurantId)?.name ?? 'Unknown',
      }))
      return paginate(rows, params, ['restaurantName', 'status', 'transactionId'])
    }
    const { data } = await apiClient.get<Paginated<PayoutRow>>('/restaurant-payouts', { params })
    return data
  },

  async get(id: number): Promise<PayoutRow | undefined> {
    if (IS_MOCK) {
      await mockDelay()
      const found = restaurantPayouts.find((p) => p.id === id)
      return found ? { ...found, restaurantName: restaurants.find((r) => r.id === found.restaurantId)?.name ?? 'Unknown' } : undefined
    }
    const { data } = await apiClient.get<PayoutRow>(`/restaurant-payouts/${id}`)
    return data
  },

  async updateStatus(id: number, status: RestaurantPayout['status']): Promise<PayoutRow> {
    if (IS_MOCK) {
      await mockDelay()
      const index = restaurantPayouts.findIndex((p) => p.id === id)
      if (index === -1) throw { message: 'Payout not found' }
      restaurantPayouts[index] = { ...restaurantPayouts[index], status, updatedAt: new Date().toISOString() }
      const updated = restaurantPayouts[index]
      return { ...updated, restaurantName: restaurants.find((r) => r.id === updated.restaurantId)?.name ?? 'Unknown' }
    }
    const { data } = await apiClient.patch<PayoutRow>(`/restaurant-payouts/${id}/status`, { status })
    return data
  },
}

export const earningsService = {
  async forRestaurant(restaurantId: number): Promise<RestaurantEarning[]> {
    if (IS_MOCK) {
      await mockDelay()
      return restaurantEarnings.filter((e) => e.restaurantId === restaurantId)
    }
    const { data } = await apiClient.get<RestaurantEarning[]>(`/restaurants/${restaurantId}/earnings`)
    return data
  },

  async requestPayout(restaurantId: number, earningId: number): Promise<RestaurantEarning> {
    if (IS_MOCK) {
      await mockDelay()
      const index = restaurantEarnings.findIndex((e) => e.id === earningId && e.restaurantId === restaurantId)
      if (index === -1) throw { message: 'Earning record not found' }
      restaurantEarnings[index] = { ...restaurantEarnings[index], isRequested: true, updatedAt: new Date().toISOString() }
      return restaurantEarnings[index]
    }
    const { data } = await apiClient.post<RestaurantEarning>(`/restaurants/${restaurantId}/earnings/${earningId}/request-payout`)
    return data
  },
}

export interface DeliveryCollectionRow extends DeliveryCollection {
  riderName: string
}

export const deliveryCollectionService = {
  async list(params: ListParams = {}): Promise<Paginated<DeliveryCollectionRow>> {
    if (IS_MOCK) {
      await mockDelay()
      const rows: DeliveryCollectionRow[] = deliveryCollections.map((c) => ({
        ...c,
        riderName: users.find((u) => u.id === c.userId)?.name ?? 'Unknown',
      }))
      return paginate(rows, params, ['riderName'])
    }
    const { data } = await apiClient.get<Paginated<DeliveryCollectionRow>>('/delivery-collections', { params })
    return data
  },

  async logs(collectionId: number): Promise<DeliveryCollectionLog[]> {
    if (IS_MOCK) {
      await mockDelay()
      return deliveryCollectionLogs.filter((l) => l.deliveryCollectionId === collectionId)
    }
    const { data } = await apiClient.get<DeliveryCollectionLog[]>(`/delivery-collections/${collectionId}/logs`)
    return data
  },
}
