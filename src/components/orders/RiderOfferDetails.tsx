import { BellRing, EyeOff } from 'lucide-react'
import { Badge } from '@/components/ui/Feedback'
import { Countdown } from '@/components/ui/Countdown'
import { formatDate } from '@/lib/format'
import type { OfferState, RiderOfferSummary } from '@/services/riderOfferService'

const STATE: Record<OfferState, { label: string; tone: 'green' | 'amber' | 'red' | 'slate' | 'blue' }> = {
  WAITING: { label: 'Waiting for a partner', tone: 'amber' },
  ASSIGNED: { label: 'Partner assigned', tone: 'green' },
  STOPPED_MAX: { label: 'Alerts stopped - max reached', tone: 'red' },
  DISABLED: { label: 'Re-alerts switched off', tone: 'slate' },
  NOT_OFFERED: { label: 'Not offered to partners', tone: 'slate' },
  ENDED: { label: 'No longer offered', tone: 'slate' },
}

export function OfferStateBadge({ state }: { state: OfferState }) {
  const s = STATE[state]
  return <Badge tone={s.tone}>{s.label}</Badge>
}

/**
 * One order's partner alerts: each round (who was alerted, when), who dismissed it and in which round, and when the
 * next alert is due - shared by the order page and the Partner alerts page.
 */
export function RiderOfferDetails({ summary }: { summary: RiderOfferSummary }) {
  const limit = summary.mode === 'UNTIL_ASSIGNED' ? 'until a partner accepts' : `up to ${summary.maxOffers} alerts`
  return (
    <div className="space-y-3 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <OfferStateBadge state={summary.state} />
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {summary.offerCount} alert{summary.offerCount === 1 ? '' : 's'} sent · every {summary.intervalMinutes} min, {limit}
        </span>
        {summary.state === 'WAITING' && summary.nextOfferAt && <Countdown to={summary.nextOfferAt} label="Next alert in" lateLabel="due now" />}
      </div>
      {summary.state === 'WAITING' && summary.nextOfferAt && (
        <p className="text-xs text-slate-500 dark:text-slate-400">Next alert at {formatDate(summary.nextOfferAt)} (the scheduler checks every minute).</p>
      )}
      {summary.noRiderAlertedAt && (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
          Admins were alerted at {formatDate(summary.noRiderAlertedAt)} that no partner took it - assign one from the order page.
        </p>
      )}

      {summary.rounds.length === 0 ? (
        <p className="text-xs text-slate-400">No delivery partner has been alerted yet.</p>
      ) : (
        <ol className="space-y-2">
          {summary.rounds.map((r) => (
            <li key={r.round} className="rounded-lg border border-slate-100 p-2.5 dark:border-slate-800">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
                <BellRing size={13} className="text-brand-600" /> Alert {r.round}
                {r.notifiedAt ? ` · ${formatDate(r.notifiedAt)}` : ''} · {r.partners.length} partner{r.partners.length === 1 ? '' : 's'}
              </p>
              {r.partners.length === 0 ? (
                <p className="mt-1 text-[11px] text-slate-400">Nobody was eligible ({summary.dispatchMode === 'LINKED_STORES' ? 'no linked partner online' : 'no partner online in range'}).</p>
              ) : (
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{r.partners.map((p) => p.name + (p.phone ? ` (${p.phone})` : '')).join(', ')}</p>
              )}
            </li>
          ))}
        </ol>
      )}

      {summary.dismissals.length > 0 && (
        <div>
          <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
            <EyeOff size={13} className="text-slate-400" /> Dismissed by
          </p>
          <ul className="space-y-0.5 text-xs text-slate-500 dark:text-slate-400">
            {summary.dismissals.map((d) => (
              <li key={`${d.partner.userId}-${d.round}`}>
                {d.partner.name} - alert {d.round}, {formatDate(d.dismissedAt)}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
