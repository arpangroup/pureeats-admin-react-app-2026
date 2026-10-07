import { apiClient } from '@/lib/apiClient'
import { mockDelay } from '@/lib/mockUtils'
import { IS_MOCK } from '@/config/env'
import { tripDetails } from '@/mocks/fixtures'

/** BOTH = COD cash collected and earnings paid in one settlement (they're never netted). */
export type SettlementDirection = 'PAID_TO_RIDER' | 'COLLECTED_FROM_RIDER' | 'EVEN' | 'BOTH'

export interface RiderSettlement {
  id: number
  riderUserId: number
  earningsAmount: number
  codAmount: number
  netAmount: number
  direction: SettlementDirection
  tripCount: number
  transactionMode: string | null
  transactionReference: string | null
  note: string | null
  settledBy: number | null
  createdAt: string
  /** REQUESTED = partner's withdrawal waiting to be paid; PAID; REJECTED. */
  status?: 'REQUESTED' | 'PAID' | 'REJECTED'
  requestedAt?: string | null
  paidAt?: string | null
  riderName?: string | null
  /** Where to pay, e.g. "UPI ravi@okhdfcbank" or "Name · A/c 1234 · IFSC". */
  payoutTo?: string | null
}

/**
 * Two separate balances, never netted: cashInHand = COD cash the rider must hand over in full;
 * pendingEarnings = commission + tips the platform pays in full. netPending is legacy only.
 */
export interface RiderSettlementSummary {
  lifetimeEarnings: number
  lifetimeTrips: number
  pendingEarnings: number
  cashInHand: number
  netPending: number
  netDirection: SettlementDirection
  unsettledTrips: number
  settledEarnings: number
  lastSettlement: RiderSettlement | null
  /** Delivered orders not fully settled yet, and what customers paid for them. */
  openOrders: number
  openOrderValue: number
  /** COD orders whose cash the rider still holds. */
  codOrders: number
  /** Unpaid trips recorded on a different earnings basis than today's setting - see recalculate(). */
  earningsOnOldBasis: number
  /** Earnings in the wallet (pendingEarnings carries the same value). */
  walletBalance: number
  /** Withdrawal requests waiting to be paid. */
  pendingWithdrawals: number
  /** What can be paid out now: wallet balance minus requested withdrawals. */
  availableToWithdraw: number
  payoutTo: string | null
}

export interface SettleRiderPayload {
  transactionMode?: string
  transactionReference?: string
  note?: string
  /** Collect all COD cash the rider holds (default true). */
  collectCod?: boolean
  /** Pay out all pending earnings (default true). */
  payEarnings?: boolean
}

/** BigDecimal fields can arrive as a JSON number or a string. */
const toNumber = (v: unknown): number => {
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? n : 0
}

const mockSettlements: RiderSettlement[] = []
const direction = (net: number): SettlementDirection => (net > 0 ? 'PAID_TO_RIDER' : net < 0 ? 'COLLECTED_FROM_RIDER' : 'EVEN')
const round = (n: number) => Math.round(n * 100) / 100

function nSettlement(s: RiderSettlement): RiderSettlement {
  return { ...s, earningsAmount: toNumber(s.earningsAmount), codAmount: toNumber(s.codAmount), netAmount: toNumber(s.netAmount) }
}

/**
 * Admin side of rider settlement - every call takes the rider's USER id (same id the delivery
 * partner detail route and /admin/delivery-guys/{riderUserId}/earnings use).
 */
