import type { ReactNode } from 'react'
import { AlertTriangle, Bike, Building2, CheckCircle2, Clock, ExternalLink, Landmark, PieChart, Store } from 'lucide-react'
import { useAsync } from '@/hooks/useAsync'
import { orderService, type OrderRow } from '@/services/orderService'
import { formatCurrency } from '@/lib/format'
import { SETTINGS_LINKS } from '@/lib/settingsLinks'

function ConfigLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <a href={to} target="_blank" rel="noopener noreferrer" className="ml-1 inline-flex items-center gap-0.5 text-[11px] font-medium text-brand-600 hover:underline dark:text-brand-400">
      {children} <ExternalLink size={10} />
    </a>
  )
}

function Line({ label, value, children }: { label: ReactNode; value: string; children?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 text-xs">
      <span className="text-slate-500 dark:text-slate-400">
        {label}
        {children}
      </span>
      <span className="shrink-0 tabular-nums text-slate-700 dark:text-slate-200">{value}</span>
    </div>
  )
}

function Status({ recorded, notRecorded = false }: { recorded: boolean; notRecorded?: boolean }) {
  if (notRecorded) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-700 dark:bg-rose-500/10 dark:text-rose-400" title="Delivered without the earnings being recorded">
        <AlertTriangle size={11} /> Not recorded
      </span>
    )
  }
  return recorded ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
      <CheckCircle2 size={11} /> Recorded
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-500/10 dark:text-amber-400" title="Becomes final when the order is completed">
      <Clock size={11} /> Projected
    </span>
  )
}

function Party({ icon, title, amount, recorded, notRecorded, children }: { icon: ReactNode; title: ReactNode; amount: number; recorded: boolean | null; notRecorded?: boolean; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-100 p-3 dark:border-slate-800">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">{icon}</span>
          <span className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{title}</span>
          {recorded !== null && <Status recorded={recorded} notRecorded={notRecorded} />}
        </div>
        <span className="shrink-0 text-base font-bold tabular-nums text-slate-900 dark:text-white">{formatCurrency(amount)}</span>
      </div>
      <div className="mt-2 space-y-1 border-t border-slate-100 pt-2 dark:border-slate-800">{children}</div>
    </div>
  )
}

/**
 * "Who earns what" for one order (admin only): the restaurant's payout, the delivery partner's earning and
 * PureEats' share, with how each was calculated and links to the rate behind each line. Fulfilled orders
 * show what was recorded at delivery; open orders show what will be recorded. The shares plus tax always
 * add up to what the customer paid.
 */
