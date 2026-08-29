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

  const { data: statuses } = useAsync(() => orderService.statuses(), [])

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
    { key: 'id', header: 'Order', render: (row) => <span className="font-medium text-slate-800 dark:text-slate-100">{row.uniqueOrderId}</span> },
    ...(restaurantId ? [] : [{ key: 'restaurant', header: 'Restaurant', render: (row: OrderRow) => row.restaurantName } as Column<OrderRow>]),
    { key: 'customer', header: 'Customer', render: (row) => row.customerName },
    { key: 'items', header: 'Items', render: (row) => `${row.items.length} item${row.items.length !== 1 ? 's' : ''}` },
    {
      key: 'total',
      header: 'Total',
      render: (row) => (
        <div>
          <p>{formatCurrency(row.total)}</p>
          {row.couponName && (
            <span className="mt-0.5 inline-flex items-center rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">
              {row.couponName}
            </span>
          )}
        </div>
      ),
    },
    { key: 'payment', header: 'Payment', render: (row) => <span className="capitalize">{row.paymentMode}</span> },
    { key: 'status', header: 'Status', render: (row) => <OrderStatusBadge status={row.statusName} /> },
    { key: 'placed', header: 'Placed', render: (row) => <span className="text-slate-500 dark:text-slate-400">{formatDate(row.createdAt)}</span> },
  ]

  return (
    <div>
      <PageHeader title="Orders" description="Track and manage every order placed on PureEats." actions={headerActions} />

      <div className="mb-3">
        <Tabs
          items={[{ key: 'all', label: 'All' }, ...(statuses ?? []).map((s) => ({ key: String(s.id), label: s.name }))]}
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
