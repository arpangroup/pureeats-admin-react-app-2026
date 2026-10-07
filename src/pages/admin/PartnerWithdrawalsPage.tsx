import { PageHeader } from '@/components/ui/PageHeader'
import { LoadingBlock } from '@/components/ui/Feedback'
import { useAsync } from '@/hooks/useAsync'
import { riderSettlementService } from '@/services/riderSettlementService'
import { WithdrawalRequestList } from '@/components/deliveryGuys/WithdrawalRequestList'

/** Every delivery partner's wallet withdrawal request waiting to be paid, oldest first. */
export default function PartnerWithdrawalsPage() {
  const { data, isLoading, reload } = useAsync(() => riderSettlementService.withdrawals('REQUESTED'), [])
  return (
    <div>
      <PageHeader title="Partner withdrawals" description="Delivery partners asking to withdraw their wallet earnings. Transfer, then mark paid." />
      <div className="card p-4">
        {isLoading ? <LoadingBlock /> : <WithdrawalRequestList requests={data ?? []} showPartner onChanged={reload} />}
      </div>
    </div>
  )
}
