import { AuditListView } from '@/components/audit/AuditListView'
import { rateLimitBucketService } from '@/services/auditService'
import { formatDate } from '@/lib/format'
import type { Column } from '@/components/DataTable'
import type { RateLimitBucket } from '@/types/audit'

const columns: Column<RateLimitBucket>[] = [
  { key: 'bucketKey', header: 'Bucket', render: (row) => <span className="font-mono text-xs">{row.bucketKey}</span> },
  { key: 'hitCount', header: 'Hits', render: (row) => row.hitCount },
  { key: 'windowStart', header: 'Window start', render: (row) => formatDate(row.windowStart) },
  { key: 'updatedAt', header: 'Updated', render: (row) => formatDate(row.updatedAt) },
]

export default function RateLimitBucketsPage() {
  return (
    <AuditListView
      title="Rate Limit Buckets"
      description="Current rate-limit counters for login, verify and resend endpoints."
      columns={columns}
      fetchPage={rateLimitBucketService.list}
      filter="none"
    />
  )
}
