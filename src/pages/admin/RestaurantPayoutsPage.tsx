import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/ui/PageHeader'
import { SearchInput } from '@/components/ui/FormControls'
import { Badge } from '@/components/ui/Feedback'
import { DataTable, type Column } from '@/components/DataTable'
import { useAsync } from '@/hooks/useAsync'
import { useDebounce } from '@/hooks/useDebounce'
import { payoutService, type PayoutRow } from '@/services/financeServices'
import { formatCurrency, formatDate } from '@/lib/format'
import { restaurantDetailPath } from '@/lib/routes'
import type { RestaurantPayout } from '@/types/entities'

const statusTone: Record<RestaurantPayout['status'], 'slate' | 'green' | 'amber' | 'red'> = {
  pending: 'slate',
  processing: 'amber',
  paid: 'green',
  rejected: 'red',
}

export default function RestaurantPayoutsPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)
  const params = useMemo(() => ({ page, perPage: 10, search: debouncedSearch }), [page, debouncedSearch])
  const { data, isLoading, reload } = useAsync(() => payoutService.list(params), [params])
  const [updatingId, setUpdatingId] = useState<number | null>(null)

  async function updateStatus(row: PayoutRow, status: RestaurantPayout['status']) {
    setUpdatingId(row.id)
    try {
      await payoutService.updateStatus(row.id, status)
      reload()
    } finally {
      setUpdatingId(null)
    }
  }

  const columns: Column<PayoutRow>[] = [
    {
      key: 'restaurant',
      header: 'Restaurant',
      render: (row) => (
        <button
          className="font-medium text-brand-600 hover:underline dark:text-brand-400"
          onClick={(e) => {
            e.stopPropagation()
            navigate(restaurantDetailPath(row.restaurantId))
          }}
        >
          {row.restaurantName}
        </button>
      ),
    },
    { key: 'amount', header: 'Amount', render: (row) => formatCurrency(row.amount) },
    { key: 'mode', header: 'Mode', render: (row) => row.transactionMode },
    { key: 'status', header: 'Status', render: (row) => <Badge tone={statusTone[row.status]}>{row.status}</Badge> },
    { key: 'requested', header: 'Requested', render: (row) => formatDate(row.createdAt) },
    {
      key: 'actions',
      header: '',
      className: 'px-4 py-3 text-right',
      render: (row) =>
        row.status === 'pending' || row.status === 'processing' ? (
          <div className="flex justify-end gap-2">
            <button
              className="btn-secondary px-2 py-1 text-xs"
              disabled={updatingId === row.id}
              onClick={(e) => { e.stopPropagation(); updateStatus(row, 'paid') }}
            >
              Mark paid
            </button>
            <button
              className="btn-ghost px-2 py-1 text-xs text-rose-600"
              disabled={updatingId === row.id}
              onClick={(e) => { e.stopPropagation(); updateStatus(row, 'rejected') }}
            >
              Reject
            </button>
          </div>
        ) : null,
    },
  ]

  return (
    <div>
      <PageHeader title="Store Payouts" description="Settle earnings requested by store owners." />
      <div className="mb-3">
        <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1) }} placeholder="Search by store…" />
      </div>
      <DataTable
        columns={columns}
        rows={data?.data ?? []}
        rowKey={(row) => row.id}
        isLoading={isLoading}
        emptyTitle="No payouts found"
        pagination={data ?? undefined}
        onPageChange={setPage}
      />
    </div>
  )
}
