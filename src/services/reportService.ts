import { apiClient } from '@/lib/apiClient'
import { mockDelay } from '@/lib/mockUtils'
import { IS_MOCK } from '@/config/env'
import { orders, restaurants, items, orderStatuses, tripDetails, users } from '@/mocks/fixtures'
import type { DateRange } from '@/lib/dateRanges'

export interface ReportFilters extends DateRange {
  restaurantId?: number
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

function inRange(createdAt: string, range: DateRange): boolean {
  const dateStr = createdAt.slice(0, 10)
  if (range.from && dateStr < range.from) return false
  return dateStr <= range.to
}

function scopedOrders(filters: ReportFilters) {
  return orders.filter((o) => inRange(o.createdAt, filters) && (!filters.restaurantId || o.restaurantId === filters.restaurantId))
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
    const { data } = await apiClient.get<{ data: TopItemRow[] }>('/reports/top-items', { params: filters })
    return data.data
  },

  async revenueTrend(filters: ReportFilters): Promise<RevenuePoint[]> {
    if (IS_MOCK) {
      await mockDelay(200)
      const to = new Date(`${filters.to}T00:00:00`)
      const earliestOrder = orders.reduce<Date | null>((min, o) => {
        const d = new Date(o.createdAt)
        return !min || d < min ? d : min
      }, null)
      const from = filters.from
        ? new Date(`${filters.from}T00:00:00`)
        : earliestOrder ?? to
      // Cap at 90 daily buckets even for very wide ranges (e.g. "All time") so the chart stays legible.
      const spanDays = Math.min(90, Math.max(1, Math.round((to.getTime() - from.getTime()) / 86400000) + 1))

      const buckets = new Map<string, RevenuePoint>()
      for (let i = spanDays - 1; i >= 0; i -= 1) {
        const d = new Date(to)
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
    const { data } = await apiClient.get<{ data: { date: string; revenue: number; orders: number }[] }>('/reports/revenue-trend', { params: filters })
    return data.data.map((p) => ({
      label: new Date(`${p.date}T00:00:00`).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
      revenue: p.revenue,
      orders: p.orders,
    }))
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
    const { data } = await apiClient.get<{ data: StatusSlice[] }>('/reports/orders-by-status', { params: filters })
    return data.data
  },

  async topRestaurants(filters: DateRange, limit = 10): Promise<TopRestaurantRow[]> {
    if (IS_MOCK) {
      await mockDelay(200)
      const rows = orders.filter((o) => inRange(o.createdAt, filters))
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
    const { data } = await apiClient.get<{ data: TopRestaurantRow[] }>('/reports/top-restaurants', { params: filters })
    return data.data
  },

  async topRiders(filters: DateRange, limit = 10): Promise<TopRiderRow[]> {
    if (IS_MOCK) {
      await mockDelay(200)
      const rows = tripDetails.filter((t) => inRange(t.createdAt, filters))
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
    const { data } = await apiClient.get<{ data: TopRiderRow[] }>('/reports/top-riders', { params: filters })
    return data.data
  },
}
