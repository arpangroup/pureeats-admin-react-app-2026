import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Plus, Star, UploadCloud, UtensilsCrossed, Users } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { SearchInput } from '@/components/ui/FormControls'
import { ActiveBadge, Badge } from '@/components/ui/Feedback'
import { Tabs } from '@/components/ui/Tabs'
import { SlideOver } from '@/components/ui/SlideOver'
import { DataTable, type Column } from '@/components/DataTable'
import { RestaurantBulkUploadForm } from '@/components/restaurants/RestaurantBulkUploadForm'
import { useAsync } from '@/hooks/useAsync'
import { useDebounce } from '@/hooks/useDebounce'
import { restaurantService } from '@/services/restaurantService'
import { locations } from '@/mocks/fixtures'
import type { Restaurant } from '@/types/entities'

type TabKey = 'all' | 'active' | 'inactive' | 'pending-approval' | 'closed' | 'pure-veg' | 'self-pickup' | 'delivery'

const TABS: { key: TabKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'inactive', label: 'Inactive' },
  { key: 'pending-approval', label: 'Pending Approval' },
  { key: 'closed', label: 'Closed Now' },
  { key: 'pure-veg', label: 'Pure Veg' },
  { key: 'self-pickup', label: 'Self Pickup' },
  { key: 'delivery', label: 'Delivery' },
]

// "Closed now" is a real-time computed status (current time outside opening/closing
// hours) — distinct from the admin-controlled isActive flag, which is why it isn't
// just folded into the Active/Inactive tabs.
function isClosedNow(restaurant: Restaurant): boolean {
  const now = new Date()
  const minutesNow = now.getHours() * 60 + now.getMinutes()
  const [openH, openM] = restaurant.openingTime.split(':').map(Number)
  const [closeH, closeM] = restaurant.closingTime.split(':').map(Number)
  const openMinutes = openH * 60 + openM
  const closeMinutes = closeH * 60 + closeM
  if (closeMinutes <= openMinutes) {
    // Overnight window (e.g. 12:00–00:00) — open unless within the closed gap.
    return minutesNow >= closeMinutes && minutesNow < openMinutes
  }
  return minutesNow < openMinutes || minutesNow >= closeMinutes
}

function matchesTab(restaurant: Restaurant, tab: TabKey): boolean {
  switch (tab) {
    case 'active':
      return restaurant.isActive
    case 'inactive':
      return !restaurant.isActive
    case 'pending-approval':
      return !restaurant.isAccepted
    case 'closed':
      return isClosedNow(restaurant)
    case 'pure-veg':
      return restaurant.isPureveg
    case 'self-pickup':
      return restaurant.deliveryType === 'self-pickup' || restaurant.deliveryType === 'both'
    case 'delivery':
      return restaurant.deliveryType === 'delivery' || restaurant.deliveryType === 'both'
    default:
      return true
  }
}

export default function AdminRestaurantsPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = (searchParams.get('tab') as TabKey) ?? 'all'
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)
  const [bulkUploadOpen, setBulkUploadOpen] = useState(searchParams.get('bulkUpload') === '1')

  const params = useMemo(() => ({ page: 1, perPage: 500, search: debouncedSearch }), [debouncedSearch])
  const { data, isLoading, reload } = useAsync(() => restaurantService.list(params), [params])

  const filtered = useMemo(
    () => (data?.data ?? []).filter((r) => matchesTab(r, activeTab)),
    [data, activeTab],
  )
  const pageSize = 10
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize)

  function setTab(tab: string) {
    setSearchParams(tab === 'all' ? {} : { tab })
    setPage(1)
  }

  function closeBulkUpload() {
    setBulkUploadOpen(false)
    if (searchParams.get('bulkUpload')) {
      const next = new URLSearchParams(searchParams)
      next.delete('bulkUpload')
      setSearchParams(next)
    }
  }

  const columns: Column<Restaurant>[] = [
    {
      key: 'name',
      header: 'Restaurant',
      render: (row) => (
        <div>
          <p className="font-medium text-slate-800 dark:text-slate-100">{row.name}</p>
          <p className="text-xs text-slate-400 dark:text-slate-500">{row.sku}</p>
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
          {isClosedNow(row) && <Badge tone="slate">Closed now</Badge>}
        </div>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'px-4 py-3 text-right',
      render: (row) => (
        <div className="flex justify-end gap-1">
          <button
            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
            title="View items"
            onClick={(e) => {
              e.stopPropagation()
              navigate(`/admin/items?restaurantId=${row.id}`)
            }}
          >
            <UtensilsCrossed size={15} />
          </button>
          <button
            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
            title="Find owners"
            onClick={(e) => {
              e.stopPropagation()
              navigate(`/admin/restaurant-owners-restaurants?restaurantId=${row.id}`)
            }}
          >
            <Users size={15} />
          </button>
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
          <>
            <button
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-sky-200 bg-sky-50 px-3.5 py-2 text-sm font-medium text-sky-700 transition-colors hover:bg-sky-100 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-400 dark:hover:bg-sky-500/20"
              onClick={() => setBulkUploadOpen(true)}
            >
              <UploadCloud size={16} /> Bulk Upload
            </button>

            <button className="btn-primary" onClick={() => navigate('/admin/restaurants/new')}>
              <Plus size={16} /> Add Restaurant
            </button>
          </>
        }
      />

      <div className="mb-3">
        <Tabs items={TABS} activeKey={activeTab} onChange={setTab} />
      </div>

      <div className="mb-3">
        <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1) }} placeholder="Search by name or SKU…" />
      </div>

      <DataTable
        columns={columns}
        rows={pageRows}
        rowKey={(row) => row.id}
        isLoading={isLoading}
        emptyTitle="No restaurants found"
        emptyDescription="Try a different tab or search term."
        pagination={{ page, perPage: pageSize, total: filtered.length, totalPages: Math.max(1, Math.ceil(filtered.length / pageSize)) }}
        onPageChange={setPage}
        onRowClick={(row) => navigate(`/admin/restaurants/${row.id}/edit`)}
      />

      <SlideOver
        open={bulkUploadOpen}
        onClose={closeBulkUpload}
        title="Bulk CSV Upload"
        description="Create multiple restaurants at once from a CSV file."
        width="lg"
      >
        <RestaurantBulkUploadForm onImported={reload} />
      </SlideOver>
    </div>
  )
}
