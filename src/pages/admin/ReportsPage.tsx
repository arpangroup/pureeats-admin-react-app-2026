import { useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { PageHeader } from '@/components/ui/PageHeader'
import { Select } from '@/components/ui/FormControls'
import { SectionCard } from '@/components/ui/SectionCard'
import { LoadingBlock, EmptyState } from '@/components/ui/Feedback'
import { DataTable, type Column } from '@/components/DataTable'
import { useAsync } from '@/hooks/useAsync'
import { reportService, type TopItemRow, type TopRestaurantRow, type TopRiderRow } from '@/services/reportService'
import { restaurants } from '@/mocks/fixtures'
import { formatCurrency } from '@/lib/format'

const RANGE_OPTIONS = [
  { label: 'Last 7 days', value: 7 },
  { label: 'Last 30 days', value: 30 },
  { label: 'Last 90 days', value: 90 },
]

const PIE_COLORS = ['#f2612c', '#0ea5e9', '#f59e0b', '#a855f7', '#10b981', '#ef4444', '#64748b', '#ec4899', '#14b8a6']

export default function ReportsPage() {
  const [days, setDays] = useState(30)
  const [restaurantId, setRestaurantId] = useState<number | 'all'>('all')

  const filters = useMemo(
    () => ({ days, restaurantId: restaurantId === 'all' ? undefined : restaurantId }),
    [days, restaurantId],
  )

  const { data: topItems, isLoading: loadingItems } = useAsync(() => reportService.topItems(filters), [filters])
  const { data: revenueTrend, isLoading: loadingTrend } = useAsync(() => reportService.revenueTrend(filters), [filters])
  const { data: statusSlices, isLoading: loadingStatus } = useAsync(() => reportService.ordersByStatus(filters), [filters])
  const { data: topRestaurants, isLoading: loadingRestaurants } = useAsync(() => reportService.topRestaurants({ days }), [days])
  const { data: topRiders, isLoading: loadingRiders } = useAsync(() => reportService.topRiders({ days }), [days])

  const itemColumns: Column<TopItemRow>[] = [
    { key: 'name', header: 'Item', render: (row) => <span className="font-medium text-slate-800 dark:text-slate-100">{row.name}</span> },
    { key: 'restaurant', header: 'Restaurant', render: (row) => row.restaurantName },
    { key: 'qty', header: 'Units sold', render: (row) => row.quantity },
    { key: 'revenue', header: 'Revenue', render: (row) => formatCurrency(row.revenue) },
  ]

  const restaurantColumns: Column<TopRestaurantRow>[] = [
    { key: 'name', header: 'Restaurant', render: (row) => <span className="font-medium text-slate-800 dark:text-slate-100">{row.name}</span> },
    { key: 'orders', header: 'Orders', render: (row) => row.orders },
    { key: 'revenue', header: 'Revenue', render: (row) => formatCurrency(row.revenue) },
  ]

  const riderColumns: Column<TopRiderRow>[] = [
    { key: 'name', header: 'Delivery partner', render: (row) => <span className="font-medium text-slate-800 dark:text-slate-100">{row.name}</span> },
    { key: 'deliveries', header: 'Deliveries', render: (row) => row.deliveries },
    { key: 'earnings', header: 'Earnings', render: (row) => formatCurrency(row.earnings) },
  ]

  return (
    <div>
      <PageHeader
        title="Reports"
        description="Sales, item and delivery-partner performance reports."
        actions={
          <div className="flex items-center gap-2">
            <Select value={restaurantId} onChange={(e) => setRestaurantId(e.target.value === 'all' ? 'all' : Number(e.target.value))} className="w-48">
              <option value="all">All restaurants</option>
              {restaurants.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </Select>
            <Select value={days} onChange={(e) => setDays(Number(e.target.value))} className="w-40">
              {RANGE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </Select>
          </div>
        }
      />

      <div className="space-y-4">
        <SectionCard title="Top 10 most sold items" description="Ranked by units sold in the selected range.">
          {loadingItems ? (
            <LoadingBlock />
          ) : !topItems || topItems.length === 0 ? (
            <EmptyState title="No sales in this range" />
          ) : (
            <>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={topItems} margin={{ left: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} interval={0} angle={-20} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={32} />
                  <Tooltip formatter={(value: number) => [`${value} units`, 'Sold']} />
                  <Bar dataKey="quantity" fill="#f2612c" radius={[4, 4, 0, 0]} barSize={28} />
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-4">
                <DataTable columns={itemColumns} rows={topItems} rowKey={(r) => r.itemId} />
              </div>
            </>
          )}
        </SectionCard>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <SectionCard title="Revenue trend" description="Orders and revenue over the selected range.">
              {loadingTrend || !revenueTrend ? (
                <LoadingBlock />
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={revenueTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} interval={Math.ceil(revenueTrend.length / 10)} />
                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={40} />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Bar dataKey="revenue" fill="#f2612c" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </SectionCard>
          </div>

          <SectionCard title="Orders by status">
            {loadingStatus || !statusSlices ? (
              <LoadingBlock />
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={statusSlices.filter((s) => s.value > 0)} dataKey="value" nameKey="name" innerRadius={45} outerRadius={80} paddingAngle={2}>
                    {statusSlices.filter((s) => s.value > 0).map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </SectionCard>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <SectionCard title="Top restaurants by revenue">
            {loadingRestaurants ? <LoadingBlock /> : <DataTable columns={restaurantColumns} rows={topRestaurants ?? []} rowKey={(r) => r.restaurantId} emptyTitle="No orders in this range" />}
          </SectionCard>
          <SectionCard title="Top delivery partners by earnings">
            {loadingRiders ? <LoadingBlock /> : <DataTable columns={riderColumns} rows={topRiders ?? []} rowKey={(r) => r.riderId} emptyTitle="No deliveries in this range" />}
          </SectionCard>
        </div>
      </div>
    </div>
  )
}
