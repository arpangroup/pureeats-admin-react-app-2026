import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BellRing, ChevronDown, ChevronRight, Clock, RefreshCw, Settings2 } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Badge, EmptyState, LoadingBlock } from '@/components/ui/Feedback'
import { Countdown } from '@/components/ui/Countdown'
import { useAsync } from '@/hooks/useAsync'
import { riderOfferService } from '@/services/riderOfferService'
import { formatCurrency, formatDate } from '@/lib/format'
import { OfferStateBadge, RiderOfferDetails } from '@/components/orders/RiderOfferDetails'

const DISPATCH: Record<string, string> = { LINKED_STORES: 'Partners linked to the store', NEARBY: 'Partners near the store', ALL: 'All online partners' }

/**
 * The re-offer scheduler at a glance: its settings, when it last ran and runs next, what each recent run did, and
 * every order still waiting for a delivery partner - who was alerted in each round, who dismissed, and when the
 * next alert is due. Refreshes every 15 seconds.
 */
export default function PartnerAlertsPage() {
  const { data, isLoading, error, reload } = useAsync(() => riderOfferService.overview(), [])
  const [open, setOpen] = useState<number | null>(null)

  useEffect(() => {
    const id = setInterval(reload, 15_000)
    return () => clearInterval(id)
  }, [reload])

  return (
    <div>
      <PageHeader
        title="Partner Alerts"
        description="Who is told about new orders, who dismissed them, and when orders nobody has taken are offered again."
        actions={
          <button className="btn-secondary" onClick={reload}>
            <RefreshCw size={15} /> Refresh
          </button>
        }
      />

      {isLoading && !data ? (
        <LoadingBlock />
      ) : error && !data ? (
        <EmptyState title="Could not load partner alerts" description={error} />
      ) : data ? (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="card p-4">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                <Clock size={14} /> Scheduler
              </p>
              <div className="mt-2 flex items-center gap-2">
                <Badge tone={data.enabled ? 'green' : 'slate'}>{data.enabled ? 'Re-alerts on' : 'Re-alerts off'}</Badge>
                {data.nextRunAt && <Countdown to={data.nextRunAt} label="Next run in" lateLabel="running" />}
              </div>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Last run: {data.lastRunAt ? formatDate(data.lastRunAt) : 'not yet (runs every minute)'}</p>
              {data.nextRunAt && <p className="text-sm text-slate-600 dark:text-slate-300">Next run: {formatDate(data.nextRunAt)}</p>}
            </div>
            <div className="card p-4">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                <Settings2 size={14} /> Rules
              </p>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Alert again every {data.intervalMinutes} min</p>
              <p className="text-sm text-slate-600 dark:text-slate-300">{data.mode === 'UNTIL_ASSIGNED' ? 'Until a partner accepts (no limit)' : `Up to ${data.maxOffers} alerts per order`}</p>
              <p className="text-sm text-slate-600 dark:text-slate-300">Who: {DISPATCH[data.dispatchMode] ?? data.dispatchMode}</p>
              <Link to="/admin/settings/delivery-app" className="mt-1 inline-block text-xs font-medium text-brand-600 hover:underline">
                Change in Settings → Delivery Application → New order alerts
              </Link>
            </div>
            <div className="card p-4">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                <BellRing size={14} /> Waiting now
              </p>
              <p className="mt-2 text-3xl font-bold text-slate-800 dark:text-slate-100">{data.waitingOrders.length}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">accepted by the store, no delivery partner yet</p>
            </div>
          </div>

          <div className="card p-4">
            <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">Orders waiting for a delivery partner</h2>
            {data.waitingOrders.length === 0 ? (
              <p className="text-sm text-slate-400">None right now - every accepted delivery order has a partner.</p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {data.waitingOrders.map((o) => {
                  const lastRound = o.alerts.rounds[o.alerts.rounds.length - 1]
                  return (
                    <div key={o.orderId} className="py-2">
                      <button type="button" className="flex w-full flex-wrap items-center gap-x-3 gap-y-1 text-left" onClick={() => setOpen(open === o.orderId ? null : o.orderId)}>
                        {open === o.orderId ? <ChevronDown size={15} className="text-slate-400" /> : <ChevronRight size={15} className="text-slate-400" />}
                        <span className="font-mono text-sm font-semibold text-slate-800 dark:text-slate-100">{o.uniqueOrderId}</span>
                        <span className="text-sm text-slate-600 dark:text-slate-300">{o.restaurantName}</span>
                        <span className="text-xs text-slate-400">
                          {formatCurrency(o.payable)} · {o.paymentMode} · placed {formatDate(o.placedAt)}
                        </span>
                        <span className="ml-auto flex flex-wrap items-center gap-2">
                          <OfferStateBadge state={o.alerts.state} />
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {o.alerts.offerCount} alert{o.alerts.offerCount === 1 ? '' : 's'}
                            {lastRound ? ` · last to ${lastRound.partners.length} partner${lastRound.partners.length === 1 ? '' : 's'}` : ''}
                            {o.alerts.dismissals.length > 0 ? ` · ${o.alerts.dismissals.length} dismissed` : ''}
                          </span>
                          {o.alerts.state === 'WAITING' && o.alerts.nextOfferAt && <Countdown to={o.alerts.nextOfferAt} label="Next alert in" lateLabel="due now" />}
                        </span>
                      </button>
                      {open === o.orderId && (
                        <div className="mt-3 pl-6">
                          <RiderOfferDetails summary={o.alerts} />
                          <Link to={`/admin/orders/${o.orderId}`} className="mt-2 inline-block text-xs font-medium text-brand-600 hover:underline">
                            Open the order to assign a partner
                          </Link>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="card p-4">
            <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">Recent scheduler runs</h2>
            {data.recentRuns.length === 0 ? (
              <p className="text-sm text-slate-400">No runs recorded yet - the scheduler runs every minute.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-xs uppercase tracking-wide text-slate-400">
                    <tr>
                      <th className="py-1.5 pr-3 font-medium">Ran at</th>
                      <th className="py-1.5 pr-3 font-medium">Waiting</th>
                      <th className="py-1.5 pr-3 font-medium">Alerted again</th>
                      <th className="py-1.5 pr-3 font-medium">Partners alerted</th>
                      <th className="py-1.5 pr-3 font-medium">Admins told</th>
                      <th className="py-1.5 font-medium">Orders</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {data.recentRuns.map((r) => (
                      <tr key={r.ranAt} className={r.reoffered > 0 || r.adminAlerts > 0 ? '' : 'text-slate-400'}>
                        <td className="py-1.5 pr-3 whitespace-nowrap">{formatDate(r.ranAt)}</td>
                        <td className="py-1.5 pr-3">{r.enabled ? r.waitingOrders : 'off'}</td>
                        <td className="py-1.5 pr-3">{r.reoffered}</td>
                        <td className="py-1.5 pr-3">{r.partnersAlerted}</td>
                        <td className="py-1.5 pr-3">{r.adminAlerts}</td>
                        <td className="py-1.5 font-mono text-xs">{r.reofferedOrders.join(', ') || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}
