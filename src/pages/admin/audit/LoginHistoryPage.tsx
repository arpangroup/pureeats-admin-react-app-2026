import { AuditListView } from '@/components/audit/AuditListView'
import { Badge } from '@/components/ui/Feedback'
import { loginHistoryService } from '@/services/auditService'
import { formatDate } from '@/lib/format'
import type { Column } from '@/components/DataTable'
import type { LoginHistory } from '@/types/audit'

const columns: Column<LoginHistory>[] = [
  { key: 'userId', header: 'User ID', render: (row) => row.userId ?? '—' },
  { key: 'method', header: 'Method', render: (row) => row.loginMethod },
  { key: 'status', header: 'Status', render: (row) => <Badge tone={row.status === 'SUCCESS' ? 'green' : 'red'}>{row.status}</Badge> },
  { key: 'location', header: 'Location', render: (row) => [row.city, row.region, row.country].filter(Boolean).join(', ') || '—' },
  { key: 'ipAddress', header: 'IP', render: (row) => row.ipAddress ?? '—' },
  { key: 'occurredAt', header: 'When', render: (row) => formatDate(row.occurredAt) },
]

export default function LoginHistoryPage() {
  return (
    <AuditListView
      title="Login History"
      description="Successful and failed sign-in attempts."
      columns={columns}
      fetchPage={loginHistoryService.list}
      filter="userId"
    />
  )
}
