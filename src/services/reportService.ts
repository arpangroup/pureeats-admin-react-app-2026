import { apiClient } from '@/lib/apiClient'
import { mockDelay } from '@/lib/mockUtils'
import { IS_MOCK } from '@/config/env'
import { orders, restaurants, items, orderStatuses, tripDetails, users } from '@/mocks/fixtures'

export interface ReportFilters {
  restaurantId?: number
  days: number
}

export interface TopItemRow {
  itemId: number
  name: string
  restaurantName: string
  quantity: number
  revenue: number
}

export interface RevenuePoint {
  label: string
  revenue: number
  orders: number
}

export interface StatusSlice {
  name: string
  value: number
}

export interface TopRestaurantRow {
  restaurantId: number
  name: string
  revenue: number
  orders: number
}

export interface TopRiderRow {
  riderId: number
  name: string
  deliveries: number
  earnings: number
}

function inRange(createdAt: string, days: number): boolean {
  const daysAgo = Math.floor((Date.now() - new Date(createdAt).getTime()) / 86400000)
  return daysAgo >= 0 && daysAgo < days
}

function scopedOrders(filters: ReportFilters) {
  return orders.filter((o) => inRange(o.createdAt, filters.days) && (!filters.restaurantId || o.restaurantId === filters.restaurantId))
}

export const reportService = {
  async topItems(filters: ReportFilters, limit = 10): Promise<TopItemRow[]> {
    if (IS_MOCK) {
      await mockDelay(200)
      const totals = new Map<number, TopItemRow>()
      scopedOrders(filters).forEach((order) => {
        order.items.forEach((oi) => {
          const existing = totals.get(oi.itemId)
          const item = items.find((i) => i.id === oi.itemId)
          const restaurant = restaurants.find((r) => r.id === order.restaurantId)
          if (existing) {
            existing.quantity += oi.quantity
            existing.revenue += oi.price * oi.quantity
          } else {
            totals.set(oi.itemId, {
              itemId: oi.itemId,
              name: item?.name ?? oi.name,
              restaurantName: restaurant?.name ?? 'Unknown',
              quantity: oi.quantity,
              revenue: oi.price * oi.quantity,
            })
          }
        })
      })
      return Array.from(totals.values())
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, limit)
    }
    const { data } = await apiClient.get<TopItemRow[]>('/reports/top-items', { params: filters })
    return data
  },

  async revenueTrend(filters: ReportFilters): Promise<RevenuePoint[]> {
    if (IS_MOCK) {
      await mockDelay(200)
      const buckets = new Map<string, RevenuePoint>()
      const now = new Date()
      for (let i = filters.days - 1; i >= 0; i -= 1) {
        const d = new Date(now)
        d.setDate(d.getDate() - i)
        const label = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
        buckets.set(label, { label, revenue: 0, orders: 0 })
      }
      scopedOrders(filters).forEach((order) => {
        const label = new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
        const bucket = buckets.get(label)
        if (bucket) {
          bucket.revenue += order.total
          bucket.orders += 1
        }
      })
      return Array.from(buckets.values())
    }
    const { data } = await apiClient.get<RevenuePoint[]>('/reports/revenue-trend', { params: filters })
    return data
  },

  async ordersByStatus(filters: ReportFilters): Promise<StatusSlice[]> {
    if (IS_MOCK) {
      await mockDelay(200)
      const rows = scopedOrders(filters)
      return orderStatuses.map((s) => ({
        name: s.name,
        value: rows.filter((o) => o.orderstatusId === s.id).length,
      }))
    }
    const { data } = await apiClient.get<StatusSlice[]>('/reports/orders-by-status', { params: filters })
    return data
  },

  async topRestaurants(filters: Pick<ReportFilters, 'days'>, limit = 10): Promise<TopRestaurantRow[]> {
    if (IS_MOCK) {
      await mockDelay(200)
      const rows = orders.filter((o) => inRange(o.createdAt, filters.days))
      return restaurants
        .map((r) => ({
          restaurantId: r.id,
          name: r.name,
          revenue: rows.filter((o) => o.restaurantId === r.id).reduce((sum, o) => sum + o.total, 0),
          orders: rows.filter((o) => o.restaurantId === r.id).length,
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, limit)
    }
    const { data } = await apiClient.get<TopRestaurantRow[]>('/reports/top-restaurants', { params: filters })
    return data
  },

  async topRiders(filters: Pick<ReportFilters, 'days'>, limit = 10): Promise<TopRiderRow[]> {
    if (IS_MOCK) {
      await mockDelay(200)
      const rows = tripDetails.filter((t) => inRange(t.createdAt, filters.days))
      const totals = new Map<number, TopRiderRow>()
      rows.forEach((t) => {
        const existing = totals.get(t.riderId)
        const rider = users.find((u) => u.id === t.riderId)
        if (existing) {
          existing.deliveries += 1
          existing.earnings += t.riderEarning
        } else {
          totals.set(t.riderId, { riderId: t.riderId, name: rider?.name ?? `Rider #${t.riderId}`, deliveries: 1, earnings: t.riderEarning })
        }
      })
      return Array.from(totals.values())
        .sort((a, b) => b.earnings - a.earnings)
        .slice(0, limit)
    }
    const { data } = await apiClient.get<TopRiderRow[]>('/reports/top-riders', { params: filters })
    return data
  },
}
