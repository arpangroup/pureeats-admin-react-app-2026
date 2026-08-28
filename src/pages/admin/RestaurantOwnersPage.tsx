import { UsersListView } from '@/components/users/UsersListView'

export default function RestaurantOwnersPage() {
  return (
    <UsersListView
      role="restaurant-owner"
      title="Restaurant Owners"
      description="Owners who manage one or more restaurants on PureEats."
      createLabel="Add Restaurant Owner"
    />
  )
}
