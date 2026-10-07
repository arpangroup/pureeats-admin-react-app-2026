import { apiClient } from '@/lib/apiClient'
import { mockDelay } from '@/lib/mockUtils'
import { IS_MOCK } from '@/config/env'
import { orders as mockOrders, orderStatuses as mockOrderStatuses } from '@/mocks/fixtures'

export interface StoreOwnerOrderSummary {
  id: number
  uniqueOrderId: string
  status: string
  restaurantId: number
  total: number
  createdAt: string
  deliveryGuyName: string | null
  /** The customer's note for the order, or null. */
  orderComment?: string | null
}

const RUNNING_STATUS_NAMES = ['Accepted', 'Preparing', 'Ready for Pickup', 'Rider Assigned', 'Picked Up', 'On the way', 'Arrived']

function toSummary(o: (typeof mockOrders)[number]): StoreOwnerOrderSummary {
  return {
    id: o.id,
    uniqueOrderId: o.uniqueOrderId,
    status: mockOrderStatuses.find((s) => s.id === o.orderstatusId)?.name ?? 'Unknown',
    restaurantId: o.restaurantId,
    total: o.total,
    createdAt: o.createdAt,
    deliveryGuyName: null,
    orderComment: o.orderComment ?? null,
  }
}

/**
 * Store-owner-scoped order workflow — separate from the admin-only orderService, since a
 * STORE_OWNER can't reach /api/v1/admin/**. The backend only exposes two fixed buckets (new /
 * running) plus four action verbs, not a generic filterable/searchable list or an arbitrary
 * status change — see StoreOwnerOrderController on the backend.
 */
export const storeOwnerOrderService = {
  /** Newly placed orders (status PLACED) awaiting acceptance, for one of the caller's own restaurants. */
  async newOrders(restaurantId: number): Promise<StoreOwnerOrderSummary[]> {
    if (IS_MOCK) {
      await mockDelay(150)
      return mockOrders.filter((o) => o.restaurantId === restaurantId && o.orderstatusId === 1).map(toSummary)
    }
    const { data } = await apiClient.get<{ data: StoreOwnerOrderSummary[] }>(`/store-owner/restaurants/${restaurantId}/orders/new`)
    return data.data
  },

  /** Orders currently in progress (accepted through picked-up), for one of the caller's own restaurants. */
  async runningOrders(restaurantId: number): Promise<StoreOwnerOrderSummary[]> {
    if (IS_MOCK) {
      await mockDelay(150)
      return mockOrders
        .filter((o) => o.restaurantId === restaurantId && RUNNING_STATUS_NAMES.includes(mockOrderStatuses.find((s) => s.id === o.orderstatusId)?.name ?? ''))
        .map(toSummary)
    }
    const { data } = await apiClient.get<{ data: StoreOwnerOrderSummary[] }>(`/store-owner/restaurants/${restaurantId}/orders/running`)
    return data.data
  },

  async accept(restaurantId: number, orderId: number): Promise<void> {
    if (IS_MOCK) {
      await mockDelay()
      const i = mockOrders.findIndex((o) => o.id === orderId)
      if (i !== -1) mockOrders[i] = { ...mockOrders[i], orderstatusId: 2 }
      return
    }
    await apiClient.post(`/store-owner/restaurants/${restaurantId}/orders/${orderId}/accept`)
  },

  async markReady(restaurantId: number, orderId: number): Promise<void> {
    if (IS_MOCK) {
      await mockDelay()
      const i = mockOrders.findIndex((o) => o.id === orderId)
      if (i !== -1) mockOrders[i] = { ...mockOrders[i], orderstatusId: 4 }
      return
    }
    await apiClient.post(`/store-owner/restaurants/${restaurantId}/orders/${orderId}/ready`)
  },

  async selfPickupComplete(restaurantId: number, orderId: number): Promise<void> {
    if (IS_MOCK) {
      await mockDelay()
      const i = mockOrders.findIndex((o) => o.id === orderId)
      if (i !== -1) mockOrders[i] = { ...mockOrders[i], orderstatusId: 7 }
      return
    }
    await apiClient.post(`/store-owner/restaurants/${restaurantId}/orders/${orderId}/self-pickup-complete`)
  },

  async cancel(restaurantId: number, orderId: number): Promise<void> {
    if (IS_MOCK) {
      await mockDelay()
      const i = mockOrders.findIndex((o) => o.id === orderId)
      if (i !== -1) mockOrders[i] = { ...mockOrders[i], orderstatusId: 8 }
      return
    }
    await apiClient.post(`/store-owner/restaurants/${restaurantId}/orders/${orderId}/cancel`)
  },
}
