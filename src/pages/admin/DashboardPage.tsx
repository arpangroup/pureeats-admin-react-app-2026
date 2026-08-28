import { Bike, ShoppingBag, Star, Store, Users, Wallet } from 'lucide-react'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatCard } from '@/components/ui/StatCard'
import { LoadingBlock } from '@/components/ui/Feedback'
import { Badge } from '@/components/ui/Feedback'
import { useAsync } from '@/hooks/useAsync'
import { dashboardService } from '@/services/dashboardService'
import { formatCurrency, formatDate } from '@/lib/format'

export default function AdminDashboardPage() {
  const { data, isLoading } = useAsync(() => dashboardService.admin(), [])

  return (
    <div>
      <PageHeader title="Dashboard" description="Live snapshot of orders, restaurants and riders across PureEats." />

      {isLoading || !data ? (
        <LoadingBlock />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Total Orders" value={String(data.totalOrders)} icon={ShoppingBag} tone="brand" />
            <StatCard label="Total Revenue" value={formatCurrency(data.totalRevenue)} icon={Wallet} tone="green" />
            <StatCard
              label="Active Restaurants"
              value={`${data.activeRestaurants}/${data.totalRestaurants}`}
              icon={Store}
              tone="blue"
            />
            <StatCard
              label="Riders Online"
              value={`${data.onlineRiders}/${data.totalRiders}`}
              icon={Bike}
              tone="amber"
            />
            <StatCard label="Customers" value={String(data.totalCustomers)} icon={Users} tone="brand" />
            <StatCard label="Average Rating" value={data.avgRating.toFixed(1)} icon={Star} tone="amber" />
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <div className="card p-4 xl:col-span-2">
              <h2 className="mb-4 text-sm font-semibold text-slate-700">Orders &amp; revenue — last 14 days</h2>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={data.trend}>
                  <defs>
                    <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f2612c" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#f2612c" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={40} />
                  <Tooltip formatter={(value: number, name) => (name === 'revenue' ? formatCurrency(value) : value)} />
                  <Area type="monotone" dataKey="revenue" stroke="#f2612c" fill="url(#revenueFill)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="card p-4">
              <h2 className="mb-4 text-sm font-semibold text-slate-700">Orders by status</h2>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={data.ordersByStatus} layout="vertical" margin={{ left: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={90}
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip />
                  <Bar dataKey="value" fill="#f2612c" radius={[0, 4, 4, 0]} barSize={14} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <div className="card p-4 xl:col-span-2">
              <h2 className="mb-3 text-sm font-semibold text-slate-700">Recent orders</h2>
              <div className="divide-y divide-slate-100">
                {data.recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between py-2.5 text-sm">
                    <div>
                      <p className="font-medium text-slate-700">{order.uniqueOrderId}</p>
                      <p className="text-xs text-slate-400">
                        {order.restaurantName} · {order.customerName}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-slate-700">{formatCurrency(order.total)}</p>
                      <p className="text-xs text-slate-400">{formatDate(order.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card p-4">
              <h2 className="mb-3 text-sm font-semibold text-slate-700">Top restaurants</h2>
              <div className="space-y-3">
                {data.topRestaurants.map((r, index) => (
                  <div key={r.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Badge tone="slate">#{index + 1}</Badge>
                      <span className="text-slate-700">{r.name}</span>
                    </div>
                    <span className="font-medium text-slate-700">{formatCurrency(r.revenue)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
