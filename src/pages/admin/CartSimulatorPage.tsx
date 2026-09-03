import { useEffect, useMemo, useState } from 'react'
import { ChevronDown, ListChecks, RotateCcw, Sparkles, Wand2 } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { SectionCard } from '@/components/ui/SectionCard'
import { Field, Select, TextInput, Switch } from '@/components/ui/FormControls'
import { Badge } from '@/components/ui/Feedback'
import { CartValidationFlow } from '@/components/tools/CartValidationFlow'
import { restaurants, items, coupons, addonCategories, addons } from '@/mocks/fixtures'
import { runCartValidation, SUGGESTED_ENHANCEMENTS, type CartLineInput } from '@/lib/cartValidation'
import { formatCurrency } from '@/lib/format'
import type { Restaurant } from '@/types/entities'

interface LineState {
  included: boolean
  quantity: number
  stock: string // '' = unlimited
  addonIds: number[]
}

interface Scenario {
  label: string
  restaurantId: number
  itemQuantities: Record<number, number>
  deliveryType: 'delivery' | 'pickup'
  distanceKm: number
  paymentMode: 'cod' | 'online' | 'wallet'
  couponCode: string
  isFirstOrder: boolean
  forceClosed: boolean
  stockOverrides?: Record<number, string>
  addonSelections?: Record<number, number[]>
  recentOrderCount?: number
}

const SCENARIOS: Scenario[] = [
  { label: 'Happy path', restaurantId: 1, itemQuantities: { 1: 1, 4: 2 }, deliveryType: 'delivery', distanceKm: 3, paymentMode: 'cod', couponCode: '', isFirstOrder: false, forceClosed: false },
  { label: 'Store closed', restaurantId: 5, itemQuantities: { 13: 1 }, deliveryType: 'pickup', distanceKm: 0, paymentMode: 'cod', couponCode: '', isFirstOrder: false, forceClosed: false },
  { label: 'Not accepting orders', restaurantId: 6, itemQuantities: { 14: 1 }, deliveryType: 'delivery', distanceKm: 2, paymentMode: 'cod', couponCode: '', isFirstOrder: false, forceClosed: false },
  { label: 'Item unavailable', restaurantId: 3, itemQuantities: { 8: 1, 10: 1 }, deliveryType: 'delivery', distanceKm: 3, paymentMode: 'online', couponCode: '', isFirstOrder: false, forceClosed: false },
  { label: 'Out of stock', restaurantId: 1, itemQuantities: { 1: 3 }, deliveryType: 'delivery', distanceKm: 3, paymentMode: 'cod', couponCode: '', isFirstOrder: false, forceClosed: false, stockOverrides: { 1: '2' } },
  { label: 'Invalid addon', restaurantId: 1, itemQuantities: { 4: 1 }, deliveryType: 'delivery', distanceKm: 3, paymentMode: 'cod', couponCode: '', isFirstOrder: false, forceClosed: false, addonSelections: { 4: [4] } },
  { label: 'Below minimum order', restaurantId: 2, itemQuantities: { 7: 1 }, deliveryType: 'delivery', distanceKm: 2, paymentMode: 'cod', couponCode: '', isFirstOrder: false, forceClosed: false },
  { label: 'Outside delivery radius', restaurantId: 1, itemQuantities: { 1: 1, 4: 1 }, deliveryType: 'delivery', distanceKm: 15, paymentMode: 'cod', couponCode: '', isFirstOrder: false, forceClosed: false },
  { label: 'Invalid coupon', restaurantId: 1, itemQuantities: { 1: 1, 4: 1 }, deliveryType: 'delivery', distanceKm: 3, paymentMode: 'cod', couponCode: 'NOTREAL', isFirstOrder: false, forceClosed: false },
  { label: 'Coupon needs first order', restaurantId: 1, itemQuantities: { 1: 1, 2: 1 }, deliveryType: 'delivery', distanceKm: 3, paymentMode: 'cod', couponCode: 'WELCOME50', isFirstOrder: false, forceClosed: false },
  { label: 'COD not accepted', restaurantId: 3, itemQuantities: { 8: 1 }, deliveryType: 'delivery', distanceKm: 3, paymentMode: 'cod', couponCode: '', isFirstOrder: false, forceClosed: false },
  { label: 'Ordering too fast', restaurantId: 1, itemQuantities: { 1: 1, 4: 1 }, deliveryType: 'delivery', distanceKm: 3, paymentMode: 'cod', couponCode: '', isFirstOrder: false, forceClosed: false, recentOrderCount: 3 },
]

function restaurantItems(restaurantId: number) {
  return items.filter((i) => i.restaurantId === restaurantId)
}

