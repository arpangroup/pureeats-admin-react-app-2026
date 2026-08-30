import { useNavigate } from 'react-router-dom'
import { Star } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { ActiveBadge } from '@/components/ui/Feedback'
import { DataTable, type Column } from '@/components/DataTable'
import { useAsync } from '@/hooks/useAsync'
import { useAuth } from '@/hooks/useAuth'
import { restaurantService } from '@/services/restaurantService'
import { formatRating } from '@/lib/format'
import { locations } from '@/mocks/fixtures'
import type { Restaurant } from '@/types/entities'

export default function OwnerRestaurantsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { data, isLoading } = useAsync(() => restaurantService.listByOwner(user!.id, { perPage: 50 }), [user?.id])

  const columns: Column<Restaurant>[] = [
    { key: 'name', header: 'Restaurant', render: (row) => <span className="font-medium text-slate-800">{row.name}</span> },
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
    { key: 'status', header: 'Status', render: (row) => <ActiveBadge active={row.isActive} activeLabel="Open" inactiveLabel="Closed" /> },
  ]

  return (
    <div>
      <PageHeader title="My Restaurants" description="Restaurants linked to your PureEats account." />
      <DataTable
        columns={columns}
        rows={data?.data ?? []}
        rowKey={(row) => row.id}
        isLoading={isLoading}
        emptyTitle="No restaurant assigned"
        pagination={data ?? undefined}
        onPageChange={() => {}}
        onRowClick={(row) => navigate(`/restaurant-owner/restaurants/${row.id}/edit`)}
      />
    </div>
  )
}
