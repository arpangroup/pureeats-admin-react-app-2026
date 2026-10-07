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
  /** Restaurant delivery rates applied at order time - null on orders placed before they were recorded. */
  deliveryChargeRates?: DeliveryChargeRates | null
}

/** See the backend's DeliveryChargeRates: FIXED uses flatCharge; DYNAMIC = baseCharge + extraUnits * extraCharge, extraUnits = ceil((distance - baseDistanceKm) / extraDistanceKm). */
export interface DeliveryChargeRates {
  flatCharge: number | null
  baseCharge: number | null
  baseDistanceKm: number | null
  extraCharge: number | null
  extraDistanceKm: number | null
  extraUnits: number | null
}

/** A photo the delivery partner took of the order (at pickup or at handover). */
export interface OrderPhoto {
  id: number
  url: string
  takenAt: string
}

/** GET /admin/orders/{id}/earnings - see the backend's OrderEarningsSplitResponse. */
export interface OrderEarningsSplit {
  customerPaid: number
  taxCollected: number
  ratesFromSnapshot: boolean
  restaurant: {
    restaurantId: number
    restaurantName: string
    itemTotal: number
    commissionPercentage: number
    commissionAmount: number
    /** False = the platform default commission was used. */
    storeOwnRate: boolean
    packagingCharge: number
    amount: number
    finalized: boolean
    /** Delivered under an earlier payout rule - amount is what was recorded, not today's formula. */
    recordedUnderEarlierRule: boolean
  }
  rider: {
    assigned: boolean
    riderUserId: number | null
    riderName: string | null
    commissionRate: number | null
    /** True: the partner's own rate; false: the platform default (Settings -> Delivery Application -> Earnings). */
    ownRate: boolean
    commissionBasis: string
    commissionBase: number | null
    commissionAmount: number
    tip: number
    amount: number
    finalized: boolean
    /** Delivered, but no earning was recorded at delivery (older admin status change) - the partner was never credited. */
    notRecorded: boolean
  }
  platform: {
    /** What the platform kept from the restaurant side (items + packaging − restaurant share). */
    commission: number
    platformFee: number
    deliveryCharge: number
    riderCommission: number
    discount: number
    amount: number
  }
}

const round2 = (n: number) => Math.round(n * 100) / 100
const num = (v: unknown) => (v == null ? 0 : Number(v))

function normalizeEarnings(e: OrderEarningsSplit): OrderEarningsSplit {
  return {
    ...e,
    customerPaid: num(e.customerPaid),
    taxCollected: num(e.taxCollected),
    restaurant: {
      ...e.restaurant,
      itemTotal: num(e.restaurant.itemTotal),
      commissionPercentage: num(e.restaurant.commissionPercentage),
      commissionAmount: num(e.restaurant.commissionAmount),
      packagingCharge: num(e.restaurant.packagingCharge),
      amount: num(e.restaurant.amount),
      recordedUnderEarlierRule: !!e.restaurant.recordedUnderEarlierRule,
    },
    rider: {
      ...e.rider,
      commissionRate: e.rider.commissionRate == null ? null : num(e.rider.commissionRate),
      commissionBase: e.rider.commissionBase == null ? null : num(e.rider.commissionBase),
      commissionAmount: num(e.rider.commissionAmount),
      tip: num(e.rider.tip),
      amount: num(e.rider.amount),
      ownRate: !!e.rider.ownRate,
      notRecorded: !!e.rider.notRecorded,
    },
    platform: {
      commission: num(e.platform.commission),
      platformFee: num(e.platform.platformFee),
      deliveryCharge: num(e.platform.deliveryCharge),
      riderCommission: num(e.platform.riderCommission),
      discount: num(e.platform.discount),
      amount: num(e.platform.amount),
    },
  }
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
    pricingBreakdown: restaurant ? mockBreakdown(order, restaurant) : null,
  }
}

