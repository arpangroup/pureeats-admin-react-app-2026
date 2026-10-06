import type { ReactNode } from 'react'
import { Calculator, ExternalLink, Info } from 'lucide-react'
import { useAsync } from '@/hooks/useAsync'
import { useAuth } from '@/hooks/useAuth'
import { restaurantService } from '@/services/restaurantService'
import { formatCurrency } from '@/lib/format'
import { SETTINGS_LINKS } from '@/lib/settingsLinks'
import type { DeliveryChargeRates, OrderRow, PricingBreakdown } from '@/services/orderService'

/** Opens a config page in a new tab, so the admin keeps their place on the order. */
function ConfigLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <a
      href={to}
      target="_blank"
      rel="noopener noreferrer"
      className="ml-1.5 inline-flex items-center gap-0.5 text-[11px] font-medium text-brand-600 hover:underline dark:text-brand-400"
    >
      {children} <ExternalLink size={10} />
    </a>
  )
}

function Row({ label, value, note, strong }: { label: ReactNode; value: ReactNode; note?: ReactNode; strong?: boolean }) {
  return (
    <>
      <dt className={strong ? 'font-semibold text-slate-800 dark:text-slate-100' : 'text-slate-500 dark:text-slate-400'}>
        {label}
        {note && <div className="text-[11px] font-normal text-slate-400 dark:text-slate-500">{note}</div>}
      </dt>
      <dd className={strong ? 'text-right font-semibold text-slate-800 dark:text-slate-100' : 'text-right text-slate-700 dark:text-slate-200'}>{value}</dd>
    </>
  )
}

const km = (v: number) => `${Number(v.toFixed(2))} km`

interface RatesSource {
  rates: DeliveryChargeRates
  /** True when these are the restaurant's CURRENT rates (order predates the snapshot), not the ones applied. */
  current: boolean
}

/**
 * Step-by-step delivery charge: FIXED = flat charge; DYNAMIC = base charge for the first N km, plus
 * one extra charge per started extra-distance step beyond that. Uses the rates snapshotted on the
 * order; for older orders falls back to the restaurant's current rates, labelled as such, and flags
 * when they don't reproduce the stored amount.
 */
function DeliveryChargeSteps({ breakdown, source }: { breakdown: PricingBreakdown; source: RatesSource | null }) {
  const basis = breakdown.deliveryChargeBasis
  const stored = breakdown.deliveryChargeAmount
  if (basis === 'SELF_PICKUP') return <p>Self-pickup order - no delivery charge.</p>
  if (basis === 'FREE_DELIVERY_COUPON') return <p>A free-delivery coupon was applied - delivery charge waived.</p>
  if (!source) return <p>Restaurant delivery rates unavailable.</p>

  const { rates, current } = source
  let lines: { label: string; amount: number }[] = []
  let formula = ''
  let computed = 0

  if (basis === 'FIXED') {
    const flat = rates.flatCharge ?? 0
    lines = [{ label: 'Flat delivery charge (same for any distance)', amount: flat }]
    formula = `${formatCurrency(flat)}`
    computed = flat
  } else {
    const base = rates.baseCharge ?? 0
    const baseKm = rates.baseDistanceKm ?? 0
    const extra = rates.extraCharge ?? 0
    const step = rates.extraDistanceKm ?? 0
    const beyond = Math.max(0, breakdown.distanceKm - baseKm)
    const units = !current && rates.extraUnits != null ? rates.extraUnits : step > 0 && beyond > 0 ? Math.ceil(beyond / step) : 0
    computed = base + units * extra
    lines = [{ label: `Base charge (covers the first ${baseKm} km)`, amount: base }]
    if (beyond > 0 && step > 0) {
      lines.push({
        label: `Extra distance ${km(breakdown.distanceKm)} − ${baseKm} km = ${km(beyond)} → ⌈${km(beyond)} ÷ ${step} km⌉ = ${units} × ${formatCurrency(extra)}`,
        amount: units * extra,
      })
    } else {
      lines.push({ label: `Within the base ${baseKm} km - no extra charge`, amount: 0 })
    }
    formula = `${formatCurrency(base)} + ${units} × ${formatCurrency(extra)}`
  }

  const mismatch = Math.abs(computed - stored) > 0.005

  return (
    <div className="space-y-1">
      {lines.map((l) => (
        <div key={l.label} className="flex justify-between gap-3">
          <span>{l.label}</span>
          <span className="shrink-0 tabular-nums">{formatCurrency(l.amount)}</span>
        </div>
      ))}
      <div className="flex justify-between gap-3 border-t border-slate-200 pt-1 font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200">
        <span>
          {formula} = {formatCurrency(computed)}
        </span>
        <span className="shrink-0 tabular-nums">{formatCurrency(stored)}</span>
      </div>
      {current && (
        <p className="flex items-start gap-1 text-amber-600 dark:text-amber-400">
          <Info size={11} className="mt-0.5 shrink-0" />
          This order predates rate snapshots - shown with the restaurant's current rates.
          {mismatch && ` They give ${formatCurrency(computed)}, not the ${formatCurrency(stored)} charged, so the rates have changed since.`}
        </p>
      )}
    </div>
  )
}

