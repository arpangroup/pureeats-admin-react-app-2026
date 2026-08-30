import { useState } from 'react'
import { useAsync } from '@/hooks/useAsync'
import { DataTable, type Column } from '@/components/DataTable'
import { restaurantService, type RestaurantAuditLogEntry } from '@/services/restaurantService'
import { formatDate } from '@/lib/format'

const columns: Column<RestaurantAuditLogEntry>[] = [
  { key: 'field', header: 'Field', render: (row) => <span className="font-medium text-slate-700 dark:text-slate-200">{row.fieldName}</span> },
  { key: 'old', header: 'Old value', render: (row) => <span className="font-mono text-xs">{row.oldValue ?? '—'}</span> },
  { key: 'new', header: 'New value', render: (row) => <span className="font-mono text-xs">{row.newValue ?? '—'}</span> },
  { key: 'by', header: 'Updated by', render: (row) => row.updatedByName ?? (row.updatedBy ? `User #${row.updatedBy}` : '—') },
  { key: 'when', header: 'When', render: (row) => formatDate(row.updatedAt) },
]

/** Live mode only — the field-level "what changed, by whom" trail behind every restaurant update. */
export function RestaurantAuditLogTable({ restaurantId }: { restaurantId: number }) {
  const [page, setPage] = useState(1)
  const { data, isLoading } = useAsync(() => restaurantService.auditLog(restaurantId, { page, perPage: 20 }), [restaurantId, page])

  return (
    <DataTable
      columns={columns}
      rows={data?.data ?? []}
      rowKey={(row) => row.id}
      isLoading={isLoading}
      emptyTitle="No changes recorded yet"
      pagination={data ?? undefined}
      onPageChange={setPage}
    />
  )
}
