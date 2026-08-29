import { AuditListView } from '@/components/audit/AuditListView'
import { Badge } from '@/components/ui/Feedback'
import { securityBlockEntryService } from '@/services/auditService'
import { formatDate } from '@/lib/format'
import type { Column } from '@/components/DataTable'
import type { SecurityBlockEntry } from '@/types/audit'

const columns: Column<SecurityBlockEntry>[] = [
  { key: 'blockType', header: 'Type', render: (row) => row.blockType },
  { key: 'value', header: 'Value', render: (row) => <span className="font-mono text-xs">{row.value}</span> },
  { key: 'reason', header: 'Reason', render: (row) => row.reason ?? '—' },
  { key: 'status', header: 'Status', render: (row) => <Badge tone={row.status === 'ACTIVE' ? 'red' : 'slate'}>{row.status}</Badge> },
  { key: 'expiresAt', header: 'Expires', render: (row) => (row.expiresAt ? formatDate(row.expiresAt) : 'Permanent') },
  { key: 'createdAt', header: 'Blocked at', render: (row) => formatDate(row.createdAt) },
]

export default function SecurityBlockEntriesPage() {
  return (
    <AuditListView
      title="Security Blocklist"
      description="IPs, devices, emails, phones and users currently blocked."
      columns={columns}
      fetchPage={securityBlockEntryService.list}
      filter="blockType"
    />
  )
}
