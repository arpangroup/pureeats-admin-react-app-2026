import { useEffect, useState } from 'react'
import { ItemsListView } from '@/components/items/ItemsListView'
import { LoadingBlock, EmptyState } from '@/components/ui/Feedback'
import { useAsync } from '@/hooks/useAsync'
import { useAuth } from '@/hooks/useAuth'
import { restaurantService } from '@/services/restaurantService'

export default function OwnerItemsPage() {
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

  return <ItemsListView restaurantId={restaurantId} />
}