export const riderSettlementService = {
  async summary(riderUserId: number): Promise<RiderSettlementSummary> {
    if (IS_MOCK) {
      await mockDelay(150)
      const trips = tripDetails.filter((t) => t.riderId === riderUserId)
      const pending = trips.filter((t) => !t.isSettlementDone)
      const pendingEarnings = round(pending.reduce((a, t) => a + t.riderEarning, 0))
      const cashInHand = round(pending.reduce((a, t) => a + t.cashCollectedFromCustomer, 0))
      const lifetime = round(trips.reduce((a, t) => a + t.riderEarning, 0))
      const net = round(pendingEarnings - cashInHand)
      return {
        lifetimeEarnings: lifetime,
        lifetimeTrips: trips.length,
        pendingEarnings,
        cashInHand,
        netPending: net,
        netDirection: direction(net),
        unsettledTrips: pending.length,
        settledEarnings: round(lifetime - pendingEarnings),
        lastSettlement: mockSettlements.filter((s) => s.riderUserId === riderUserId)[0] ?? null,
        openOrders: pending.length,
        openOrderValue: round(pending.reduce((a, t) => a + t.riderEarning * 8, 0)),
        codOrders: pending.filter((t) => t.cashCollectedFromCustomer > 0).length,
        earningsOnOldBasis: 0,
        walletBalance: pendingEarnings,
        pendingWithdrawals: 0,
        availableToWithdraw: pendingEarnings,
        payoutTo: null,
      }
    }
    const { data } = await apiClient.get<{ data: RiderSettlementSummary }>(`/admin/delivery-guys/${riderUserId}/settlement-summary`)
    const s = data.data
    return {
      ...s,
      lifetimeEarnings: toNumber(s.lifetimeEarnings),
      pendingEarnings: toNumber(s.pendingEarnings),
      cashInHand: toNumber(s.cashInHand),
      netPending: toNumber(s.netPending),
      settledEarnings: toNumber(s.settledEarnings),
      lastSettlement: s.lastSettlement ? nSettlement(s.lastSettlement) : null,
      openOrders: s.openOrders ?? s.unsettledTrips,
      openOrderValue: toNumber(s.openOrderValue),
      codOrders: s.codOrders ?? 0,
      earningsOnOldBasis: s.earningsOnOldBasis ?? 0,
      walletBalance: toNumber(s.walletBalance ?? s.pendingEarnings),
      pendingWithdrawals: toNumber(s.pendingWithdrawals ?? 0),
      availableToWithdraw: toNumber(s.availableToWithdraw ?? s.pendingEarnings),
      payoutTo: s.payoutTo ?? null,
    }
  },

  /** Partners' withdrawal requests (default: waiting to be paid), oldest first. */
  async withdrawals(status: 'REQUESTED' | 'PAID' | 'REJECTED' = 'REQUESTED'): Promise<RiderSettlement[]> {
    if (IS_MOCK) {
      await mockDelay(150)
      return mockSettlements.filter((s) => s.status === status)
    }
    const { data } = await apiClient.get<{ data: RiderSettlement[] }>('/admin/rider-withdrawals', { params: { status } })
    return (data.data ?? []).map(nSettlement)
  },

  /** Mark a withdrawal paid after transferring it - debits the partner's wallet. */
  async payWithdrawal(id: number, transactionMode: string, transactionReference?: string): Promise<RiderSettlement> {
    if (IS_MOCK) {
      await mockDelay()
      const s = mockSettlements.find((x) => x.id === id)
      if (!s) throw { message: 'Withdrawal request not found' }
      Object.assign(s, { status: 'PAID', paidAt: new Date().toISOString(), transactionMode, transactionReference: transactionReference ?? null })
      return s
    }
    const { data } = await apiClient.post<{ data: RiderSettlement }>(`/admin/rider-withdrawals/${id}/pay`, { transactionMode, transactionReference })
    return nSettlement(data.data)
  },

  async rejectWithdrawal(id: number, reason: string): Promise<RiderSettlement> {
    if (IS_MOCK) {
      await mockDelay()
      const s = mockSettlements.find((x) => x.id === id)
      if (!s) throw { message: 'Withdrawal request not found' }
      Object.assign(s, { status: 'REJECTED', note: `Rejected: ${reason}` })
      return s
    }
    const { data } = await apiClient.post<{ data: RiderSettlement }>(`/admin/rider-withdrawals/${id}/reject`, { reason })
    return nSettlement(data.data)
  },

  /** Re-records unpaid earnings recorded on a different basis than today's setting (the wallet is adjusted). */
  async recalculate(riderUserId: number): Promise<{ trips: number; before: number; after: number }> {
    if (IS_MOCK) {
      await mockDelay()
      return { trips: 0, before: 0, after: 0 }
    }
    const { data } = await apiClient.post<{ data: { trips: number; before: number; after: number } }>(`/admin/delivery-guys/${riderUserId}/earnings/recalculate`)
    return { trips: data.data.trips, before: toNumber(data.data.before), after: toNumber(data.data.after) }
  },

  async list(riderUserId: number): Promise<RiderSettlement[]> {
    if (IS_MOCK) {
      await mockDelay(150)
      return mockSettlements.filter((s) => s.riderUserId === riderUserId)
    }
    const { data } = await apiClient.get<{ data: RiderSettlement[] }>(`/admin/delivery-guys/${riderUserId}/settlements`)
    return (data.data ?? []).map(nSettlement)
  },

  /** Settles everything the rider currently has pending. */
  async settle(riderUserId: number, payload: SettleRiderPayload): Promise<RiderSettlement> {
    if (IS_MOCK) {
      await mockDelay()
      const pending = tripDetails.filter((t) => t.riderId === riderUserId && !t.isSettlementDone)
      if (pending.length === 0) throw { message: 'This delivery partner has nothing pending to settle' }
      const earnings = round(pending.reduce((a, t) => a + t.riderEarning, 0))
      const cod = round(pending.reduce((a, t) => a + t.cashCollectedFromCustomer, 0))
      pending.forEach((t) => (t.isSettlementDone = true))
      const s: RiderSettlement = {
        id: mockSettlements.length + 1,
        riderUserId,
        earningsAmount: earnings,
        codAmount: cod,
        netAmount: round(earnings - cod),
        direction: direction(earnings - cod),
        tripCount: pending.length,
        transactionMode: payload.transactionMode ?? null,
        transactionReference: payload.transactionReference ?? null,
        note: payload.note ?? null,
        settledBy: 1,
        createdAt: new Date().toISOString(),
      }
      mockSettlements.unshift(s)
      return s
    }
    const { data } = await apiClient.post<{ data: RiderSettlement }>(`/admin/delivery-guys/${riderUserId}/settlements`, payload)
    return nSettlement(data.data)
  },
}
