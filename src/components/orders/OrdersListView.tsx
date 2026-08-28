import { useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/ui/PageHeader'
import { SearchInput } from '@/components/ui/FormControls'
import { Tabs } from '@/components/ui/Tabs'
import { DataTable, type Column } from '@/components/DataTable'
import { useAsync } from '@/hooks/useAsync'
import { useDebounce } from '@/hooks/useDebounce'
import { orderService, type OrderRow } from '@/services/orderService'
import { formatCurrency, formatDate } from '@/lib/format'
import { OrderStatusBadge } from './OrderStatusBadge'

export function OrdersListView({
  restaurantId,
  basePath,
  headerActions,
}: {
  restaurantId?: number
  basePath: string
  headerActions?: ReactNode
}) {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusId, setStatusId] = useState<string>('all')
  const debouncedSearch = useDebounce(search, 300)

  const statuses = orderService.statuses()

  const params = useMemo(
    () => ({
      page,
      perPage: 10,
      search: debouncedSearch,
      restaurantId,
      statusId: statusId === 'all' ? undefined : Number(statusId),
    }),
    [page, debouncedSearch, statusId, restaurantId],
  )

  const { data, isLoading } = useAsync(() => orderService.list(params), [params])

  const columns: Column<OrderRow>[] = [
    { key: 'id', header: 'Order', render: (row) => <span className="font-medium text-slate-800">{row.uniqueOrderId}</span> },
    ...(restaurantId ? [] : [{ key: 'restaurant', header: 'Restaurant', render: (row: OrderRow) => row.restaurantName } as Column<OrderRow>]),
    { key: 'customer', header: 'Customer', render: (row) => row.customerName },
    { key: 'items', header: 'Items', render: (row) => `${row.items.length} item${row.items.length !== 1 ? 's' : ''}` },
    { key: 'total', header: 'Total', render: (row) => formatCurrency(row.total) },
    { key: 'payment', header: 'Payment', render: (row) => <span className="capitalize">{row.paymentMode}</span> },
    { key: 'status', header: 'Status', render: (row) => <OrderStatusBadge status={row.statusName} /> },
    { key: 'placed', header: 'Placed', render: (row) => <span className="text-slate-500">{formatDate(row.createdAt)}</span> },
  ]

  return (
    <div>
      <PageHeader title="Orders" description="Track and manage every order placed on PureEats." actions={headerActions} />

      <div className="mb-3">
        <Tabs
          items={[{ key: 'all', label: 'All' }, ...statuses.map((s) => ({ key: String(s.id), label: s.name }))]}
          activeKey={statusId}
          onChange={(key) => {
            setStatusId(key)
            setPage(1)
          }}
        />
      </div>

      <div className="mb-3">
        <SearchInput
          value={search}
          onChange={(v) => {
            setSearch(v)
            setPage(1)
          }}
          placeholder="Search by order ID or customer…"
        />
      </div>

      <DataTable
        columns={columns}
        rows={data?.data ?? []}
        rowKey={(row) => row.id}
        isLoading={isLoading}
        emptyTitle="No orders found"
        emptyDescription="Try a different status or search term."
        pagination={data ?? undefined}
        onPageChange={setPage}
        onRowClick={(row) => navigate(`${basePath}/${row.id}`)}
      />
    </div>
  )
}
