import { UserDetailView } from '@/components/users/UserDetailView'

export default function EmployeeDetailPage() {
  return <UserDetailView role="employee" basePath="/admin/employees" />
}