function allowedDeliveryTypes(restaurant: Restaurant): ('delivery' | 'pickup')[] {
  if (restaurant.deliveryType === 'delivery') return ['delivery']
  if (restaurant.deliveryType === 'self-pickup') return ['pickup']
  return ['delivery', 'pickup']
}

export default function CartSimulatorPage() {
  const [restaurantId, setRestaurantId] = useState(1)
  const [lines, setLines] = useState<Record<number, LineState>>({})
  const [deliveryType, setDeliveryType] = useState<'delivery' | 'pickup'>('delivery')
  const [distanceKm, setDistanceKm] = useState(3)
  const [paymentMode, setPaymentMode] = useState<'cod' | 'online' | 'wallet'>('cod')
  const [couponCode, setCouponCode] = useState('')
  const [isFirstOrder, setIsFirstOrder] = useState(false)
  const [forceClosed, setForceClosed] = useState(false)
  const [recentOrderCount, setRecentOrderCount] = useState(0)

  const restaurant = restaurants.find((r) => r.id === restaurantId) ?? restaurants[0]
  const menu = restaurantItems(restaurant.id)
  const deliveryOptions = allowedDeliveryTypes(restaurant)

  function seedLines(
    rid: number,
    quantities: Record<number, number> = {},
    stockOverrides: Record<number, string> = {},
    addonSelections: Record<number, number[]> = {},
  ) {
    const menuForRestaurant = restaurantItems(rid)
    const next: Record<number, LineState> = {}
    menuForRestaurant.forEach((item, idx) => {
      const preset = quantities[item.id]
      next[item.id] = {
        included: preset !== undefined || (Object.keys(quantities).length === 0 && idx < 2),
        quantity: preset ?? 1,
        stock: stockOverrides[item.id] ?? '',
        addonIds: addonSelections[item.id] ?? [],
      }
    })
    setLines(next)
  }

  useEffect(() => {
    seedLines(restaurantId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!deliveryOptions.includes(deliveryType)) setDeliveryType(deliveryOptions[0])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurant.id])

  function applyScenario(scenario: Scenario) {
    setRestaurantId(scenario.restaurantId)
    seedLines(scenario.restaurantId, scenario.itemQuantities, scenario.stockOverrides ?? {}, scenario.addonSelections ?? {})
    const rest = restaurants.find((r) => r.id === scenario.restaurantId) ?? restaurants[0]
    const allowed = allowedDeliveryTypes(rest)
    setDeliveryType(allowed.includes(scenario.deliveryType) ? scenario.deliveryType : allowed[0])
    setDistanceKm(scenario.distanceKm)
    setPaymentMode(scenario.paymentMode)
    setCouponCode(scenario.couponCode)
    setIsFirstOrder(scenario.isFirstOrder)
    setForceClosed(scenario.forceClosed)
    setRecentOrderCount(scenario.recentOrderCount ?? 0)
  }

  const cartLines: CartLineInput[] = useMemo(
    () =>
      menu
        .filter((item) => lines[item.id]?.included)
        .map((item) => ({
          item,
          quantity: Math.max(1, lines[item.id]?.quantity ?? 1),
          simulatedStock: lines[item.id]?.stock.trim() ? Number(lines[item.id].stock) : null,
          selectedAddonIds: lines[item.id]?.addonIds ?? [],
        })),
    [menu, lines],
  )

  const result = useMemo(
    () =>
      runCartValidation(
        { restaurant, lines: cartLines, deliveryType, distanceKm, paymentMode, couponCode, isFirstOrder, forceClosed, recentOrderCount },
        coupons,
        addons,
      ),
    [restaurant, cartLines, deliveryType, distanceKm, paymentMode, couponCode, isFirstOrder, forceClosed, recentOrderCount],
  )

  function updateLine(itemId: number, patch: Partial<LineState>) {
    setLines((prev) => ({ ...prev, [itemId]: { ...prev[itemId], ...patch } }))
  }

  return (
    <div>
      <PageHeader
        title="Cart Validation Simulator"
        description="Build a test cart and walk it through every rule the checkout pipeline applies — see exactly which one would block the order, and what's still missing."
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
          <Wand2 size={13} /> Quick scenarios
        </span>
        {SCENARIOS.map((s) => (
          <button key={s.label} onClick={() => applyScenario(s)} className="btn-secondary !px-3 !py-1.5 text-xs">
            {s.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[380px_1fr]">
        <div className="space-y-4">
          <SectionCard title="Cart setup" icon={ListChecks}>
            <div className="space-y-4">
              <Field label="Restaurant">
                <Select value={restaurantId} onChange={(e) => { const id = Number(e.target.value); setRestaurantId(id); seedLines(id) }}>
                  {restaurants.map((r) => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </Select>
              </Field>

              <div className="flex flex-wrap gap-1.5 text-[11px]">
                <Badge tone={restaurant.isActive ? 'green' : 'red'}>{restaurant.isActive ? 'Active' : 'Deactivated'}</Badge>
                <Badge tone={restaurant.isAccepted ? 'green' : 'red'}>{restaurant.isAccepted ? 'Accepting orders' : 'Paused'}</Badge>
                <Badge tone={restaurant.isAcceptCod ? 'blue' : 'amber'}>{restaurant.isAcceptCod ? 'Accepts COD' : 'No COD'}</Badge>
                <Badge tone="slate">{restaurant.openingTime}–{restaurant.closingTime}</Badge>
                <Badge tone="slate">Min order ₹{restaurant.minOrderPrice}</Badge>
                <Badge tone="slate">{restaurant.deliveryRadius} km radius</Badge>
                <Badge tone="purple">{restaurant.deliveryChargeType} delivery charge</Badge>
              </div>

              <div>
                <p className="label mb-1.5">Items in cart</p>
                <div className="space-y-2 rounded-lg border border-slate-100 p-2.5 dark:border-slate-800">
                  {menu.map((item) => {
                    const line = lines[item.id] ?? { included: false, quantity: 1, stock: '', addonIds: [] }
                    return (
                      <div key={item.id} className={!item.isActive ? 'opacity-60' : ''}>
                      <div className="flex items-center gap-2 rounded-md px-1.5 py-1 text-sm">
                        <input
                          type="checkbox"
                          checked={line.included}
                          onChange={(e) => updateLine(item.id, { included: e.target.checked })}
                          className="h-3.5 w-3.5 shrink-0 rounded border-slate-300"
                        />
                        <span className="flex-1 truncate text-slate-700 dark:text-slate-200">
                          {item.name} {!item.isActive && <span className="text-rose-500">(inactive)</span>}
                        </span>
                        <span className="shrink-0 text-xs text-slate-400">{formatCurrency(item.price)}</span>
                        <input
                          type="number"
                          min={1}
                          value={line.quantity}
                          onChange={(e) => updateLine(item.id, { quantity: Number(e.target.value) })}
                          className="input !w-14 !py-1 text-center text-xs"
                          title="Quantity"
                        />
                        <input
                          type="number"
                          placeholder="∞"
                          value={line.stock}
                          onChange={(e) => updateLine(item.id, { stock: e.target.value })}
                          className="input !w-14 !py-1 text-center text-xs"
                          title="Simulated stock left (blank = unlimited)"
                        />
                      </div>
                      {line.included && (
                        <div className="ml-6 mb-1 flex flex-wrap gap-1">
                          {addons.map((addon) => {
                            const offered = item.addonCategoryIds.includes(addon.addonCategoryId)
                            const selected = line.addonIds.includes(addon.id)
                            const category = addonCategories.find((c) => c.id === addon.addonCategoryId)
                            return (
                              <button
                                key={addon.id}
                                type="button"
                                onClick={() =>
                                  updateLine(item.id, {
                                    addonIds: selected ? line.addonIds.filter((id) => id !== addon.id) : [...line.addonIds, addon.id],
                                  })
                                }
                                title={`${category?.name ?? 'Addon'}${offered ? '' : ' — NOT offered on this item'}`}
                                className={`rounded-full border px-2 py-0.5 text-[10px] font-medium transition-colors ${
                                  selected
                                    ? offered
                                      ? 'border-emerald-400 bg-emerald-50 text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-300'
                                      : 'border-rose-400 bg-rose-50 text-rose-700 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-300'
                                    : offered
                                      ? 'border-slate-200 text-slate-500 dark:border-slate-700 dark:text-slate-400'
                                      : 'border-dashed border-slate-200 text-slate-300 dark:border-slate-700 dark:text-slate-600'
                                }`}
                              >
                                {addon.name}
                              </button>
                            )
                          })}
                        </div>
                      )}
                      </div>
                    )
                  })}
                </div>
                <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">Last box = simulated stock remaining (blank = unlimited/untracked).</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Delivery type">
                  <Select value={deliveryType} onChange={(e) => setDeliveryType(e.target.value as 'delivery' | 'pickup')} disabled={deliveryOptions.length === 1}>
                    {deliveryOptions.map((t) => (
                      <option key={t} value={t}>{t === 'delivery' ? 'Delivery' : 'Self-pickup'}</option>
                    ))}
                  </Select>
                </Field>
                <Field label="Payment method">
                  <Select value={paymentMode} onChange={(e) => setPaymentMode(e.target.value as typeof paymentMode)}>
                    <option value="cod">Cash on Delivery</option>
                    <option value="online">Online</option>
                    <option value="wallet">Wallet</option>
                  </Select>
                </Field>
              </div>

              {deliveryType === 'delivery' && (
                <Field label={`Customer distance — ${distanceKm} km`}>
                  <input
                    type="range"
                    min={0}
                    max={25}
                    step={0.5}
                    value={distanceKm}
                    onChange={(e) => setDistanceKm(Number(e.target.value))}
                    className="w-full accent-brand-600"
                  />
                </Field>
              )}

              <Field label="Coupon code" hint="Try: WELCOME50, WEEKEND20, SPICE15, PIZZA75 (inactive), BIG150, FREESHIP">
                <TextInput value={couponCode} onChange={(e) => setCouponCode(e.target.value)} placeholder="e.g. WELCOME50" />
              </Field>

              <Field label={`Customer's orders in the last 10 min — ${recentOrderCount}`} hint="Simulates the rate-limit/fraud rule (max 3 per 10 min).">
                <input
                  type="range"
                  min={0}
                  max={5}
                  step={1}
                  value={recentOrderCount}
                  onChange={(e) => setRecentOrderCount(Number(e.target.value))}
                  className="w-full accent-brand-600"
                />
              </Field>

              <div className="flex flex-col gap-2.5 border-t border-slate-100 pt-3 dark:border-slate-800">
                <Switch checked={isFirstOrder} onChange={setIsFirstOrder} label="This is the customer's first order" />
                <Switch checked={forceClosed} onChange={setForceClosed} label="Force-simulate: outside opening hours" />
              </div>

              <button
                className="btn-ghost w-full justify-center !text-xs"
                onClick={() => {
                  setDistanceKm(3)
                  setPaymentMode('cod')
                  setCouponCode('')
                  setIsFirstOrder(false)
                  setForceClosed(false)
                  setRecentOrderCount(0)
                  seedLines(restaurantId)
                }}
              >
                <RotateCcw size={13} /> Reset cart
              </button>
            </div>
          </SectionCard>
        </div>

        <div className="space-y-4">
          <div
            className={`card flex items-center justify-between gap-3 border-l-4 p-4 ${
              result.verdict === 'placeable' ? 'border-l-emerald-500' : 'border-l-rose-500'
            }`}
          >
            <div>
              <p className={`text-sm font-semibold ${result.verdict === 'placeable' ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'}`}>
                {result.verdict === 'placeable' ? 'Order can be placed' : 'Order would be blocked'}
              </p>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                {result.verdict === 'placeable'
                  ? 'Every rule in the pipeline passed for this cart.'
                  : `Stops at "${result.blockingRule?.title}" — ${result.blockingRule?.summary}`}
              </p>
            </div>
            <p className="shrink-0 text-2xl font-bold text-slate-800 dark:text-slate-100">{formatCurrency(result.pricing.payable)}</p>
          </div>

          <SectionCard title="Validation pipeline" description="Every rule the checkout pipeline evaluates, in order — same order the fail-fast placeOrder gate checks them.">
            <CartValidationFlow rules={result.rules} blockingRuleId={result.blockingRule?.id ?? null} />
          </SectionCard>

          <SectionCard title="Pricing breakdown">
            <dl className="space-y-1.5 text-sm">
              <Row label="Item total" value={formatCurrency(result.pricing.itemTotal)} />
              {result.pricing.discount > 0 && <Row label="Coupon discount" value={`-${formatCurrency(result.pricing.discount)}`} tone="text-emerald-600 dark:text-emerald-400" />}
              <Row label="Tax (5%)" value={formatCurrency(result.pricing.tax)} />
              <Row label={`Restaurant charge (${restaurant.restaurantCharges}%)`} value={formatCurrency(result.pricing.restaurantCharge)} />
              <Row label={`Delivery charge (${result.pricing.deliveryBasis.toLowerCase().replace(/_/g, ' ')})`} value={formatCurrency(result.pricing.deliveryCharge)} />
              <div className="flex justify-between border-t border-slate-100 pt-1.5 text-base font-semibold text-slate-800 dark:border-slate-800 dark:text-slate-100">
                <span>Payable</span>
                <span>{formatCurrency(result.pricing.payable)}</span>
              </div>
            </dl>
          </SectionCard>

          <details className="card group p-4">
            <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold text-slate-700 dark:text-slate-200">
              <span className="flex items-center gap-2">
                <Sparkles size={15} className="text-brand-500" /> Suggested enhancements
              </span>
              <ChevronDown size={15} className="text-slate-400 transition-transform group-open:rotate-180" />
            </summary>
            <ul className="mt-3 space-y-2.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              {SUGGESTED_ENHANCEMENTS.map((tip, i) => (
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
  )
}

function Row({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="flex justify-between text-slate-500 dark:text-slate-400">
      <span>{label}</span>
      <span className={tone ?? 'text-slate-700 dark:text-slate-200'}>{value}</span>
    </div>
  )
}
