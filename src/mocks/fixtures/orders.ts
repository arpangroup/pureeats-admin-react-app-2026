import type { Order, OrderItem, OrderItemAddon, OrderStatus } from '@/types/entities'
import { restaurants } from './restaurants'
import { items } from './items'
import { addons } from './items'
import { users } from './users'

export const orderStatuses: OrderStatus[] = [
  { id: 1, name: 'Placed' },
  { id: 2, name: 'Accepted' },
  { id: 3, name: 'Preparing' },
  { id: 4, name: 'Ready for Pickup' },
  { id: 5, name: 'Picked Up' },
  { id: 6, name: 'On the way' },
  { id: 7, name: 'Delivered' },
  { id: 8, name: 'Cancelled' },
  { id: 9, name: 'Rejected' },
  { id: 10, name: 'Returned' },
  { id: 11, name: 'Auto-Cancelled' },
]

const customers = users.filter((u) => u.role === 'customer')
const deliveryGuys = users.filter((u) => u.role === 'delivery-guy')
const paymentModes: Order['paymentMode'][] = ['cod', 'online', 'wallet']
const orderFroms: Order['orderFrom'][] = ['app', 'web', 'pos']

function isoMinutesAgo(minutes: number): string {
  return new Date(Date.now() - minutes * 60 * 1000).toISOString()
}

function buildOrderItems(orderId: number, restaurantId: number, seed: number): OrderItem[] {
  const restaurantItems = items.filter((item) => item.restaurantId === restaurantId)
  if (restaurantItems.length === 0) return []
  const count = (seed % 3) + 1
  const chosen = Array.from({ length: count }, (_, i) => restaurantItems[(seed + i) % restaurantItems.length])

  return chosen.map((item, index) => {
    const quantity = ((seed + index) % 3) + 1
    const orderItemId = orderId * 10 + index + 1
    const itemAddons: OrderItemAddon[] = item.addonCategoryIds.length
      ? [
          {
            id: orderItemId * 10 + 1,
            orderitemId: orderItemId,
            addonCategoryName: 'Spice Level',
            addonName: addons[(seed + index) % 3]?.name ?? 'Medium',
            addonPrice: 0,
            createdAt: isoMinutesAgo(60),
            updatedAt: isoMinutesAgo(60),
          },
        ]
      : []

    return {
      id: orderItemId,
      orderId,
      itemId: item.id,
      name: item.name,
      quantity,
      price: item.price,
      addons: itemAddons,
      createdAt: isoMinutesAgo(60),
      updatedAt: isoMinutesAgo(60),
    }
  })
}

const ORDER_COUNT = 32

export const orders: Order[] = Array.from({ length: ORDER_COUNT }, (_, i) => {
  const id = i + 1
  const restaurant = restaurants[i % restaurants.length]
  const customer = customers[i % customers.length]
  const statusIndex = i % orderStatuses.length
  const status = orderStatuses[statusIndex]
  const isTerminal =
    status.name === 'Delivered' ||
    status.name === 'Cancelled' ||
    status.name === 'Rejected' ||
    status.name === 'Returned' ||
    status.name === 'Auto-Cancelled'
  const deliveryGuy = isTerminal || statusIndex >= 4 ? deliveryGuys[i % deliveryGuys.length] : null
  const createdMinutesAgo = 20 + i * 47
  const orderItems = buildOrderItems(id, restaurant.id, i)
  const itemsTotal = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0) || 199
  const tax = Math.round(itemsTotal * 0.05)
  const deliveryCharge = restaurant.baseDeliveryCharge
  const driverTipAmount = i % 5 === 0 ? 20 : 0
  const total = itemsTotal + tax + restaurant.restaurantCharges + deliveryCharge + driverTipAmount

  return {
    id,
    uniqueOrderId: `PE${String(1000 + id)}`,
    orderstatusId: status.id,
    userId: customer?.id ?? 30,
    restaurantId: restaurant.id,
    couponName: i % 4 === 0 ? 'WELCOME50' : null,
    location: `Location #${restaurant.locationId}`,
    address: '221B, 12th Cross, Bengaluru',
    tax,
    restaurantCharge: restaurant.restaurantCharges,
    deliveryCharge,
    driverTipAmount,
    total,
    payable: total - (i % 4 === 0 ? 50 : 0),
    paymentMode: paymentModes[i % paymentModes.length],
    orderComment: i % 6 === 0 ? 'Please ring the bell twice' : null,
    transactionId: paymentModes[i % paymentModes.length] === 'cod' ? null : `TXN${900000 + id}`,
    deliveryType: i % 7 === 0 ? 'pickup' : 'delivery',
    deliveryPin: String(1000 + ((id * 37) % 9000)),
    prepareTime: 15 + (i % 4) * 5,
    orderFrom: orderFroms[i % orderFroms.length],
    restaurantAcceptAt: statusIndex >= 1 ? isoMinutesAgo(createdMinutesAgo - 3) : null,
    restaurantReadyAt: statusIndex >= 3 ? isoMinutesAgo(createdMinutesAgo - 15) : null,
    riderAcceptAt: statusIndex >= 4 ? isoMinutesAgo(createdMinutesAgo - 17) : null,
    riderPickedAt: statusIndex >= 5 ? isoMinutesAgo(createdMinutesAgo - 20) : null,
    riderDeliverAt: status.name === 'Delivered' ? isoMinutesAgo(createdMinutesAgo - 35) : null,
    deliveryGuyId: deliveryGuy?.id ?? null,
    items: orderItems,
    createdAt: isoMinutesAgo(createdMinutesAgo),
    updatedAt: isoMinutesAgo(Math.max(createdMinutesAgo - 35, 1)),
  }
})
