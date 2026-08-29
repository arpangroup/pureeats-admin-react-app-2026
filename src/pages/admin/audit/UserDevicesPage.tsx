import { AuditListView } from '@/components/audit/AuditListView'
import { userDeviceService } from '@/services/auditService'
import { formatDate } from '@/lib/format'
import type { Column } from '@/components/DataTable'
import type { UserDevice } from '@/types/audit'

const columns: Column<UserDevice>[] = [
  { key: 'userId', header: 'User ID', render: (row) => row.userId },
  { key: 'deviceId', header: 'Device', render: (row) => <span className="font-mono text-xs">{row.deviceId}</span> },
  { key: 'platform', header: 'Platform', render: (row) => `${row.operatingSystem ?? '—'} · ${row.browser ?? '—'}` },
  { key: 'ipAddress', header: 'IP', render: (row) => row.ipAddress ?? '—' },
  { key: 'lastSeenAt', header: 'Last seen', render: (row) => formatDate(row.lastSeenAt) },
  { key: 'lastLoginAt', header: 'Last login', render: (row) => formatDate(row.lastLoginAt) },
]

export default function UserDevicesPage() {
  return (
    <AuditListView
      title="User Devices"
      description="Devices seen per user, with browser/OS and last activity."
      columns={columns}
      fetchPage={userDeviceService.list}
      filter="userId"
    />
  )
}
