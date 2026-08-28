import { useEffect, useState } from 'react'
import { Clock, ShoppingBag, Star, Wallet } from 'lucide-react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatCard } from '@/components/ui/StatCard'
import { LoadingBlock, EmptyState } from '@/components/ui/Feedback'
import { Select } from '@/components/ui/FormControls'
import { useAsync } from '@/hooks/useAsync'
import { useAuth } from '@/hooks/useAuth'
import { dashboardService } from '@/services/dashboardService'
import { restaurantService } from '@/services/restaurantService'
import { formatCurrency, formatDate } from '@/lib/format'

export default function OwnerDashboardPage() {
  const { user } = useAuth()
  const { data: restaurantPage, isLoading: loadingRestaurants } = useAsync(
    () => restaurantService.listByOwner(user!.id, { perPage: 50 }),
    [user?.id],
  )
  const restaurants = restaurantPage?.data ?? []
  const [restaurantId, setRestaurantId] = useState<number | null>(null)

  useEffect(() => {
    if (!restaurantId && restaurants.length > 0) setRestaurantId(restaurants[0].id)
  }, [restaurants, restaurantId])

  const { data, isLoading } = useAsync(
    () => (restaurantId ? dashboardService.restaurantOwner(restaurantId) : Promise.resolve(null)),
    [restaurantId],
  )

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="How your restaurant is performing on PureEats."
        actions={
          restaurants.length > 1 ? (
            <Select value={restaurantId ?? ''} onChange={(e) => setRestaurantId(Number(e.target.value))} className="w-56">
              {restaurants.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </Select>
          ) : undefined
        }
      />

      {loadingRestaurants || isLoading ? (
        <LoadingBlock />
      ) : restaurants.length === 0 ? (
        <EmptyState title="No restaurant assigned" description="Ask an admin to link a restaurant to your account." />
      ) : !data ? null : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Total Orders" value={String(data.totalOrders)} icon={ShoppingBag} tone="brand" />
            <StatCard label="Total Revenue" value={formatCurrency(data.totalRevenue)} icon={Wallet} tone="green" />
            <StatCard label="Pending Orders" value={String(data.pendingOrders)} icon={Clock} tone="amber" />
            <StatCard label="Average Rating" value={data.avgRating.toFixed(1)} icon={Star} tone="blue" />
          </div>

          <div className="card p-4">
            <h2 className="mb-4 text-sm font-semibold text-slate-700">Orders &amp; revenue — last 14 days</h2>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={data.trend}>
                <defs>
                  <linearGradient id="ownerRevenueFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f2612c" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#f2612c" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={40} />
                <Tooltip formatter={(value: number, name) => (name === 'revenue' ? formatCurrency(value) : value)} />
                <Area type="monotone" dataKey="revenue" stroke="#f2612c" fill="url(#ownerRevenueFill)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="card p-4">
            <h2 className="mb-3 text-sm font-semibold text-slate-700">Recent orders</h2>
            <div className="divide-y divide-slate-100">
              {data.recentOrders.length === 0 && <EmptyState title="No orders yet" />}
              {data.recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between py-2.5 text-sm">
                  <div>
                    <p className="font-medium text-slate-700">{order.uniqueOrderId}</p>
                    <p className="text-xs text-slate-400">{order.customerName} · {order.statusName}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-slate-700">{formatCurrency(order.total)}</p>
                    <p className="text-xs text-slate-400">{formatDate(order.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
