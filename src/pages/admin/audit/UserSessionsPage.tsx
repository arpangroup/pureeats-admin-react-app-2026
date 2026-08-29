import { AuditListView } from '@/components/audit/AuditListView'
import { Badge } from '@/components/ui/Feedback'
import { userSessionService } from '@/services/auditService'
import { formatDate } from '@/lib/format'
import type { Column } from '@/components/DataTable'
import type { UserSession } from '@/types/audit'

const columns: Column<UserSession>[] = [
  { key: 'userId', header: 'User ID', render: (row) => row.userId },
  { key: 'sessionId', header: 'Session', render: (row) => <span className="font-mono text-xs">{row.sessionId}</span> },
  { key: 'deviceId', header: 'Device', render: (row) => <span className="font-mono text-xs">{row.deviceId ?? '—'}</span> },
  { key: 'status', header: 'Status', render: (row) => <Badge tone={row.revokedAt ? 'slate' : 'green'}>{row.revokedAt ? 'Revoked' : 'Active'}</Badge> },
  { key: 'createdAt', header: 'Created', render: (row) => formatDate(row.createdAt) },
  { key: 'expiresAt', header: 'Expires', render: (row) => formatDate(row.expiresAt) },
]

export default function UserSessionsPage() {
  return (
    <AuditListView
      title="User Sessions"
      description="Active and revoked refresh-token sessions per user."
      columns={columns}
      fetchPage={userSessionService.list}
      filter="userId"
    />
  )
}
