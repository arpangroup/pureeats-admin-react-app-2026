import { AuditListView } from '@/components/audit/AuditListView'
import { Badge } from '@/components/ui/Feedback'
import { otpChallengeService } from '@/services/auditService'
import { formatDate } from '@/lib/format'
import type { Column } from '@/components/DataTable'
import type { OtpChallenge } from '@/types/audit'

const statusTone: Record<OtpChallenge['status'], 'green' | 'slate' | 'red' | 'amber'> = {
  VERIFIED: 'green',
  PENDING: 'slate',
  EXPIRED: 'amber',
  LOCKED: 'red',
  CANCELLED: 'slate',
}

const columns: Column<OtpChallenge>[] = [
  { key: 'challengeId', header: 'Challenge', render: (row) => <span className="font-mono text-xs">{row.challengeId}</span> },
  { key: 'userId', header: 'User ID', render: (row) => row.userId ?? '—' },
  { key: 'method', header: 'Method', render: (row) => row.authenticationMethod },
  { key: 'destination', header: 'Destination', render: (row) => row.maskedDestination },
  { key: 'status', header: 'Status', render: (row) => <Badge tone={statusTone[row.status]}>{row.status}</Badge> },
  { key: 'attempts', header: 'Attempts', render: (row) => `${row.attemptCount}/${row.maxAttempts}` },
  { key: 'expiresAt', header: 'Expires', render: (row) => formatDate(row.expiresAt) },
]

export default function OtpChallengesPage() {
  return (
    <AuditListView
      title="OTP Challenges"
      description="Every OTP challenge issued for signup and login."
      columns={columns}
      fetchPage={otpChallengeService.list}
      filter="userId"
    />
  )
}
