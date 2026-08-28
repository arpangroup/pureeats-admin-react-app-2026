import { useEffect, useState } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Badge, EmptyState, LoadingBlock } from '@/components/ui/Feedback'
import { Select } from '@/components/ui/FormControls'
import { DataTable, type Column } from '@/components/DataTable'
import { useAsync } from '@/hooks/useAsync'
import { useAuth } from '@/hooks/useAuth'
import { restaurantService } from '@/services/restaurantService'
import { earningsService } from '@/services/financeServices'
import { formatCurrency, formatDate } from '@/lib/format'
import type { RestaurantEarning } from '@/types/entities'

export default function EarningsPage() {
  const { user } = useAuth()
  const { data: restaurantPage, isLoading: loadingRestaurants } = useAsync(() => restaurantService.listByOwner(user!.id, { perPage: 50 }), [user?.id])
  const restaurants = restaurantPage?.data ?? []
  const [restaurantId, setRestaurantId] = useState<number | null>(null)

  useEffect(() => {
    if (!restaurantId && restaurants.length > 0) setRestaurantId(restaurants[0].id)
  }, [restaurants, restaurantId])

  const { data: earnings, isLoading, reload } = useAsync(
    () => (restaurantId ? earningsService.forRestaurant(restaurantId) : Promise.resolve([])),
    [restaurantId],
  )
  const [requestingId, setRequestingId] = useState<number | null>(null)

  async function requestPayout(earning: RestaurantEarning) {
    if (!restaurantId) return
    setRequestingId(earning.id)
    try {
      await earningsService.requestPayout(restaurantId, earning.id)
      reload()
    } finally {
      setRequestingId(null)
    }
  }

  const columns: Column<RestaurantEarning>[] = [
    { key: 'amount', header: 'Amount', render: (row) => <span className="font-medium text-slate-800">{formatCurrency(row.amount)}</span> },
    { key: 'earned', header: 'Earned on', render: (row) => formatDate(row.createdAt) },
    {
      key: 'status',
      header: 'Status',
      render: (row) =>
        row.isProcessed ? <Badge tone="green">Paid out</Badge> : row.isRequested ? <Badge tone="amber">Payout requested</Badge> : <Badge tone="slate">Not requested</Badge>,
    },
    {
      key: 'actions',
      header: '',
      className: 'px-4 py-3 text-right',
      render: (row) =>
        !row.isRequested && !row.isProcessed ? (
          <button className="btn-secondary px-3 py-1.5 text-xs" disabled={requestingId === row.id} onClick={() => requestPayout(row)}>
            {requestingId === row.id ? 'Requesting…' : 'Request payout'}
          </button>
        ) : null,
    },
  ]

  if (loadingRestaurants) return <LoadingBlock />
  if (restaurants.length === 0) return <EmptyState title="No restaurant assigned" />

  return (
    <div>
      <PageHeader
        title="Earnings"
        description="Track and request payouts for your restaurant's earnings."
        actions={
          restaurants.length > 1 ? (
            <Select value={restaurantId ?? ''} onChange={(e) => setRestaurantId(Number(e.target.value))} className="w-56">
              {restaurants.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </Select>
          ) : undefined
        }
      />
      <DataTable columns={columns} rows={earnings ?? []} rowKey={(row) => row.id} isLoading={isLoading} emptyTitle="No earnings yet" />
    </div>
  )
}
