import { UsersListView } from '@/components/users/UsersListView'

export default function UsersPage() {
  return (
    <UsersListView
      role="customer"
      title="Users"
      description="Customers who have signed up on PureEats."
      createLabel="Add User"
    />
  )
}