/** Mock-only: a pricing breakdown consistent with the fixture order and its restaurant's rates, so the order details "How this was calculated" card renders in mock mode too. */
function mockBreakdown(order: Order, restaurant: (typeof restaurants)[number]): PricingBreakdown {
  const distanceKm = 4.2
  const dynamic = restaurant.deliveryChargeType === 'dynamic'
  const extraUnits = dynamic && restaurant.extraDeliveryDistance > 0 ? Math.max(0, Math.ceil((distanceKm - restaurant.baseDeliveryDistance) / restaurant.extraDeliveryDistance)) : 0
  const deliveryCharge = dynamic ? restaurant.baseDeliveryCharge + extraUnits * restaurant.extraDeliveryCharge : restaurant.deliveryCharges
  // Back the item total out of the payable so the mock lines always add up (fixture totals aren't internally consistent).
  const afterDiscount = Math.max(0, Math.round((order.payable - order.tax - order.restaurantCharge - deliveryCharge - (order.driverTipAmount ?? 0)) * 100) / 100)
  return {
    itemTotal: afterDiscount,
    discountAmount: 0,
    amountAfterDiscount: afterDiscount,
    taxAmount: order.tax,
    taxPercentage: afterDiscount ? Math.round((order.tax / afterDiscount) * 1000) / 10 : 5,
    restaurantChargeAmount: order.restaurantCharge,
    restaurantChargePercentage: afterDiscount ? Math.round((order.restaurantCharge / afterDiscount) * 1000) / 10 : 0,
    deliveryChargeAmount: deliveryCharge,
    deliveryChargeBasis: dynamic ? 'DYNAMIC' : 'FIXED',
    distanceKm,
    restaurantLatitude: String(restaurant.latitude ?? '12.9352'),
    restaurantLongitude: String(restaurant.longitude ?? '77.6245'),
    customerLatitude: '12.9716',
    customerLongitude: '77.5946',
    deliveryChargeRates: dynamic
      ? { flatCharge: null, baseCharge: restaurant.baseDeliveryCharge, baseDistanceKm: restaurant.baseDeliveryDistance, extraCharge: restaurant.extraDeliveryCharge, extraDistanceKm: restaurant.extraDeliveryDistance, extraUnits }
      : { flatCharge: restaurant.deliveryCharges, baseCharge: null, baseDistanceKm: null, extraCharge: null, extraDistanceKm: null, extraUnits: null },
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
  platformFee?: number
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
    platformFee: d.platformFee ?? 0,
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

  /**
   * Who earns what from this order (admin only) - GET /admin/orders/{id}/earnings. Restaurant and rider
   * shares come from what was recorded at delivery when the order is fulfilled; the platform's share is
   * the remainder, so restaurant + rider + platform + tax = what the customer paid.
   */
  /** Photos of the packed order the delivery partner took at pickup - GET /admin/orders/{id}/pickup-photos. */
  async pickupPhotos(orderId: number): Promise<OrderPhoto[]> {
    if (IS_MOCK) {
      await mockDelay()
      return []
    }
    const { data } = await apiClient.get<{ data: OrderPhoto[] }>(`/admin/orders/${orderId}/pickup-photos`)
    return data.data ?? []
  },

  /** Photos the delivery partner took handing the order to the customer - GET /admin/orders/{id}/delivery-photos. */
  async deliveryPhotos(orderId: number): Promise<OrderPhoto[]> {
    if (IS_MOCK) {
      await mockDelay()
      return []
    }
    const { data } = await apiClient.get<{ data: OrderPhoto[] }>(`/admin/orders/${orderId}/delivery-photos`)
    return data.data ?? []
  },

  async earnings(order: OrderRow): Promise<OrderEarningsSplit> {
    if (IS_MOCK) {
      await mockDelay(120)
      const itemTotal = order.pricingBreakdown?.itemTotal ?? order.total
      const packaging = order.restaurantCharge
      const commissionPercentage = 15
      const commission = round2((itemTotal * commissionPercentage) / 100)
      const restaurantAmount = round2(itemTotal - commission + packaging)
      const tip = order.driverTipAmount ?? 0
      const riderCommission = order.deliveryGuyId ? round2((itemTotal * 10) / 100) : 0
      const riderAmount = round2(riderCommission + (order.deliveryGuyId ? tip : 0))
      const platformFee = order.platformFee ?? 0
      const deliveryCharge = order.pricingBreakdown?.deliveryChargeAmount ?? order.deliveryCharge
      const platformAmount = round2(order.payable - order.tax - restaurantAmount - riderAmount)
      return {
        customerPaid: order.payable,
        taxCollected: order.tax,
        ratesFromSnapshot: true,
        restaurant: { restaurantId: order.restaurantId, restaurantName: order.restaurantName, itemTotal, commissionPercentage, commissionAmount: commission, storeOwnRate: false, packagingCharge: packaging, amount: restaurantAmount, finalized: false, recordedUnderEarlierRule: false },
        rider: order.deliveryGuyId
          ? { assigned: true, riderUserId: order.deliveryGuyId, riderName: order.deliveryGuyName ?? 'Delivery partner', commissionRate: 10, ownRate: false, commissionBasis: 'FULL_ORDER', commissionBase: itemTotal, commissionAmount: riderCommission, tip, amount: riderAmount, finalized: false, notRecorded: false }
          : { assigned: false, riderUserId: null, riderName: null, commissionRate: null, ownRate: false, commissionBasis: 'FULL_ORDER', commissionBase: null, commissionAmount: 0, tip: 0, amount: 0, finalized: false, notRecorded: false },
        platform: { commission: round2(itemTotal + packaging - restaurantAmount), platformFee, deliveryCharge, riderCommission, discount: order.pricingBreakdown?.discountAmount ?? 0, amount: platformAmount },
      }
    }
    const { data } = await apiClient.get<{ data: OrderEarningsSplit }>(`/admin/orders/${order.id}/earnings`)
    return normalizeEarnings(data.data)
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
