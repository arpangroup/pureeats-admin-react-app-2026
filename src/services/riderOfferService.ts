import { apiClient } from '@/lib/apiClient'
import { IS_MOCK } from '@/config/env'
import { mockDelay } from '@/lib/mockUtils'

export interface OfferPartner {
  userId: number
  name: string
  phone: string | null
}

/**
 * WAITING (re-alerts continue), ASSIGNED, STOPPED_MAX (max alerts reached - admins were told), DISABLED (re-alerts
 * off), NOT_OFFERED (self-pickup / restaurant hasn't accepted) or ENDED (picked up, delivered, cancelled...).
 */
export type OfferState = 'WAITING' | 'ASSIGNED' | 'STOPPED_MAX' | 'DISABLED' | 'NOT_OFFERED' | 'ENDED'

export interface RiderOfferSummary {
  state: OfferState
  offerCount: number
  lastOfferAt: string | null
  /** When the next alert is due (the scheduler checks every minute, so up to a minute later); null when none will come. */
  nextOfferAt: string | null
  intervalMinutes: number
  mode: 'LIMITED' | 'UNTIL_ASSIGNED'
  maxOffers: number
  dispatchMode: 'LINKED_STORES' | 'NEARBY' | 'ALL'
  noRiderAlertedAt: string | null
  rounds: { round: number; notifiedAt: string | null; partners: OfferPartner[] }[]
  dismissals: { partner: OfferPartner; round: number; dismissedAt: string }[]
}

export interface RiderOfferOverview {
  enabled: boolean
  intervalMinutes: number
  mode: 'LIMITED' | 'UNTIL_ASSIGNED'
  maxOffers: number
  dispatchMode: 'LINKED_STORES' | 'NEARBY' | 'ALL'
  lastRunAt: string | null
  nextRunAt: string | null
  recentRuns: { ranAt: string; enabled: boolean; waitingOrders: number; reoffered: number; partnersAlerted: number; adminAlerts: number; reofferedOrders: string[] }[]
  waitingOrders: { orderId: number; uniqueOrderId: string; restaurantName: string; status: string; payable: number; paymentMode: string; placedAt: string; alerts: RiderOfferSummary }[]
}

const EMPTY_SUMMARY: RiderOfferSummary = {
  state: 'NOT_OFFERED', offerCount: 0, lastOfferAt: null, nextOfferAt: null, intervalMinutes: 2, mode: 'LIMITED', maxOffers: 5,
  dispatchMode: 'LINKED_STORES', noRiderAlertedAt: null, rounds: [], dismissals: [],
}

/** Delivery partner alerts for new orders: who was told, who dismissed, and the re-offer scheduler (see the backend's RiderOfferService). */
export const riderOfferService = {
  async forOrder(orderId: number): Promise<RiderOfferSummary> {
    if (IS_MOCK) {
      await mockDelay()
      return EMPTY_SUMMARY
    }
    const { data } = await apiClient.get<{ data: RiderOfferSummary }>(`/admin/orders/${orderId}/rider-offers`)
    return data.data
  },

  async overview(): Promise<RiderOfferOverview> {
    if (IS_MOCK) {
      await mockDelay()
      return { enabled: true, intervalMinutes: 2, mode: 'LIMITED', maxOffers: 5, dispatchMode: 'LINKED_STORES', lastRunAt: null, nextRunAt: null, recentRuns: [], waitingOrders: [] }
    }
    const { data } = await apiClient.get<{ data: RiderOfferOverview }>('/admin/rider-offers')
    return data.data
  },
}