export function OrderEarningsCard({ order }: { order: OrderRow }) {
  const { data: e, isLoading, error } = useAsync(() => orderService.earnings(order), [order.id, order.statusName])
  const storeEdit = `/admin/restaurants/${order.restaurantId}/edit`

  return (
    <div className="card p-4 print:hidden">
      <h2 className="mb-1 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
        <PieChart size={16} /> Who earns what
      </h2>
      <p className="mb-3 text-xs text-slate-400 dark:text-slate-500">How the customer's payment is shared between the restaurant, the delivery partner and PureEats.</p>

      {isLoading && <p className="text-sm text-slate-400">Calculating shares…</p>}
      {error && <p className="text-sm text-rose-600">Couldn't load the earnings split.</p>}

      {e && (
        <div className="space-y-3">
          <Party icon={<Store size={14} />} title={e.restaurant.restaurantName} amount={e.restaurant.amount} recorded={e.restaurant.finalized}>
            {e.restaurant.recordedUnderEarlierRule ? (
              <>
                <Line label="Recorded at delivery" value={formatCurrency(e.restaurant.amount)} />
                <p className="text-[11px] text-amber-600 dark:text-amber-400">
                  Completed under the earlier payout rule (item total − packaging, no commission). Today's rule would give item total − commission + packaging.
                </p>
              </>
            ) : (
              <>
                <Line label="Item total" value={formatCurrency(e.restaurant.itemTotal)} />
                <Line label={`− Commission (${e.restaurant.commissionPercentage}%${e.restaurant.storeOwnRate ? ', store rate' : ', platform default'})`} value={`−${formatCurrency(e.restaurant.commissionAmount)}`}>
                  <ConfigLink to={e.restaurant.storeOwnRate ? storeEdit : SETTINGS_LINKS.commerce}>{e.restaurant.storeOwnRate ? 'Store' : 'Default commission'}</ConfigLink>
                </Line>
                <Line label="+ Packaging charge" value={`+${formatCurrency(e.restaurant.packagingCharge)}`}>
                  <ConfigLink to={storeEdit}>Store</ConfigLink>
                </Line>
              </>
            )}
          </Party>

          <Party
            icon={<Bike size={14} />}
            title={e.rider.assigned ? e.rider.riderName ?? 'Delivery partner' : 'Delivery partner'}
            amount={e.rider.amount}
            recorded={e.rider.assigned ? e.rider.finalized : null}
            notRecorded={e.rider.notRecorded}
          >
            {e.rider.assigned ? (
              <>
                <Line
                  label={`Commission ${e.rider.commissionRate ?? 0}%${e.rider.ownRate ? ' (partner rate)' : ' (platform default)'} × ${formatCurrency(e.rider.commissionBase ?? 0)} (${e.rider.commissionBasis === 'DELIVERY_CHARGE_ONLY' ? 'delivery charge' : 'order total'})`}
                  value={formatCurrency(e.rider.commissionAmount)}
                >
                  {e.rider.ownRate && e.rider.riderUserId ? (
                    <ConfigLink to={`/admin/delivery-guys/${e.rider.riderUserId}#commission`}>Partner rate</ConfigLink>
                  ) : (
                    <ConfigLink to={SETTINGS_LINKS.riderEarnings}>Default commission</ConfigLink>
                  )}
                </Line>
                <Line label="+ Customer tip (paid in full)" value={`+${formatCurrency(e.rider.tip)}`} />
                <p className="text-[11px] text-slate-400">
                  {e.rider.ownRate
                    ? "This partner has their own rate - set it to 0 on the partner's page to use the platform default."
                    : 'No rate of their own - uses Settings → Delivery Application → Earnings → Default delivery partner commission.'}
                </p>
                {e.rider.notRecorded && (
                  <p className="text-[11px] text-rose-600 dark:text-rose-400">
                    Marked delivered by an admin before that path recorded earnings. It's recorded and credited to the partner automatically when the backend starts - refresh after the next deploy.
                  </p>
                )}
              </>
            ) : (
              <p className="text-xs text-slate-400">No delivery partner on this order{order.deliveryType === 'pickup' ? ' (self-pickup)' : ' yet'}.</p>
            )}
          </Party>

          <Party icon={<Building2 size={14} />} title="PureEats" amount={e.platform.amount} recorded={e.restaurant.finalized}>
            <Line label="Kept from the restaurant (commission)" value={formatCurrency(e.platform.commission)}>
              <ConfigLink to={SETTINGS_LINKS.commerce}>Commerce</ConfigLink>
            </Line>
            <Line label="+ Platform fee" value={`+${formatCurrency(e.platform.platformFee)}`}>
              <ConfigLink to={SETTINGS_LINKS.platformFee}>Platform fee</ConfigLink>
            </Line>
            <Line label="+ Delivery charge" value={`+${formatCurrency(e.platform.deliveryCharge)}`}>
              <ConfigLink to={storeEdit}>Store delivery rates</ConfigLink>
            </Line>
            <Line label="− Paid to the delivery partner (commission)" value={`−${formatCurrency(e.platform.riderCommission)}`} />
            <Line label="− Discount (coupons are platform-funded)" value={`−${formatCurrency(e.platform.discount)}`} />
          </Party>

          <div className="flex items-start gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
            <Landmark size={14} className="mt-0.5 shrink-0" />
            <div className="flex-1">
              <div className="flex justify-between gap-3">
                <span>
                  Tax collected (for the government)
                  <ConfigLink to={SETTINGS_LINKS.commerce}>Tax rate</ConfigLink>
                </span>
                <span className="tabular-nums">{formatCurrency(e.taxCollected)}</span>
              </div>
              <div className="mt-1 flex justify-between gap-3 border-t border-slate-200 pt-1 font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200">
                <span>Restaurant + partner + PureEats + tax</span>
                <span className="tabular-nums">
                  {formatCurrency(e.restaurant.amount + e.rider.amount + e.platform.amount + e.taxCollected)} = {formatCurrency(e.customerPaid)} paid
                </span>
              </div>
              {!e.ratesFromSnapshot && <p className="mt-1 text-[11px]">This order predates rate snapshots - open shares use the current rates.</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
