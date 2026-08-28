import { apiClient } from '@/lib/apiClient'
import { mockDelay, paginate } from '@/lib/mockUtils'
import { IS_MOCK } from '@/config/env'
import { orders, orderStatuses, restaurants, users } from '@/mocks/fixtures'
import type { ListParams, Paginated } from '@/types/common'
import type { Order, OrderStatus } from '@/types/entities'

export interface OrderRow extends Order {
  customerName: string
  restaurantName: string
  statusName: string
  deliveryGuyName: string | null
}

function toRow(order: Order): OrderRow {
  return {
    ...order,
    customerName: users.find((u) => u.id === order.userId)?.name ?? 'Unknown',
    restaurantName: restaurants.find((r) => r.id === order.restaurantId)?.name ?? 'Unknown',
    statusName: orderStatuses.find((s) => s.id === order.orderstatusId)?.name ?? 'Unknown',
    deliveryGuyName: order.deliveryGuyId ? users.find((u) => u.id === order.deliveryGuyId)?.name ?? null : null,
  }
}

export interface OrderListParams extends ListParams {
  restaurantId?: number
  statusId?: number
}

export const orderService = {
  statuses(): OrderStatus[] {
    return orderStatuses
  },

  async list(params: OrderListParams = {}): Promise<Paginated<OrderRow>> {
    if (IS_MOCK) {
      await mockDelay()
      let rows = orders
      if (params.restaurantId) rows = rows.filter((o) => o.restaurantId === params.restaurantId)
      if (params.statusId) rows = rows.filter((o) => o.orderstatusId === params.statusId)
      const mapped = rows.map(toRow).sort((a, b) => b.id - a.id)
      return paginate(mapped, { ...params, filters: {} }, ['uniqueOrderId', 'customerName', 'restaurantName'])
    }
    const { data } = await apiClient.get<Paginated<OrderRow>>('/orders', { params })
    return data
  },

  async get(id: number): Promise<OrderRow | undefined> {
    if (IS_MOCK) {
      await mockDelay()
      const found = orders.find((o) => o.id === id)
      return found ? toRow(found) : undefined
    }
    const { data } = await apiClient.get<OrderRow>(`/orders/${id}`)
    return data
  },

  async updateStatus(id: number, orderstatusId: number): Promise<OrderRow> {
    if (IS_MOCK) {
      await mockDelay()
      const index = orders.findIndex((o) => o.id === id)
      if (index === -1) throw { message: 'Order not found' }
      orders[index] = { ...orders[index], orderstatusId, updatedAt: new Date().toISOString() }
      return toRow(orders[index])
    }
    const { data } = await apiClient.patch<OrderRow>(`/orders/${id}/status`, { orderstatusId })
    return data
  },
}
