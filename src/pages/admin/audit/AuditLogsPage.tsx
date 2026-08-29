import { AuditListView } from '@/components/audit/AuditListView'
import { Badge } from '@/components/ui/Feedback'
import { auditLogService } from '@/services/auditService'
import { formatDate } from '@/lib/format'
import type { Column } from '@/components/DataTable'
import type { AuditLog } from '@/types/audit'

const columns: Column<AuditLog>[] = [
  { key: 'eventType', header: 'Event', render: (row) => <span className="font-medium text-slate-700 dark:text-slate-200">{row.eventType}</span> },
  { key: 'userId', header: 'User ID', render: (row) => row.userId ?? '—' },
  { key: 'result', header: 'Result', render: (row) => <Badge tone={row.result === 'SUCCESS' ? 'green' : 'red'}>{row.result}</Badge> },
  { key: 'endpoint', header: 'Endpoint', render: (row) => <span className="font-mono text-xs">{row.endpoint ?? '—'}</span> },
  { key: 'ipAddress', header: 'IP', render: (row) => row.ipAddress ?? '—' },
  { key: 'createdAt', header: 'When', render: (row) => formatDate(row.createdAt) },
]

export default function AuditLogsPage() {
  return (
    <AuditListView
      title="Audit Logs"
      description="Security-relevant events across the authentication system."
      columns={columns}
      fetchPage={auditLogService.list}
      filter="userId"
    />
  )
}