/** "How this was calculated" on the order details page, with each line linked to where it's configured. */
export function PricingBreakdownCard({ order, isAdmin }: { order: OrderRow; isAdmin: boolean }) {
  const b = order.pricingBreakdown!
  const { user } = useAuth()
  const needsCurrentRates = !b.deliveryChargeRates && (b.deliveryChargeBasis === 'FIXED' || b.deliveryChargeBasis === 'DYNAMIC')
  const { data: restaurant } = useAsync(
    () =>
      !needsCurrentRates
        ? Promise.resolve(undefined)
        : isAdmin
          ? restaurantService.get(order.restaurantId)
          : user
            ? restaurantService.getOwned(user.id, order.restaurantId)
            : Promise.resolve(undefined),
    [needsCurrentRates, isAdmin, order.restaurantId, user?.id],
  )

  const source: RatesSource | null = b.deliveryChargeRates
    ? { rates: b.deliveryChargeRates, current: false }
    : restaurant
      ? {
          rates: {
            flatCharge: restaurant.deliveryCharges,
            baseCharge: restaurant.baseDeliveryCharge,
            baseDistanceKm: restaurant.baseDeliveryDistance,
            extraCharge: restaurant.extraDeliveryCharge,
            extraDistanceKm: restaurant.extraDeliveryDistance,
            extraUnits: null,
          },
          current: true,
        }
      : null

  // Store-level config (restaurant charge %, delivery rates) lives on the store's edit page.
  const storeEditPath = isAdmin ? `/admin/restaurants/${order.restaurantId}/edit` : `/restaurant-owner/restaurants/${order.restaurantId}/edit`
  const platformFee = order.platformFee ?? 0
  const tip = order.driverTipAmount ?? 0
  const sum = b.amountAfterDiscount + b.taxAmount + b.restaurantChargeAmount + b.deliveryChargeAmount + platformFee + tip
  const mapsUrl =
    b.restaurantLatitude && b.customerLatitude
      ? `https://www.google.com/maps/dir/?api=1&travelmode=driving&origin=${b.restaurantLatitude},${b.restaurantLongitude}&destination=${b.customerLatitude},${b.customerLongitude}`
      : null

  return (
    <div className="card p-4 print:hidden">
      <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
        <Calculator size={16} /> How this was calculated
      </h2>
      <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1.5 text-sm">
        <Row label="Item total" value={formatCurrency(b.itemTotal)} note="Menu price of every item and add-on, times quantity." />
        <Row
          label="Discount"
          value={`-${formatCurrency(b.discountAmount)}`}
          note={order.coupon?.code ? `Coupon ${order.coupon.code}` : 'No coupon applied'}
        />
        <Row label="Amount after discount" value={formatCurrency(b.amountAfterDiscount)} />
        <Row
          label={
            <>
              Tax ({b.taxPercentage}%)
              {isAdmin && <ConfigLink to={SETTINGS_LINKS.commerce}>Settings → Commerce</ConfigLink>}
            </>
          }
          value={formatCurrency(b.taxAmount)}
          note={`${b.taxPercentage}% of ${formatCurrency(b.amountAfterDiscount)} - rate at the time of the order`}
        />
        <Row
          label={
            <>
              Restaurant charge ({b.restaurantChargePercentage}%)
              <span className="ml-1.5 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                Packaging
              </span>
              <ConfigLink to={storeEditPath}>Store settings</ConfigLink>
            </>
          }
          value={formatCurrency(b.restaurantChargeAmount)}
          note={`Packaging & handling charge, set per store - ${b.restaurantChargePercentage}% of ${formatCurrency(b.amountAfterDiscount)}, charged to the customer on top of the items.`}
        />
        <Row
          label={
            <>
              Delivery charge
              <ConfigLink to={storeEditPath}>Store delivery rates</ConfigLink>
            </>
          }
          value={formatCurrency(b.deliveryChargeAmount)}
          note={<span className="capitalize">{b.deliveryChargeBasis.toLowerCase().replace(/_/g, ' ')}</span>}
        />
        <dd className="col-span-2 -mt-0.5 mb-1 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
          <DeliveryChargeSteps breakdown={b} source={source} />
        </dd>
        <Row
          label={
            <>
              Platform fee
              {isAdmin && <ConfigLink to={SETTINGS_LINKS.platformFee}>Settings → Platform fee</ConfigLink>}
            </>
          }
          value={formatCurrency(platformFee)}
          note={
            platformFee > 0
              ? 'Flat fee PureEats adds to every order to run the service (payments, app, customer support). Kept by the platform.'
              : 'Flat fee PureEats can add to every order to run the service - not charged on this order (set to ₹0).'
          }
        />
        <Row
          label="Delivery partner tip"
          value={formatCurrency(tip)}
          note={tip > 0 ? 'Chosen by the customer - paid to the rider in full.' : 'No tip added by the customer.'}
        />
        <div className="col-span-2 my-1 border-t border-slate-200 dark:border-slate-700" />
        <Row label="Customer paid" value={formatCurrency(order.payable)} strong />
        {Math.abs(sum - order.payable) > 0.01 && (
          <p className="col-span-2 text-[11px] text-amber-600 dark:text-amber-400">
            Lines above add up to {formatCurrency(sum)} (difference {formatCurrency(order.payable - sum)}).
          </p>
        )}

        <div className="col-span-2 my-1 border-t border-dashed border-slate-200 dark:border-slate-700" />
        <Row
          label="Distance (restaurant → customer)"
          value={
            <>
              {b.distanceKm} km
              {mapsUrl && <ConfigLink to={mapsUrl}>View on map</ConfigLink>}
            </>
          }
        />
        {b.restaurantLatitude && <Row label="Restaurant coordinates" value={`${b.restaurantLatitude}, ${b.restaurantLongitude}`} />}
        {b.customerLatitude && <Row label="Customer coordinates" value={`${b.customerLatitude}, ${b.customerLongitude}`} />}
      </dl>
    </div>
  )
}
