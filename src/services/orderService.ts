import { apiClient } from '@/lib/apiClient'
import { mockDelay, paginate } from '@/lib/mockUtils'
import { toPaginated, type PageResponse } from '@/lib/pageResponse'
import { IS_MOCK } from '@/config/env'
import { orders, orderStatuses, restaurants, users } from '@/mocks/fixtures'
import type { ListParams, Paginated } from '@/types/common'
import type { Order, OrderItem, OrderStatus, PaymentMode } from '@/types/entities'

export interface OrderRow extends Order {
  customerName: string
  customerEmail: string | null
  customerPhone: string | null
  restaurantName: string
  restaurantPhone: string | null
  statusName: string
  deliveryGuyName: string | null
  /** Live mode only — which statuses this order may legally move to next; null in mock mode (all statuses stay selectable, as before). */
  legalNextStatuses: string[] | null
  /** Live mode only — the coupon actually applied, with its code/name/type/amount. Null if no coupon or in mock mode. */
  coupon: OrderCouponInfo | null
  /** Live mode only — how this order's charges were computed. Null if unavailable (e.g. placed before this was tracked, or in mock mode). */
  pricingBreakdown: PricingBreakdown | null
}

export interface OrderCouponInfo {
  couponId: number | null
  code: string
  name: string | null
  discountType: string | null
  discountAmount: number
}

export interface PricingBreakdown {
  itemTotal: number
  discountAmount: number
  amountAfterDiscount: number
  taxAmount: number
  taxPercentage: number
  restaurantChargeAmount: number
  restaurantChargePercentage: number
  deliveryChargeAmount: number
  deliveryChargeBasis: string
  distanceKm: number
  restaurantLatitude: string | null
  restaurantLongitude: string | null
  customerLatitude: string | null
  customerLongitude: string | null
}

export interface OrderStatusLogRow {
  id: number
  fromStatus: string | null
  toStatus: string
  actorType: string
  actorUserId: number | null
  actorName: string | null
  note: string | null
  createdAt: string
}

export interface OrderTimeline {
  placedAt: string | null
  restaurantAcceptedAt: string | null
  restaurantReadyAt: string | null
  riderAssignedAt: string | null
  pickedUpAt: string | null
  deliveredAt: string | null
  selfPickupCompletedAt: string | null
  cancelledAt: string | null
}

