import { PageHeader } from '@/components/ui/PageHeader'
import { StorePayoutsTable } from '@/components/finance/StorePayoutsTable'

export default function RestaurantPayoutsPage() {
  return (
    <div>
      <PageHeader title="Store Payouts" description="Settle earnings requested by store owners." />
      <StorePayoutsTable />
    </div>
  )
}
