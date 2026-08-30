import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { SearchInput } from '@/components/ui/FormControls'
import { ActiveBadge, Badge } from '@/components/ui/Feedback'
import { ConfirmDialog } from '@/components/ui/Modal'
import { DataTable, type Column } from '@/components/DataTable'
import { useAsync } from '@/hooks/useAsync'
import { useDebounce } from '@/hooks/useDebounce'
import { couponService } from '@/services/simpleServices'
import { restaurantService } from '@/services/restaurantService'
import { formatCurrency, formatDate } from '@/lib/format'
import type { Coupon } from '@/types/entities'

export default function CouponsPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)
  const params = useMemo(() => ({ page, perPage: 10, search: debouncedSearch }), [page, debouncedSearch])
  const { data, isLoading, reload } = useAsync(() => couponService.list(params), [params])
  const { data: restaurantsData } = useAsync(() => restaurantService.list({ perPage: 100 }), [])
  const restaurants = restaurantsData?.data ?? []

  const [deleteTarget, setDeleteTarget] = useState<Coupon | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await couponService.remove(deleteTarget.id)
      setDeleteTarget(null)
      reload()
    } finally {
      setDeleting(false)
    }
  }

  const columns: Column<Coupon>[] = [
    {
      key: 'name',
      header: 'Coupon',
      render: (row) => (
        <div>
          <p className="font-medium text-slate-800 dark:text-slate-100">{row.name}</p>
          <p className="text-xs text-slate-400 dark:text-slate-500">{row.code}</p>
        </div>
      ),
    },
    {
      key: 'discount',
      header: 'Discount',
      render: (row) => {
        if (row.discountType === 'free_delivery') return <Badge tone="blue">Free delivery</Badge>
        return row.discountType === 'percentage' ? `${row.discount}%` : formatCurrency(row.discount)
      },
    },
    {
      key: 'scope',
      header: 'Applies to',
      render: (row) => (row.restaurantId ? restaurants.find((r) => r.id === row.restaurantId)?.name ?? '—' : <Badge tone="blue">All restaurants</Badge>),
    },
    { key: 'expiry', header: 'Expires', render: (row) => formatDate(row.expiryDate, false) },
    { key: 'status', header: 'Status', render: (row) => <ActiveBadge active={row.isActive} /> },
    {
      key: 'actions',
      header: '',
      className: 'px-4 py-3 text-right',
      render: (row) => (
        <button
          className="rounded-md p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10 dark:hover:text-rose-400"
          onClick={(e) => { e.stopPropagation(); setDeleteTarget(row) }}
          aria-label="Delete coupon"
        >
          <Trash2 size={15} />
        </button>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Coupons"
        description="Discount codes customers can apply at checkout."
        actions={
          <button className="btn-primary" onClick={() => navigate('/admin/coupons/new')}>
            <Plus size={16} /> Add Coupon
          </button>
        }
      />

      <div className="mb-3">
        <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1) }} placeholder="Search by name or code…" />
      </div>

      <DataTable
        columns={columns}
        rows={data?.data ?? []}
        rowKey={(row) => row.id}
        isLoading={isLoading}
        emptyTitle="No coupons found"
        pagination={data ?? undefined}
        onPageChange={setPage}
        onRowClick={(row) => navigate(`/admin/coupons/${row.id}/edit`)}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete coupon"
        description="This action can't be undone."
        confirmLabel="Delete"
        danger
        isBusy={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  )
}