function toRow(order: Order): OrderRow {
  const customer = users.find((u) => u.id === order.userId)
  const restaurant = restaurants.find((r) => r.id === order.restaurantId)
  return {
    ...order,
    customerName: customer?.name ?? 'Unknown',
    customerEmail: customer?.email ?? null,
    customerPhone: customer?.phone ?? null,
    restaurantName: restaurant?.name ?? 'Unknown',
    restaurantPhone: restaurant?.contactNumber ?? null,
    statusName: orderStatuses.find((s) => s.id === order.orderstatusId)?.name ?? 'Unknown',
    deliveryGuyName: order.deliveryGuyId ? users.find((u) => u.id === order.deliveryGuyId)?.name ?? null : null,
    legalNextStatuses: null,
    coupon: order.couponName
      ? { couponId: null, code: order.couponName, name: order.couponName, discountType: null, discountAmount: 0 }
      : null,
    pricingBreakdown: null,
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

interface LiveOrderCustomer {
  id: number
  name: string
  email: string | null
  phone: string | null
}

interface LiveOrderRestaurant {
  id: number
  name: string
  contactNumber: string | null
}

interface LiveOrderCoupon {
  couponId: number | null
  code: string
  name: string | null
  discountType: string | null
  discountAmount: number
}

interface LiveOrderDetail {
  id: number
  uniqueOrderId: string
  status: string
  orderstatusId: number
  customer: LiveOrderCustomer
  restaurant: LiveOrderRestaurant
  coupon: LiveOrderCoupon | null
  items: LiveOrderItem[]
  address: string
  tax: number
  restaurantCharge: number
  deliveryCharge: number
  driverTipAmount: number
  discountAmount: number
  total: number
  payable: number
  paymentMode: string
  deliveryPin: string
  orderComment: string | null
  transactionId: string | null
  deliveryType: number
  orderFrom: string
  createdAt: string
  updatedAt: string
  legalNextStatuses: string[]
  pricingBreakdown: PricingBreakdown | null
  deliveryGuyId: number | null
  deliveryGuyName: string | null
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
  couponCode: string | null
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
    couponName: row.couponCode,
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
  return {
    ...order,
    customerName: row.customerName,
    customerEmail: null,
    customerPhone: null,
    restaurantName: row.restaurantName,
    restaurantPhone: null,
    statusName: row.status,
    deliveryGuyName: null,
    legalNextStatuses: null,
    coupon: null,
    pricingBreakdown: null,
  }
}

function liveDetailToRow(d: LiveOrderDetail): OrderRow {
  const order: Order = {
    id: d.id,
    uniqueOrderId: d.uniqueOrderId,
    orderstatusId: d.orderstatusId,
    userId: d.customer.id,
    restaurantId: d.restaurant.id,
    couponName: d.coupon?.code ?? null,
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
    restaurantAcceptAt: null,
    restaurantReadyAt: null,
    riderAcceptAt: null,
    riderPickedAt: null,
    riderDeliverAt: null,
    deliveryGuyId: d.deliveryGuyId,
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
    updatedAt: d.updatedAt,
  }
  return {
    ...order,
    customerName: d.customer.name,
    customerEmail: d.customer.email,
    customerPhone: d.customer.phone,
    restaurantName: d.restaurant.name,
    restaurantPhone: d.restaurant.contactNumber,
    statusName: d.status,
    deliveryGuyName: d.deliveryGuyName,
    legalNextStatuses: d.legalNextStatuses,
    coupon: d.coupon
      ? { couponId: d.coupon.couponId, code: d.coupon.code, name: d.coupon.name, discountType: d.coupon.discountType, discountAmount: d.coupon.discountAmount }
      : null,
    pricingBreakdown: d.pricingBreakdown,
  }
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

  /** `status` is the full selected OrderStatus row — mock mode keys off its numeric id, live mode off its name (the OrderStatusCode enum value). */
  async updateStatus(id: number, status: OrderStatus): Promise<OrderRow> {
    if (IS_MOCK) {
      await mockDelay()
      const index = orders.findIndex((o) => o.id === id)
      if (index === -1) throw { message: 'Order not found' }
      orders[index] = { ...orders[index], orderstatusId: status.id, updatedAt: new Date().toISOString() }
      return toRow(orders[index])
    }
    const { data } = await apiClient.patch<{ data: LiveOrderDetail }>(`/admin/orders/${id}/status`, { toStatus: status.name })
    return liveDetailToRow(data.data)
  },

  async journey(id: number): Promise<OrderStatusLogRow[]> {
    if (IS_MOCK) {
      await mockDelay(100)
      return []
    }
    const { data } = await apiClient.get<{ data: OrderStatusLogRow[] }>(`/admin/orders/${id}/log`)
    return data.data
  },

  /** The compact milestone view — a separate call from the order itself, derived server-side from the same journey log. */
  async timeline(id: number, order?: OrderRow): Promise<OrderTimeline> {
    if (IS_MOCK) {
      await mockDelay(100)
      return {
        placedAt: order?.createdAt ?? null,
        restaurantAcceptedAt: order?.restaurantAcceptAt ?? null,
        restaurantReadyAt: order?.restaurantReadyAt ?? null,
        riderAssignedAt: order?.riderAcceptAt ?? null,
        pickedUpAt: order?.riderPickedAt ?? null,
        deliveredAt: order?.riderDeliverAt ?? null,
        selfPickupCompletedAt: null,
        cancelledAt: null,
      }
    }
    const { data } = await apiClient.get<{ data: OrderTimeline }>(`/admin/orders/${id}/timeline`)
    return data.data
  },

  /** Admin-only — assigns a specific delivery partner to this order directly, bypassing the rider's own self-service accept flow. */
  async assignDriver(id: number, riderUserId: number): Promise<OrderRow> {
    if (IS_MOCK) {
      await mockDelay()
      const index = orders.findIndex((o) => o.id === id)
      if (index === -1) throw { message: 'Order not found' }
      orders[index] = { ...orders[index], deliveryGuyId: riderUserId, updatedAt: new Date().toISOString() }
      return toRow(orders[index])
    }
    const { data } = await apiClient.post<{ data: LiveOrderDetail }>(`/admin/orders/${id}/assign-driver`, { riderUserId })
    return liveDetailToRow(data.data)
  },
}
