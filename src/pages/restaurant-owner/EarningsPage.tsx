import { useEffect, useState } from 'react'
import { Wallet } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Badge, EmptyState, LoadingBlock } from '@/components/ui/Feedback'
import { Select } from '@/components/ui/FormControls'
import { StatCard } from '@/components/ui/StatCard'
import { DataTable, type Column } from '@/components/DataTable'
import { useAsync } from '@/hooks/useAsync'
import { useAuth } from '@/hooks/useAuth'
import { restaurantService } from '@/services/restaurantService'
import { earningsService } from '@/services/financeServices'
import { formatCurrency, formatDate } from '@/lib/format'
import type { RestaurantPayout } from '@/types/entities'

const statusTone: Record<RestaurantPayout['status'], 'slate' | 'green' | 'amber' | 'red'> = {
  pending: 'slate',
  processing: 'amber',
  paid: 'green',
  rejected: 'red',
}

const columns: Column<RestaurantPayout>[] = [
  { key: 'amount', header: 'Amount', render: (row) => <span className="font-medium text-slate-800 dark:text-slate-100">{formatCurrency(row.amount)}</span> },
  { key: 'mode', header: 'Mode', render: (row) => row.transactionMode ?? '—' },
  { key: 'status', header: 'Status', render: (row) => <Badge tone={statusTone[row.status]}>{row.status}</Badge> },
  { key: 'requested', header: 'Requested', render: (row) => formatDate(row.createdAt) },
]

export default function EarningsPage() {
  const { user } = useAuth()
  const { data: restaurantPage, isLoading: loadingRestaurants } = useAsync(() => restaurantService.listByOwner(user!.id, { perPage: 50 }), [user?.id])
  const restaurants = restaurantPage?.data ?? []
  const [restaurantId, setRestaurantId] = useState<number | null>(null)

  useEffect(() => {
    if (!restaurantId && restaurants.length > 0) setRestaurantId(restaurants[0].id)
  }, [restaurants, restaurantId])

  const { data: balance, isLoading, reload } = useAsync(
    () => (restaurantId ? earningsService.unsettledBalance(restaurantId) : Promise.resolve(null)),
    [restaurantId],
  )

  const [historyPage, setHistoryPage] = useState(1)
  const { data: history, isLoading: loadingHistory, reload: reloadHistory } = useAsync(
    () => (restaurantId ? earningsService.payoutHistory(restaurantId, { page: historyPage, perPage: 10 }) : Promise.resolve(null)),
    [restaurantId, historyPage],
  )

  const [requesting, setRequesting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [requested, setRequested] = useState(false)

  async function requestPayout() {
    if (!restaurantId) return
    setRequesting(true)
    setError(null)
    try {
      await earningsService.requestPayout(restaurantId)
      setRequested(true)
      reload()
      reloadHistory()
    } catch (err) {
      setError((err as { message?: string })?.message ?? 'Unable to request payout')
    } finally {
      setRequesting(false)
    }
  }

  if (loadingRestaurants) return <LoadingBlock />
  if (restaurants.length === 0) return <EmptyState title="No restaurant assigned" />

  return (
    <div>
      <PageHeader
        title="Earnings"
        description="Track and request a payout of your restaurant's unsettled balance."
        actions={
          restaurants.length > 1 ? (
            <Select
              value={restaurantId ?? ''}
              onChange={(e) => { setRestaurantId(Number(e.target.value)); setRequested(false); setHistoryPage(1) }}
              className="w-56"
            >
              {restaurants.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </Select>
          ) : undefined
        }
      />

      {error && <p className="mb-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">{error}</p>}

      {isLoading ? (
        <LoadingBlock />
      ) : (
        <div className="space-y-5">
          <div className="space-y-4">
            <StatCard label="Unsettled balance" value={formatCurrency(balance ?? 0)} icon={Wallet} tone="green" />
            <button
              className="btn-primary"
              onClick={requestPayout}
              disabled={requesting || requested || !balance}
            >
              {requesting ? 'Requesting…' : requested ? 'Payout requested' : 'Request payout'}
            </button>
          </div>

          <div>
            <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">Payout history</h2>
            <DataTable
              columns={columns}
              rows={history?.data ?? []}
              rowKey={(row) => row.id}
              isLoading={loadingHistory}
              emptyTitle="No payouts requested yet"
              pagination={history ?? undefined}
              onPageChange={setHistoryPage}
            />
          </div>
        </div>
      )}
    </div>
  )
}
