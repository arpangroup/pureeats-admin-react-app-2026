import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Star } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { SearchInput } from '@/components/ui/FormControls'
import { ActiveBadge, Badge } from '@/components/ui/Feedback'
import { DataTable, type Column } from '@/components/DataTable'
import { useAsync } from '@/hooks/useAsync'
import { useDebounce } from '@/hooks/useDebounce'
import { restaurantService } from '@/services/restaurantService'
import { locations } from '@/mocks/fixtures'
import type { Restaurant } from '@/types/entities'

export default function AdminRestaurantsPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)

  const params = useMemo(() => ({ page, perPage: 10, search: debouncedSearch }), [page, debouncedSearch])
  const { data, isLoading } = useAsync(() => restaurantService.list(params), [params])

  const columns: Column<Restaurant>[] = [
    {
      key: 'name',
      header: 'Restaurant',
      render: (row) => (
        <div>
          <p className="font-medium text-slate-800">{row.name}</p>
          <p className="text-xs text-slate-400">{row.sku}</p>
        </div>
      ),
    },
    { key: 'location', header: 'Location', render: (row) => locations.find((l) => l.id === row.locationId)?.name ?? '—' },
    {
      key: 'rating',
      header: 'Rating',
      render: (row) => (
        <span className="inline-flex items-center gap-1">
          <Star size={13} className="fill-amber-400 text-amber-400" /> {row.rating.toFixed(1)}
        </span>
      ),
    },
    { key: 'commission', header: 'Commission', render: (row) => `${row.commissionRate}%` },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <div className="flex flex-wrap gap-1">
          <ActiveBadge active={row.isActive} />
          {!row.isAccepted && <Badge tone="amber">Pending approval</Badge>}
          {row.isFeatured && <Badge tone="purple">Featured</Badge>}
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Restaurants"
        description="Every restaurant partnered with PureEats."
        actions={
          <button className="btn-primary" onClick={() => navigate('/admin/restaurants/new')}>
            <Plus size={16} /> Add Restaurant
          </button>
        }
      />

      <div className="mb-3">
        <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1) }} placeholder="Search by name or SKU…" />
      </div>

      <DataTable
        columns={columns}
        rows={data?.data ?? []}
        rowKey={(row) => row.id}
        isLoading={isLoading}
        emptyTitle="No restaurants found"
        pagination={data ?? undefined}
        onPageChange={setPage}
        onRowClick={(row) => navigate(`/admin/restaurants/${row.id}/edit`)}
      />
    </div>
  )
}
