import { apiClient } from '@/lib/apiClient'
import { mockDelay, nextMockId, paginate } from '@/lib/mockUtils'
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
import type { ListParams, Paginated, Id } from '@/types/common'
import type {
  Transaction,
  RestaurantPayout,
  RestaurantEarning,
  DeliveryCollection,
  DeliveryCollectionLog,
  Wallet,
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

  /** Looks up (or lazily creates) the wallet for a given holder — e.g. a User. */
  async forHolder(holderType: string, holderId: Id, holderName: string): Promise<Wallet> {
    if (IS_MOCK) {
      await mockDelay(150)
      const existing = wallets.find((w) => w.holderType === holderType && w.holderId === holderId)
      if (existing) return existing
      const now = new Date().toISOString()
      const created: Wallet = {
        id: nextMockId(),
        holderType,
        holderId,
        name: holderName,
        slug: holderName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        description: `${holderType} wallet`,
        balance: 0,
        decimalPlaces: 2,
        createdAt: now,
        updatedAt: now,
      }
      wallets.push(created)
      return created
    }
    const { data } = await apiClient.get<Wallet>('/wallet', { params: { holderType, holderId } })
    return data
  },

  async transactionsForWallet(walletId: Id): Promise<Transaction[]> {
    if (IS_MOCK) {
      await mockDelay(150)
      return transactions.filter((t) => t.walletId === walletId).sort((a, b) => b.id - a.id)
    }
    const { data } = await apiClient.get<Transaction[]>(`/wallet/${walletId}/transactions`)
    return data
  },

  /** Credits or debits a wallet and logs the matching transaction — the admin-initiated
   * counterpart to order-driven wallet changes elsewhere in the mock dataset. */
  async adjustBalance(walletId: Id, type: 'credit' | 'debit', amount: number, message: string): Promise<Wallet> {
    if (IS_MOCK) {
      await mockDelay()
      const index = wallets.findIndex((w) => w.id === walletId)
      if (index === -1) throw { message: 'Wallet not found' }
      const now = new Date().toISOString()
      wallets[index] = {
        ...wallets[index],
        balance: type === 'credit' ? wallets[index].balance + amount : wallets[index].balance - amount,
        updatedAt: now,
      }
      const txn: Transaction = {
        id: nextMockId(),
        payableType: 'AdminAdjustment',
        payableId: walletId,
        walletId,
        type,
        amount,
        confirmed: true,
        meta: { reason: message },
        uuid: `txn-uuid-${nextMockId()}`,
        createdAt: now,
        updatedAt: now,
      }
      transactions.unshift(txn)
      return wallets[index]
    }
    const { data } = await apiClient.post<Wallet>(`/wallet/${walletId}/adjust`, { type, amount, message })
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
