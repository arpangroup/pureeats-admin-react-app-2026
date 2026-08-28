import { useSearchParams } from 'react-router-dom'
import { ItemsListView } from '@/components/items/ItemsListView'

export default function AdminItemsPage() {
  const [searchParams] = useSearchParams()
  const restaurantIdParam = searchParams.get('restaurantId')
  const restaurantId = restaurantIdParam ? Number(restaurantIdParam) : undefined

  return <ItemsListView restaurantId={restaurantId} />
}
