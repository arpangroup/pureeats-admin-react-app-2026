import { apiClient } from '@/lib/apiClient'
import { mockDelay } from '@/lib/mockUtils'
import { IS_MOCK } from '@/config/env'
import { tripDetails } from '@/mocks/fixtures'

export type SettlementDirection = 'PAID_TO_RIDER' | 'COLLECTED_FROM_RIDER' | 'EVEN'

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
}

/** netPending = pendingEarnings - cashInHand: positive -> platform pays the rider, negative -> rider pays in. */
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
}

export interface SettleRiderPayload {
  transactionMode?: string
  transactionReference?: string
  note?: string
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
    }
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
