import { UsersListView } from '@/components/users/UsersListView'

export default function EmployeesPage() {
  return (
    <UsersListView
      role="employee"
      title="Employees"
      description="Internal staff who manage operations, support and finance."
      createLabel="Add Employee"
    />
  )
}
