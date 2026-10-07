import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ExternalLink, UserCheck } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { EmptyState, LoadingBlock } from '@/components/ui/Feedback'
import { useAsync } from '@/hooks/useAsync'
import { deliveryGuyService } from '@/services/deliveryGuyService'
import { PartnerApplicationReview } from '@/components/deliveryGuys/PartnerApplicationReview'
import { classNames } from '@/lib/format'
import type { PartnerApprovalStatus } from '@/types/entities'

const TABS: { status: PartnerApprovalStatus; label: string }[] = [
  { status: 'PENDING', label: 'Pending' },
  { status: 'REJECTED', label: 'Rejected' },
  { status: 'APPROVED', label: 'Approved' },
]

/**
 * Delivery partner applications from the rider app: verify the sign-up details and licence photo, then
 * approve (they can go online and take orders) or reject with a reason (they can fix and resubmit).
 */
export default function DeliveryPartnerApprovalsPage() {
  const [status, setStatus] = useState<PartnerApprovalStatus>('PENDING')
  const { data, isLoading, reload } = useAsync(() => deliveryGuyService.list({ page: 1, perPage: 50 }, status), [status])

  return (
    <div>
      <PageHeader title="Partner approvals" description="Verify new delivery partners before they can take orders." />
      <div className="mb-4 inline-flex rounded-lg bg-slate-100 p-1 text-sm font-medium dark:bg-slate-800">
        {TABS.map((t) => (
          <button
            key={t.status}
            onClick={() => setStatus(t.status)}
            className={classNames(
              'rounded-md px-3 py-1.5',
              status === t.status ? 'bg-white text-slate-800 shadow-sm dark:bg-slate-900 dark:text-slate-100' : 'text-slate-500 dark:text-slate-400',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {isLoading && <LoadingBlock />}
      {!isLoading && data && data.data.length === 0 && (
        <EmptyState title={status === 'PENDING' ? 'No applications waiting' : `No ${status.toLowerCase()} partners`} icon={<UserCheck size={22} />} />
      )}
      <div className="space-y-4">
        {/* Never show the previous tab's partners (with their Approve/Reject buttons) while the next tab loads. */}
        {!isLoading && data?.data.map((p) => (
          <div key={p.id} className="card p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">{p.name}</h2>
              {p.userId && (
                <Link to={`/admin/delivery-guys/${p.userId}`} className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline">
                  Partner page <ExternalLink size={12} />
                </Link>
              )}
            </div>
            <PartnerApplicationReview partner={p} onReviewed={() => reload()} />
          </div>
        ))}
      </div>
    </div>
  )
}
