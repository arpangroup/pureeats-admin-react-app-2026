import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Plus, Star, UploadCloud, UtensilsCrossed, Users } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { SearchInput, Select } from '@/components/ui/FormControls'
import { ActiveBadge, Badge } from '@/components/ui/Feedback'
import { Tabs } from '@/components/ui/Tabs'
import { SlideOver } from '@/components/ui/SlideOver'
import { DataTable, type Column } from '@/components/DataTable'
import { RestaurantBulkUploadForm } from '@/components/restaurants/RestaurantBulkUploadForm'
import { useAsync } from '@/hooks/useAsync'
import { useDebounce } from '@/hooks/useDebounce'
import { restaurantService } from '@/services/restaurantService'
import { formatRating } from '@/lib/format'
import { locations, restaurantCategories } from '@/mocks/fixtures'
import type { DayOfWeek, Restaurant } from '@/types/entities'

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

const JS_DAY_TO_KEY: DayOfWeek[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

// "Closed now" is a real-time computed status against today's weekly-schedule
// slots — distinct from the admin-controlled isActive flag, which is why it
// isn't just folded into the Active/Inactive tabs.
function isClosedNow(restaurant: Restaurant): boolean {
  const now = new Date()
  const today = restaurant.weeklySchedule?.find((d) => d.day === JS_DAY_TO_KEY[now.getDay()])
  if (!today || !today.isOpen || today.slots.length === 0) {
    // No weekly schedule set (e.g. legacy record) — fall back to the flat hours.
    if (restaurant.weeklySchedule?.length) return true
    return isOutsideWindow(now, restaurant.openingTime, restaurant.closingTime)
  }
  const minutesNow = now.getHours() * 60 + now.getMinutes()
  return !today.slots.some((slot) => {
    const open = timeToMinutes(slot.open)
    const close = timeToMinutes(slot.close)
    if (close <= open) return minutesNow >= open || minutesNow < close // overnight slot
    return minutesNow >= open && minutesNow < close
  })
}

function isOutsideWindow(now: Date, openingTime: string | undefined, closingTime: string | undefined): boolean {
  if (!openingTime || !closingTime) return false
  const minutesNow = now.getHours() * 60 + now.getMinutes()
  const openMinutes = timeToMinutes(openingTime)
  const closeMinutes = timeToMinutes(closingTime)
  if (closeMinutes <= openMinutes) {
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
  const [categoryId, setCategoryId] = useState<number | 'all'>('all')
  const [bulkUploadOpen, setBulkUploadOpen] = useState(searchParams.get('bulkUpload') === '1')

  // Fetch everything unfiltered — search spans fields (location, id) the mock
  // service's own search param doesn't cover, so filtering happens here instead.
  const params = useMemo(() => ({ page: 1, perPage: 500 }), [])
  const { data, isLoading, reload } = useAsync(() => restaurantService.list(params), [params])

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase()
    return (data?.data ?? []).filter((r) => {
      if (!matchesTab(r, activeTab)) return false
      if (categoryId !== 'all' && !(r.categoryIds ?? []).includes(categoryId)) return false
      if (!q) return true
      const locationName = locations.find((l) => l.id === r.locationId)?.name ?? ''
      return (
        r.name.toLowerCase().includes(q) ||
        String(r.id).includes(q) ||
        (r.sku ?? '').toLowerCase().includes(q) ||
        (r.contactNumber ?? '').includes(q) ||
        locationName.toLowerCase().includes(q) ||
        (r.address ?? '').toLowerCase().includes(q)
      )
    })
  }, [data, activeTab, categoryId, debouncedSearch])
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
          <Star size={13} className="fill-amber-400 text-amber-400" /> {formatRating(row.rating)}
        </span>
      ),
    },
    { key: 'commission', header: 'Commission', render: (row) => (row.commissionRate != null ? `${row.commissionRate}%` : '—') },
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

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <SearchInput
          value={search}
          onChange={(v) => { setSearch(v); setPage(1) }}
          placeholder="Search by name, ID, SKU, phone or location…"
        />
        <Select
          value={categoryId}
          onChange={(e) => { setCategoryId(e.target.value === 'all' ? 'all' : Number(e.target.value)); setPage(1) }}
          className="w-48"
        >
          <option value="all">All categories</option>
          {restaurantCategories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </Select>
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
