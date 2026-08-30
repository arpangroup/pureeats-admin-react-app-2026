import { apiClient } from '@/lib/apiClient'
import { mockDelay } from '@/lib/mockUtils'
import { IS_MOCK } from '@/config/env'
import { orders as mockOrders } from '@/mocks/fixtures'

export interface StoreOwnerOrderSummary {
  id: number
  uniqueOrderId: string
  status: string
  restaurantId: number
  payable: number
  createdAt: string
}

/** Store-owner-scoped order actions — separate from the admin-only orderService, since a STORE_OWNER can't reach /api/v1/admin/**. */
export const storeOwnerOrderService = {
  /** Newly placed orders (status PLACED) awaiting acceptance, for one of the caller's own restaurants. */
  async newOrders(restaurantId: number): Promise<StoreOwnerOrderSummary[]> {
    if (IS_MOCK) {
      await mockDelay(150)
      return mockOrders
        .filter((o) => o.restaurantId === restaurantId && o.orderstatusId === 1)
        .map((o) => ({ id: o.id, uniqueOrderId: o.uniqueOrderId, status: 'PLACED', restaurantId: o.restaurantId, payable: o.payable, createdAt: o.createdAt }))
    }
    const { data } = await apiClient.get<{ data: StoreOwnerOrderSummary[] }>(
      `/store-owner/restaurants/${restaurantId}/orders/new`,
    )
    return data.data
  },
}
