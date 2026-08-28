import { useEffect, useState } from 'react'
import { OrdersListView } from '@/components/orders/OrdersListView'
import { Select } from '@/components/ui/FormControls'
import { LoadingBlock, EmptyState } from '@/components/ui/Feedback'
import { useAsync } from '@/hooks/useAsync'
import { useAuth } from '@/hooks/useAuth'
import { restaurantService } from '@/services/restaurantService'

export default function OwnerOrdersPage() {
  const { user } = useAuth()
  const { data: restaurantPage, isLoading } = useAsync(() => restaurantService.listByOwner(user!.id, { perPage: 50 }), [user?.id])
  const restaurants = restaurantPage?.data ?? []
  const [restaurantId, setRestaurantId] = useState<number | null>(null)

  useEffect(() => {
    if (!restaurantId && restaurants.length > 0) setRestaurantId(restaurants[0].id)
  }, [restaurants, restaurantId])

  if (isLoading) return <LoadingBlock />
  if (restaurants.length === 0) return <EmptyState title="No restaurant assigned" />
  if (!restaurantId) return null

  const selector = restaurants.length > 1 && (
    <Select value={restaurantId} onChange={(e) => setRestaurantId(Number(e.target.value))} className="w-56">
      {restaurants.map((r) => (
        <option key={r.id} value={r.id}>
          {r.name}
        </option>
      ))}
    </Select>
  )

  return <OrdersListView restaurantId={restaurantId} basePath="/restaurant-owner/orders" headerActions={selector || undefined} />
}
