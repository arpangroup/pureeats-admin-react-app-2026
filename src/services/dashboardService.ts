import { apiClient } from '@/lib/apiClient'
import { mockDelay } from '@/lib/mockUtils'
import { IS_MOCK } from '@/config/env'
import { orders, orderStatuses, restaurants, users, deliveryGuyDetails, ratings } from '@/mocks/fixtures'
import { orderService, type OrderRow } from './orderService'

export interface TrendPoint {
  label: string
  orders: number
  revenue: number
}

export interface AdminDashboardStats {
  totalOrders: number
  totalRevenue: number
  activeRestaurants: number
  totalRestaurants: number
  totalCustomers: number
  onlineRiders: number
  totalRiders: number
  avgRating: number
  ordersByStatus: { name: string; value: number }[]
  trend: TrendPoint[]
  recentOrders: OrderRow[]
  topRestaurants: { name: string; revenue: number; orders: number }[]
}

export interface OwnerDashboardStats {
  totalOrders: number
  totalRevenue: number
  pendingOrders: number
  avgRating: number
  trend: TrendPoint[]
  recentOrders: OrderRow[]
}

function buildTrend(days: number, filterRestaurantId?: number): TrendPoint[] {
  const buckets = new Map<string, TrendPoint>()
  const now = new Date()

  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const label = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
    buckets.set(label, { label, orders: 0, revenue: 0 })
  }

  orders
    .filter((o) => !filterRestaurantId || o.restaurantId === filterRestaurantId)
    .forEach((order) => {
      const created = new Date(order.createdAt)
      const daysAgo = Math.floor((now.getTime() - created.getTime()) / 86400000)
      if (daysAgo < 0 || daysAgo >= days) return
      const label = created.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
      const bucket = buckets.get(label)
      if (bucket) {
        bucket.orders += 1
        bucket.revenue += order.total
      }
    })

  return Array.from(buckets.values())
}

export const dashboardService = {
  async admin(): Promise<AdminDashboardStats> {
    if (IS_MOCK) {
      await mockDelay()
      const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0)
      const ordersByStatus = orderStatuses.map((status) => ({
        name: status.name,
        value: orders.filter((o) => o.orderstatusId === status.id).length,
      }))
      const restaurantRevenue = restaurants.map((r) => ({
        name: r.name,
        revenue: orders.filter((o) => o.restaurantId === r.id).reduce((sum, o) => sum + o.total, 0),
        orders: orders.filter((o) => o.restaurantId === r.id).length,
      }))
      const recent = await orderService.list({ page: 1, perPage: 6 })
      const avgRating = ratings.length ? ratings.reduce((s, r) => s + r.rating, 0) / ratings.length : 0

      return {
        totalOrders: orders.length,
        totalRevenue,
        activeRestaurants: restaurants.filter((r) => r.isActive).length,
        totalRestaurants: restaurants.length,
        totalCustomers: users.filter((u) => u.role === 'customer').length,
        onlineRiders: deliveryGuyDetails.filter((d) => d.isOnline).length,
        totalRiders: deliveryGuyDetails.length,
        avgRating,
        ordersByStatus,
        trend: buildTrend(14),
        recentOrders: recent.data,
        topRestaurants: restaurantRevenue.sort((a, b) => b.revenue - a.revenue).slice(0, 5),
      }
    }
    const { data } = await apiClient.get<AdminDashboardStats>('/dashboard/admin')
    return data
  },

  async restaurantOwner(restaurantId: number): Promise<OwnerDashboardStats> {
    if (IS_MOCK) {
      await mockDelay()
      const mine = orders.filter((o) => o.restaurantId === restaurantId)
      const pendingStatusIds = orderStatuses
        .filter((s) => !['Delivered', 'Cancelled', 'Rejected'].includes(s.name))
        .map((s) => s.id)
      const recent = await orderService.list({ restaurantId, page: 1, perPage: 6 })
      const myRatings = ratings.filter((r) => r.rateableType === 'restaurant' && r.rateableId === restaurantId)

      return {
        totalOrders: mine.length,
        totalRevenue: mine.reduce((sum, o) => sum + o.total, 0),
        pendingOrders: mine.filter((o) => pendingStatusIds.includes(o.orderstatusId)).length,
        avgRating: myRatings.length ? myRatings.reduce((s, r) => s + r.rating, 0) / myRatings.length : 0,
        trend: buildTrend(14, restaurantId),
        recentOrders: recent.data,
      }
    }
    const { data } = await apiClient.get<OwnerDashboardStats>(`/dashboard/restaurant-owner/${restaurantId}`)
    return data
  },
}
