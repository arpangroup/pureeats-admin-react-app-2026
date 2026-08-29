import { apiClient } from '@/lib/apiClient'
import { mockDelay, paginate } from '@/lib/mockUtils'
import { toPaginated, type PageResponse } from '@/lib/pageResponse'
import { IS_MOCK } from '@/config/env'
import { orders, orderStatuses, restaurants, users } from '@/mocks/fixtures'
import type { ListParams, Paginated } from '@/types/common'
import type { Order, OrderItem, OrderStatus, PaymentMode } from '@/types/entities'

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

// --- Live-mode response shapes (pureeats-order-service AdminOrderController) --------------
interface LiveOrderItemAddon {
  addonCategoryName: string
  addonName: string
  addonPrice: number
}

interface LiveOrderItem {
  id: number
  itemId: number
  name: string
  quantity: number
  price: number
  addons: LiveOrderItemAddon[]
}

interface LiveOrderDetail {
  id: number
  uniqueOrderId: string
  status: string
  orderstatusId: number
  userId: number
  restaurantId: number
  customerName: string
  restaurantName: string
  address: string
  tax: number
  restaurantCharge: number
  deliveryCharge: number
  driverTipAmount: number
  total: number
  payable: number
  paymentMode: string
  deliveryPin: string
  orderComment: string | null
  couponName: string | null
  transactionId: string | null
  deliveryType: number
  orderFrom: string
  restaurantAcceptAt: string | null
  restaurantReadyAt: string | null
  riderAcceptAt: string | null
  riderPickedAt: string | null
  riderDeliverAt: string | null
  createdAt: string
  items: LiveOrderItem[]
}

interface LiveOrderSummary {
  id: number
  uniqueOrderId: string
  status: string
  userId: number
  restaurantId: number
  customerName: string
  restaurantName: string
  itemCount: number
  total: number
  payable: number
  paymentMode: string
  couponName: string | null
  createdAt: string
}

function mapPaymentMode(mode: string): PaymentMode {
  if (mode === 'COD') return 'cod'
  if (mode === 'WALLET') return 'wallet'
  return 'online'
}

function placeholderItem(index: number, orderId: number, createdAt: string): OrderItem {
  return { id: -(index + 1), orderId, itemId: 0, name: '—', quantity: 1, price: 0, addons: [], createdAt, updatedAt: createdAt }
}

function liveSummaryToRow(row: LiveOrderSummary): OrderRow {
  const order: Order = {
    id: row.id,
    uniqueOrderId: row.uniqueOrderId,
    orderstatusId: 0,
    userId: row.userId,
    restaurantId: row.restaurantId,
    couponName: row.couponName,
    location: '',
    address: '',
    tax: 0,
    restaurantCharge: 0,
    deliveryCharge: 0,
    driverTipAmount: 0,
    total: row.total,
    payable: row.payable,
    paymentMode: mapPaymentMode(row.paymentMode),
    orderComment: null,
    transactionId: null,
    deliveryType: 'delivery',
    deliveryPin: '',
    prepareTime: 0,
    orderFrom: 'app',
    restaurantAcceptAt: null,
    restaurantReadyAt: null,
    riderAcceptAt: null,
    riderPickedAt: null,
    riderDeliverAt: null,
    deliveryGuyId: null,
    items: Array.from({ length: row.itemCount }, (_, i) => placeholderItem(i, row.id, row.createdAt)),
    createdAt: row.createdAt,
    updatedAt: row.createdAt,
  }
  return { ...order, customerName: row.customerName, restaurantName: row.restaurantName, statusName: row.status, deliveryGuyName: null }
}

function liveDetailToRow(d: LiveOrderDetail): OrderRow {
  const order: Order = {
    id: d.id,
    uniqueOrderId: d.uniqueOrderId,
    orderstatusId: d.orderstatusId,
    userId: d.userId,
    restaurantId: d.restaurantId,
    couponName: d.couponName,
    location: '',
    address: d.address,
    tax: d.tax,
    restaurantCharge: d.restaurantCharge,
    deliveryCharge: d.deliveryCharge,
    driverTipAmount: d.driverTipAmount,
    total: d.total,
    payable: d.payable,
    paymentMode: mapPaymentMode(d.paymentMode),
    orderComment: d.orderComment,
    transactionId: d.transactionId,
    deliveryType: d.deliveryType === 1 ? 'pickup' : 'delivery',
    deliveryPin: d.deliveryPin,
    prepareTime: 0,
    orderFrom: (d.orderFrom.toLowerCase() as Order['orderFrom']) ?? 'app',
    restaurantAcceptAt: d.restaurantAcceptAt,
    restaurantReadyAt: d.restaurantReadyAt,
    riderAcceptAt: d.riderAcceptAt,
    riderPickedAt: d.riderPickedAt,
    riderDeliverAt: d.riderDeliverAt,
    deliveryGuyId: null,
    items: d.items.map((item, index) => ({
      id: item.id,
      orderId: d.id,
      itemId: item.itemId,
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      addons: item.addons.map((addon, addonIndex) => ({
        id: index * 100 + addonIndex,
        orderitemId: item.id,
        addonCategoryName: addon.addonCategoryName,
        addonName: addon.addonName,
        addonPrice: addon.addonPrice,
        createdAt: d.createdAt,
        updatedAt: d.createdAt,
      })),
      createdAt: d.createdAt,
      updatedAt: d.createdAt,
    })),
    createdAt: d.createdAt,
    updatedAt: d.createdAt,
  }
  return { ...order, customerName: d.customerName, restaurantName: d.restaurantName, statusName: d.status, deliveryGuyName: null }
}

export interface OrderListParams extends ListParams {
  restaurantId?: number
  statusId?: number
}

export const orderService = {
  async statuses(): Promise<OrderStatus[]> {
    if (IS_MOCK) {
      await mockDelay(50)
      return orderStatuses
    }
    const { data } = await apiClient.get<{ data: { id: number; name: string }[] }>('/admin/order-statuses')
    return data.data as OrderStatus[]
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
    const { data } = await apiClient.get<{ data: PageResponse<LiveOrderSummary> }>('/admin/orders', {
      params: {
        restaurantId: params.restaurantId,
        statusId: params.statusId,
        search: params.search,
        page: (params.page ?? 1) - 1,
        size: params.perPage ?? 10,
      },
    })
    const paginated = toPaginated(data.data)
    return { ...paginated, data: paginated.data.map(liveSummaryToRow) }
  },

  async get(id: number): Promise<OrderRow | undefined> {
    if (IS_MOCK) {
      await mockDelay()
      const found = orders.find((o) => o.id === id)
      return found ? toRow(found) : undefined
    }
    const { data } = await apiClient.get<{ data: LiveOrderDetail }>(`/admin/orders/${id}`)
    return liveDetailToRow(data.data)
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
