import { apiClient } from '@/lib/apiClient'
import { mockDelay, nextMockId, paginate } from '@/lib/mockUtils'
import { toPaginated, type PageResponse } from '@/lib/pageResponse'
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
  DeliveryCollection,
  DeliveryCollectionLog,
  Wallet,
} from '@/types/entities'

export interface TransactionRow extends Transaction {
  walletName: string
  walletHolderType: string
  walletHolderId: Id
}

export const walletService = {
  async transactions(params: ListParams = {}): Promise<Paginated<TransactionRow>> {
    if (IS_MOCK) {
      await mockDelay()
      const rows: TransactionRow[] = transactions.map((t) => {
        const wallet = wallets.find((w) => w.id === t.walletId)
        return {
          ...t,
          walletName: wallet?.name ?? 'Unknown wallet',
          walletHolderType: wallet?.holderType ?? '',
          walletHolderId: wallet?.holderId ?? 0,
        }
      })
      return paginate(rows, params, ['walletName', 'payableType', 'uuid'])
    }
    const { data } = await apiClient.get<{ data: PageResponse<TransactionRow> }>('/admin/wallet/transactions', {
      params: { page: (params.page ?? 1) - 1, size: params.perPage ?? 10 },
    })
    return toPaginated(data.data)
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
    const { data } = await apiClient.get<{ data: Wallet }>('/admin/wallet', { params: { holderType, holderId } })
    return data.data
  },

  async transactionsForWallet(walletId: Id): Promise<Transaction[]> {
    if (IS_MOCK) {
      await mockDelay(150)
      return transactions.filter((t) => t.walletId === walletId).sort((a, b) => b.id - a.id)
    }
    const { data } = await apiClient.get<{ data: Transaction[] }>(`/admin/wallet/${walletId}/transactions`)
    return data.data
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
    const { data } = await apiClient.post<{ data: Wallet }>(`/admin/wallet/${walletId}/adjust`, { type, amount, message })
    return data.data
  },
}

export interface PayoutRow extends RestaurantPayout {
  restaurantName: string
}

export const payoutService = {
  /** `params.filters.restaurantId`, when set, scopes this to one restaurant's payout history (e.g. the admin restaurant detail page) instead of every payout platform-wide. */
  async list(params: ListParams = {}): Promise<Paginated<PayoutRow>> {
    const restaurantIdFilter = params.filters?.restaurantId
    if (IS_MOCK) {
      await mockDelay()
      let rows: PayoutRow[] = restaurantPayouts.map((p) => ({
        ...p,
        restaurantName: restaurants.find((r) => r.id === p.restaurantId)?.name ?? 'Unknown',
      }))
      if (restaurantIdFilter !== undefined) rows = rows.filter((r) => r.restaurantId === Number(restaurantIdFilter))
      return paginate(rows, params, ['restaurantName', 'status', 'transactionId'])
    }
    const { data } = await apiClient.get<{ data: PageResponse<PayoutRow> }>('/admin/restaurant-payouts', {
      params: { restaurantId: restaurantIdFilter, page: (params.page ?? 1) - 1, size: params.perPage ?? 10 },
    })
    return toPaginated(data.data)
  },

  async get(id: number): Promise<PayoutRow | undefined> {
    if (IS_MOCK) {
      await mockDelay()
      const found = restaurantPayouts.find((p) => p.id === id)
      return found ? { ...found, restaurantName: restaurants.find((r) => r.id === found.restaurantId)?.name ?? 'Unknown' } : undefined
    }
    const { data } = await apiClient.get<{ data: PayoutRow }>(`/admin/restaurant-payouts/${id}`)
    return data.data
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
    const { data } = await apiClient.patch<{ data: PayoutRow }>(`/admin/restaurant-payouts/${id}/status`, { status })
    return data.data
  },
}

/**
 * Store-owner-scoped earnings — hits /store-owner/restaurants/{id}/earnings, not the old
 * /restaurants/{id}/earnings path (which doesn't exist on the backend at all). The backend models
 * this as a single unsettled balance for the whole restaurant (StoreOwnerEarningsController), not
 * a list of discrete earning rows with a per-row payout request — {@link RestaurantEarning} and
 * the old per-row API shape above don't match what the backend actually offers.
 */
export const earningsService = {
  async unsettledBalance(restaurantId: number): Promise<number> {
    if (IS_MOCK) {
      await mockDelay()
      return restaurantEarnings.filter((e) => e.restaurantId === restaurantId && !e.isProcessed).reduce((sum, e) => sum + e.amount, 0)
    }
    const { data } = await apiClient.get<{ data: number }>(`/store-owner/restaurants/${restaurantId}/earnings`)
    return data.data
  },

  async requestPayout(restaurantId: number): Promise<void> {
    if (IS_MOCK) {
      await mockDelay()
      restaurantEarnings.forEach((e, i) => {
        if (e.restaurantId === restaurantId && !e.isProcessed) restaurantEarnings[i] = { ...e, isRequested: true, updatedAt: new Date().toISOString() }
      })
      return
    }
    await apiClient.post(`/store-owner/restaurants/${restaurantId}/earnings/payout-request`)
  },

  /** This restaurant's past payout requests (pending/processing/paid/rejected), newest first. */
  async payoutHistory(restaurantId: number, params: ListParams = {}): Promise<Paginated<RestaurantPayout>> {
    if (IS_MOCK) {
      await mockDelay()
      const rows = restaurantPayouts.filter((p) => p.restaurantId === restaurantId)
      return paginate(rows, params, ['status', 'transactionId'])
    }
    const { data } = await apiClient.get<{ data: PageResponse<RestaurantPayout> }>(`/store-owner/restaurants/${restaurantId}/earnings/payouts`, {
      params: { page: (params.page ?? 1) - 1, size: params.perPage ?? 10 },
    })
    return toPaginated(data.data)
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
    const { data } = await apiClient.get<{ data: PageResponse<DeliveryCollectionRow> }>('/admin/delivery-collections', {
      params: { page: (params.page ?? 1) - 1, size: params.perPage ?? 10 },
    })
    return toPaginated(data.data)
  },

  async logs(collectionId: number): Promise<DeliveryCollectionLog[]> {
    if (IS_MOCK) {
      await mockDelay()
      return deliveryCollectionLogs.filter((l) => l.deliveryCollectionId === collectionId)
    }
    const { data } = await apiClient.get<{ data: DeliveryCollectionLog[] }>(`/admin/delivery-collections/${collectionId}/logs`)
    return data.data
  },
}
