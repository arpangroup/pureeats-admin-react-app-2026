import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { BellRing } from 'lucide-react'
import { useAsync } from '@/hooks/useAsync'
import { riderOfferService } from '@/services/riderOfferService'
import type { OrderRow } from '@/services/orderService'
import { RiderOfferDetails } from './RiderOfferDetails'

/** On the order page: which delivery partners were alerted about this order, who dismissed it, and the next alert. */
export function RiderOffersCard({ order }: { order: OrderRow }) {
  const { data, reload } = useAsync(() => riderOfferService.forOrder(order.id), [order.id, order.statusName])

  // Keep it current while the order is waiting - re-alerts happen every few minutes.
  useEffect(() => {
    if (data?.state !== 'WAITING') return
    const id = setInterval(reload, 30_000)
    return () => clearInterval(id)
  }, [data?.state, reload])

  if (order.deliveryType === 'pickup' || !data) return null

  return (
    <div className="card p-4 print:hidden">
      <h2 className="mb-3 flex items-center justify-between gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
        <span className="flex items-center gap-2">
          <BellRing size={16} /> Delivery partner alerts
        </span>
        <Link to="/admin/partner-alerts" className="text-xs font-medium text-brand-600 hover:underline">
          All waiting orders
        </Link>
      </h2>
      <RiderOfferDetails summary={data} />
    </div>
  )
}
