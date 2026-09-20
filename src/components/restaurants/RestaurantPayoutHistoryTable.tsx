import { useState } from 'react'
import { useAsync } from '@/hooks/useAsync'
import { DataTable, type Column } from '@/components/DataTable'
import { Badge } from '@/components/ui/Feedback'
import { payoutService, type PayoutRow } from '@/services/financeServices'
import { formatCurrency, formatDate } from '@/lib/format'
import type { RestaurantPayout } from '@/types/entities'

const statusTone: Record<RestaurantPayout['status'], 'slate' | 'green' | 'amber' | 'red'> = {
  pending: 'slate',
  processing: 'amber',
  paid: 'green',
  rejected: 'red',
}

const columns: Column<PayoutRow>[] = [
  { key: 'amount', header: 'Amount', render: (row) => <span className="font-medium text-slate-800 dark:text-slate-100">{formatCurrency(row.amount)}</span> },
  { key: 'mode', header: 'Mode', render: (row) => row.transactionMode ?? '—' },
  { key: 'transaction', header: 'Transaction ID', render: (row) => row.transactionId ?? '—' },
  { key: 'status', header: 'Status', render: (row) => <Badge tone={statusTone[row.status]}>{row.status}</Badge> },
  { key: 'requested', header: 'Requested', render: (row) => formatDate(row.createdAt) },
]

/** A single restaurant's payout history — the admin restaurant detail page's read-only companion to the global Store Payouts list. */
export function RestaurantPayoutHistoryTable({ restaurantId }: { restaurantId: number }) {
  const [page, setPage] = useState(1)
  const { data, isLoading } = useAsync(
    () => payoutService.list({ page, perPage: 10, filters: { restaurantId } }),
    [restaurantId, page],
  )

  return (
    <DataTable
      columns={columns}
      rows={data?.data ?? []}
      rowKey={(row) => row.id}
      isLoading={isLoading}
      emptyTitle="No payouts requested yet"
      pagination={data ?? undefined}
      onPageChange={setPage}
    />
  )
}
