import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Badge, EmptyState, LoadingBlock } from '@/components/ui/Feedback'
import { Modal } from '@/components/ui/Modal'
import { DataTable, type Column } from '@/components/DataTable'
import { useAsync } from '@/hooks/useAsync'
import { deliveryCollectionService, type DeliveryCollectionRow } from '@/services/financeServices'
import { formatCurrency, formatDate } from '@/lib/format'
import { deliveryGuyDetailPath } from '@/lib/routes'

export default function DeliveryCollectionsPage() {
  const navigate = useNavigate()
  const params = useMemo(() => ({ page: 1, perPage: 20 }), [])
  const { data, isLoading } = useAsync(() => deliveryCollectionService.list(params), [params])
  const [viewing, setViewing] = useState<DeliveryCollectionRow | null>(null)

  const columns: Column<DeliveryCollectionRow>[] = [
    {
      key: 'rider',
      header: 'Delivery Partner',
      render: (row) => (
        <button
          className="font-medium text-brand-600 hover:underline dark:text-brand-400"
          onClick={(e) => {
            e.stopPropagation()
            navigate(deliveryGuyDetailPath(row.userId))
          }}
        >
          {row.riderName}
        </button>
      ),
    },
    { key: 'amount', header: 'Cash in hand', render: (row) => formatCurrency(row.amount) },
    { key: 'updated', header: 'Last updated', render: (row) => formatDate(row.updatedAt) },
    {
      key: 'view',
      header: '',
      className: 'px-4 py-3 text-right',
      render: () => <ChevronRight size={16} className="ml-auto text-slate-400 dark:text-slate-500" />,
    },
  ]

  return (
    <div>
      <PageHeader title="Delivery Collections" description="Cash-on-delivery amounts held by each delivery partner." />
      <DataTable
        columns={columns}
        rows={data?.data ?? []}
        rowKey={(row) => row.id}
        isLoading={isLoading}
        emptyTitle="No collections found"
        onRowClick={setViewing}
      />

      <Modal open={!!viewing} onClose={() => setViewing(null)} title={viewing ? `${viewing.riderName} — Collection Log` : ''}>
        {viewing && <CollectionLogs collectionId={viewing.id} />}
      </Modal>
    </div>
  )
}

function CollectionLogs({ collectionId }: { collectionId: number }) {
  const { data: logs, isLoading } = useAsync(() => deliveryCollectionService.logs(collectionId), [collectionId])

  if (isLoading) return <LoadingBlock />
  if (!logs || logs.length === 0) return <EmptyState title="No log entries" />

  return (
    <div className="space-y-2">
      {logs.map((log) => (
        <div key={log.id} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 dark:border-slate-800">
          <div>
            <p className="text-sm text-slate-700 dark:text-slate-300">{log.message}</p>
            <p className="text-xs text-slate-400 dark:text-slate-500">{formatDate(log.createdAt)}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge tone={log.type === 'credit' ? 'green' : 'red'}>{log.type}</Badge>
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{formatCurrency(log.amount)}</span>
          </div>
        </div>
      ))}
    </div>
  )
}
