import { createPortal } from 'react-dom'
import { useEffect } from 'react'
import { AlertTriangle, CheckCircle2, ChevronDown, Clock, RefreshCw, Sparkles, Timer, Truck, X } from 'lucide-react'
import { formatDate } from '@/lib/format'
import { buildOrderJourney, JOURNEY_STATES, type DropoffKind, type RaceKind } from '@/lib/orderJourney'
import type { OrderRow } from '@/services/orderService'
import { OrderJourneyDiagram } from './OrderJourneyDiagram'
import { OrderStatusBadge } from './OrderStatusBadge'

const raceStyles: Record<RaceKind, { tone: string; icon: typeof Clock }> = {
  'partner-waited': { tone: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300', icon: Timer },
  'food-waited': { tone: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300', icon: Timer },
  together: { tone: 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300', icon: CheckCircle2 },
  'partner-pending': { tone: 'border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-300', icon: Clock },
  'food-pending': { tone: 'border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-300', icon: Clock },
  'not-applicable': { tone: 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-400', icon: Clock },
}

const dropoffStyles: Record<DropoffKind, { tone: string; icon: typeof Truck }> = {
  clean: { tone: 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300', icon: CheckCircle2 },
  retried: { tone: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300', icon: RefreshCw },
  failed: { tone: 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300', icon: AlertTriangle },
  pending: { tone: 'border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-300', icon: Truck },
  'not-applicable': { tone: 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-400', icon: Truck },
}

const FURTHER_IDEAS = [
  'Use live GPS distance to trigger "Nearby" instead of a fixed timer, so it reflects the actual last-mile ETA.',
  'Support multi-attempt delivery windows / rescheduling instead of a single unavailable-then-return outcome.',
  'Drive Payment Pending/Failed off real payment-gateway webhooks rather than an optimistic client-side assumption.',
  'Alert ops automatically when rider-wait-at-store or food-wait-for-pickup crosses an SLA threshold.',
]

export function OrderJourneyOverlay({ open, onClose, order }: { open: boolean; onClose: () => void; order: OrderRow }) {
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  const journey = buildOrderJourney(order)
  const raceStyle = raceStyles[journey.race.kind]
  const RaceIcon = raceStyle.icon
  const dropoffStyle = dropoffStyles[journey.dropoff.kind]
  const DropoffIcon = dropoffStyle.icon
  const reachedStates = JOURNEY_STATES.filter((s) => journey.nodes[s.id].reached).sort((a, b) => {
    const atA = journey.nodes[a.id].at
    const atB = journey.nodes[b.id].at
    return (atA ? new Date(atA).getTime() : 0) - (atB ? new Date(atB).getTime() : 0)
  })
  const showDropoff = journey.deliveryType === 'delivery'
  const slaRows: { label: string; minutes: number | null }[] = [
    { label: 'Kitchen prep time', minutes: journey.sla.kitchenPrepMinutes },
    { label: 'Rider travel to store', minutes: journey.sla.riderTravelToStoreMinutes },
    { label: 'Rider wait at store', minutes: journey.sla.riderWaitAtStoreMinutes },
    { label: 'Food wait for pickup', minutes: journey.sla.foodWaitForPickupMinutes },
    { label: 'Handoff to drop-off', minutes: journey.sla.handoffToDropoffMinutes },
    { label: 'Total fulfillment time', minutes: journey.sla.totalFulfillmentMinutes },
  ].filter((r) => r.minutes !== null)

  const terminalNote: Record<string, string> = {
    'cancelled-by-customer': 'Customer cancelled',
    'rejected-by-restaurant': 'Rejected by restaurant',
    'auto-cancelled': 'System auto-cancelled',
    returned: 'Returned / refunded',
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex bg-slate-900/50 backdrop-blur-sm dark:bg-slate-950/70">
      <div className="m-3 flex flex-1 flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900 sm:m-6">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">Order flow — {order.uniqueOrderId}</h2>
              <OrderStatusBadge status={order.statusName} />
            </div>
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
              {order.customerName} · {order.restaurantName} · <span className="capitalize">{order.deliveryType}</span> ·{' '}
              <span className="uppercase">{order.paymentMode}</span>
            </p>
          </div>
          <button onClick={onClose} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300" aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-5 lg:flex-row lg:overflow-hidden">
          <div className="flex flex-1 flex-col gap-3 lg:overflow-y-auto">
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/40">
              <OrderJourneyDiagram journey={journey} />
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-slate-100 px-4 py-3 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
              <LegendLine colorClass="bg-emerald-500" label="Path taken" />
              <LegendLine colorClass="bg-sky-500" label="Self-pickup shortcut" />
              <LegendLine colorClass="bg-rose-500" label="Cancellation / rejection" />
              <LegendLine colorClass="bg-amber-500" label="Reassignment" />
              <LegendLine colorClass="bg-violet-500" label="Refund / return" />
              <LegendLine colorClass="bg-slate-300 dark:bg-slate-600" label="Possible, not taken" />
              <span className="ml-auto flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-brand-500" /> Current (pulsing)
              </span>
            </div>
          </div>

          <div className="flex w-full flex-col gap-3 lg:w-80 lg:shrink-0 lg:overflow-y-auto">
            <div className={`flex items-start gap-2.5 rounded-xl border px-4 py-3 text-sm ${raceStyle.tone}`}>
              <RaceIcon size={17} className="mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold">Pickup timing</p>
                <p className="mt-0.5 text-xs leading-relaxed">{journey.race.message}</p>
              </div>
            </div>

            {showDropoff && (
              <div className={`flex items-start gap-2.5 rounded-xl border px-4 py-3 text-sm ${dropoffStyle.tone}`}>
                <DropoffIcon size={17} className="mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold">Drop-off timing</p>
                  <p className="mt-0.5 text-xs leading-relaxed">{journey.dropoff.message}</p>
                </div>
              </div>
            )}

            {journey.wasReassigned && (
              <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
                <RefreshCw size={17} className="mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold">Delivery partner reassigned</p>
                  <p className="mt-0.5 text-xs leading-relaxed">The original rider dropped out — a replacement was matched before pickup.</p>
                </div>
              </div>
            )}

            {journey.terminalKind !== 'in-progress' && journey.terminalKind !== 'delivered' && journey.cancelledFrom && (
              <div className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
                <AlertTriangle size={17} className="mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold">{terminalNote[journey.terminalKind] ?? 'Order ended'}</p>
                  <p className="mt-0.5 text-xs leading-relaxed">
                    Right after reaching "{JOURNEY_STATES.find((s) => s.id === journey.cancelledFrom)?.title}".
                  </p>
                </div>
              </div>
            )}

            {slaRows.length > 0 && (
              <div className="card p-4">
                <h3 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">SLA metrics</h3>
                <dl className="space-y-2 text-sm">
                  {slaRows.map((r) => (
                    <div key={r.label} className="flex items-center justify-between">
                      <dt className="text-slate-500 dark:text-slate-400">{r.label}</dt>
                      <dd className="font-medium text-slate-700 dark:text-slate-200">{r.minutes} min</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}

            <div className="card p-4">
              <h3 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">Milestones reached</h3>
              <ol className="space-y-2.5 text-sm">
                {reachedStates.map((s) => (
                  <li key={s.id} className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                        {s.number}
                      </span>
                      {s.title}
                    </span>
                    <span className="shrink-0 text-xs text-slate-400 dark:text-slate-500">{formatDate(journey.nodes[s.id].at)}</span>
                  </li>
                ))}
              </ol>
            </div>

            <details className="card group p-4">
              <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold text-slate-700 dark:text-slate-200">
                <span className="flex items-center gap-2">
                  <Sparkles size={15} className="text-brand-500" /> What's next
                </span>
                <ChevronDown size={15} className="text-slate-400 transition-transform group-open:rotate-180" />
              </summary>
              <ul className="mt-3 space-y-2.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                {FURTHER_IDEAS.map((tip, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-slate-300 dark:bg-slate-600" />
                    {tip}
                  </li>
                ))}
              </ul>
            </details>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}

function LegendLine({ colorClass, label }: { colorClass: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`h-0.5 w-5 rounded-full ${colorClass}`} />
      {label}
    </span>
  )
}
