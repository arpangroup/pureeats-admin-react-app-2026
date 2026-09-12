import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, ListChecks, MapPin, ServerOff } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { SectionCard } from '@/components/ui/SectionCard'
import { Field, Select, TextInput } from '@/components/ui/FormControls'
import { Badge, EmptyState, LoadingBlock } from '@/components/ui/Feedback'
import { LocationPickerMap } from '@/components/ui/LocationPickerMap'
import { useAsync } from '@/hooks/useAsync'
import { useDebounce } from '@/hooks/useDebounce'
import { restaurantService } from '@/services/restaurantService'
import { itemService } from '@/services/itemService'
import { addonCategoryService, addonService } from '@/services/simpleServices'
import { cartSimulateService, type CartSimulateRequest, type CartSimulateResult } from '@/services/cartSimulateService'
import { formatCurrency } from '@/lib/format'
import { IS_MOCK } from '@/config/env'

interface LineState {
  included: boolean
  quantity: number
  addonIds: number[]
}

const PAYMENT_MODES: { value: string; label: string }[] = [
  { value: '', label: "Not chosen yet (matches the live Cart page's own preview)" },
  { value: 'COD', label: 'Cash on Delivery' },
  { value: 'WALLET', label: 'PureEats Wallet' },
  { value: 'UPI', label: 'UPI' },
  { value: 'RAZORPAY', label: 'Razorpay' },
]

const DEFAULT_LAT = 12.9716
const DEFAULT_LNG = 77.5946

export default function CartSimulatorPage() {
  // No backend "/all" endpoint exists for any of these entities - only the paginated admin list
  // routes are real, so pull a large page instead of a true listAll().
  const { data: restaurantsPage, isLoading: restaurantsLoading } = useAsync(() => restaurantService.list({ perPage: 500 }), [])
  const { data: addonCategoriesPage } = useAsync(() => addonCategoryService.list({ perPage: 500 }), [])
  const { data: addonsPage } = useAsync(() => addonService.list({ perPage: 500 }), [])
  const restaurants = restaurantsPage?.data
  const addonCategories = addonCategoriesPage?.data
  const allAddons = addonsPage?.data

  const [restaurantId, setRestaurantId] = useState<number | null>(null)
  const [lines, setLines] = useState<Record<number, LineState>>({})
  const [deliveryType, setDeliveryType] = useState<'DELIVERY' | 'SELF_PICKUP'>('DELIVERY')
  const [customerLat, setCustomerLat] = useState<number>(DEFAULT_LAT)
  const [customerLng, setCustomerLng] = useState<number>(DEFAULT_LNG)
  const [customerAddress, setCustomerAddress] = useState('')
  const [paymentMode, setPaymentMode] = useState('')
  const [couponCode, setCouponCode] = useState('')

  useEffect(() => {
    if (restaurantId === null && restaurants && restaurants.length > 0) setRestaurantId(restaurants[0].id)
  }, [restaurants, restaurantId])

  // The picker list is built from the paginated summary endpoint, which omits detail-only fields
  // (deliveryType, deliveryRadius, restaurantCharges, isAcceptCod, ...) this page needs once a
  // restaurant is picked — so fetch the full detail record separately, same as the admin restaurant
  // edit page does.
  const { data: restaurant } = useAsync(
    () => (restaurantId ? restaurantService.get(restaurantId) : Promise.resolve(null)),
    [restaurantId],
  )

  const { data: menu, isLoading: menuLoading } = useAsync(
    () => (restaurantId ? itemService.listByRestaurant(restaurantId, { perPage: 500 }) : Promise.resolve(null)),
    [restaurantId],
  )
  const items = useMemo(() => menu?.data ?? [], [menu])

  const canDeliver = restaurant?.deliveryType === 'delivery' || restaurant?.deliveryType === 'both'
  const canSelfPickup = restaurant?.deliveryType === 'self-pickup' || restaurant?.deliveryType === 'both'
  const deliveryOptions: ('DELIVERY' | 'SELF_PICKUP')[] = [...(canDeliver ? (['DELIVERY'] as const) : []), ...(canSelfPickup ? (['SELF_PICKUP'] as const) : [])]

  // A fresh restaurant's own real deliveryType decides which modes even make sense — same rule the
  // customer app's Cart page now enforces (a self-pickup-only restaurant should never simulate a
  // "delivery" cart, since that's not a scenario the real checkout would ever allow either).
  useEffect(() => {
    if (!restaurant) return
    setLines({})
    if (!deliveryOptions.includes(deliveryType) && deliveryOptions.length > 0) setDeliveryType(deliveryOptions[0])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurantId, restaurant?.deliveryType])

  function updateLine(itemId: number, patch: Partial<LineState>) {
    setLines((prev) => ({ ...prev, [itemId]: { included: false, quantity: 1, addonIds: [], ...prev[itemId], ...patch } }))
  }

  const cartLines = useMemo(
    () =>
      items
        .filter((item) => lines[item.id]?.included)
        .map((item) => ({
          itemId: item.id,
          quantity: Math.max(1, lines[item.id]?.quantity ?? 1),
          selectedAddonIds: lines[item.id]?.addonIds ?? [],
        })),
    [items, lines],
  )

  const simulateRequest = useMemo<CartSimulateRequest | null>(() => {
    if (!restaurantId || cartLines.length === 0) return null
    return {
      restaurantId,
      items: cartLines,
      deliveryType,
      customerLat: deliveryType === 'DELIVERY' ? String(customerLat) : null,
      customerLng: deliveryType === 'DELIVERY' ? String(customerLng) : null,
      couponCode: couponCode.trim() || null,
      paymentMode: paymentMode || null,
    }
  }, [restaurantId, cartLines, deliveryType, customerLat, customerLng, couponCode, paymentMode])

  // Debounced so dragging the map pin or typing a coupon code doesn't fire a request per pixel/keystroke.
  const debouncedRequest = useDebounce(simulateRequest, 400)
  const [result, setResult] = useState<CartSimulateResult | null>(null)
  const [simulating, setSimulating] = useState(false)
  const [simulateError, setSimulateError] = useState<string | null>(null)

  useEffect(() => {
    if (!debouncedRequest) {
      setResult(null)
      setSimulateError(null)
      return
    }
    let cancelled = false
    setSimulating(true)
    setSimulateError(null)
    cartSimulateService
      .simulate(debouncedRequest)
      .then((r) => {
        if (!cancelled) setResult(r)
      })
      .catch((err) => {
        if (!cancelled) setSimulateError((err as { message?: string })?.message ?? 'Could not simulate this cart')
      })
      .finally(() => {
        if (!cancelled) setSimulating(false)
      })
    return () => {
      cancelled = true
    }
  }, [debouncedRequest])

  if (IS_MOCK) {
    return (
      <div>
        <PageHeader title="Cart Validation Simulator" description="Runs the real backend's cart-validation pipeline against a picked restaurant/cart/location." />
        <EmptyState
          icon={<ServerOff size={22} />}
          title="Needs a real backend"
          description="This simulator calls the actual live cart-validation endpoint directly (same rules and pricing the customer app uses) rather than reimplementing them — so it only works in live/uat mode against a running backend, not mock mode. Run with VITE_DATA_SOURCE=live (npm run dev:uat) to use it."
        />
      </div>
    )
  }

  const itemIssue = (itemId: number) => result?.items.find((i) => i.itemId === itemId)

  return (
    <div>
      <PageHeader
        title="Cart Validation Simulator"
        description="Build a test cart and run it through the real checkout pipeline — same rules, same pricing, live against the backend."
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[380px_1fr]">
        <div className="space-y-4">
          <SectionCard title="Cart setup" icon={ListChecks}>
            <div className="space-y-4">
              <Field label="Restaurant">
                {restaurantsLoading ? (
                  <LoadingBlock />
                ) : (
                  <Select value={restaurantId ?? ''} onChange={(e) => setRestaurantId(Number(e.target.value))}>
                    {(restaurants ?? []).map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>

              {restaurant && (
                <div className="flex flex-wrap gap-1.5 text-[11px]">
                  <Badge tone={restaurant.isActive ? 'green' : 'red'}>{restaurant.isActive ? 'Active' : 'Deactivated'}</Badge>
                  <Badge tone={restaurant.isAccepted ? 'green' : 'red'}>{restaurant.isAccepted ? 'Accepting orders' : 'Paused'}</Badge>
                  <Badge tone={restaurant.isAcceptCod ? 'blue' : 'amber'}>{restaurant.isAcceptCod ? 'Accepts COD' : 'No COD'}</Badge>
                  <Badge tone="slate">Min order ₹{restaurant.minOrderPrice}</Badge>
                  <Badge tone="slate">{restaurant.deliveryRadius} km radius</Badge>
                  <Badge tone="purple">{restaurant.deliveryChargeType} delivery charge</Badge>
                  <Badge tone="slate">Offers: {restaurant.deliveryType}</Badge>
                </div>
              )}

              <div>
                <p className="label mb-1.5">Items in cart</p>
                {menuLoading ? (
                  <LoadingBlock />
                ) : items.length === 0 ? (
                  <p className="text-xs text-slate-400">This restaurant has no items.</p>
                ) : (
                  <div className="space-y-2 rounded-lg border border-slate-100 p-2.5 dark:border-slate-800">
                    {items.map((item) => {
                      const line = lines[item.id] ?? { included: false, quantity: 1, addonIds: [] }
                      const issue = itemIssue(item.id)
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
                          </div>
                          {line.included && issue && !issue.available && (
                            <p className="ml-6 text-[11px] text-rose-500">{issue.reason}</p>
                          )}
                          {line.included && (
                            <div className="ml-6 mb-1 flex flex-wrap gap-1">
                              {(allAddons ?? []).map((addon) => {
                                const offered = item.addonCategoryIds.includes(addon.addonCategoryId)
                                const selected = line.addonIds.includes(addon.id)
                                const category = (addonCategories ?? []).find((c) => c.id === addon.addonCategoryId)
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
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Delivery type">
                  <Select value={deliveryType} onChange={(e) => setDeliveryType(e.target.value as 'DELIVERY' | 'SELF_PICKUP')} disabled={deliveryOptions.length <= 1}>
                    {deliveryOptions.map((t) => (
                      <option key={t} value={t}>
                        {t === 'DELIVERY' ? 'Delivery' : 'Self-pickup'}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Payment method">
                  <Select value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)}>
                    {PAYMENT_MODES.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>

              {deliveryType === 'DELIVERY' && (
                <Field label="Customer location" hint="Drag the pin or search an address — this is the real point the backend's distance/delivery-radius/pricing calculation runs against.">
                  <LocationPickerMap
                    lat={customerLat}
                    lng={customerLng}
                    onChange={(lat, lng) => {
                      setCustomerLat(lat)
                      setCustomerLng(lng)
                    }}
                    onAddressResolved={setCustomerAddress}
                    height={200}
                  />
                  {customerAddress && (
                    <p className="mt-1.5 flex items-start gap-1 text-xs text-slate-500 dark:text-slate-400">
                      <MapPin size={12} className="mt-0.5 shrink-0" /> {customerAddress}
                    </p>
                  )}
                </Field>
              )}

              <Field label="Coupon code" hint="Checked against real, live coupons — leave blank to skip.">
                <TextInput value={couponCode} onChange={(e) => setCouponCode(e.target.value)} placeholder="e.g. WELCOME50" />
              </Field>
            </div>
          </SectionCard>
        </div>

        <div className="space-y-4">
          {!result && !simulating && !simulateError && (
            <EmptyState icon={<ListChecks size={22} />} title="Add items to simulate" description="Check at least one item in the cart to run it through the validation pipeline." />
          )}

          {simulateError && (
            <div className="card flex items-center gap-3 border-l-4 border-l-rose-500 p-4 text-sm text-rose-600 dark:text-rose-400">
              <AlertTriangle size={18} className="shrink-0" /> {simulateError}
            </div>
          )}

          {result && (
            <>
              <div className={`card flex items-center justify-between gap-3 border-l-4 p-4 ${result.anyUnavailable ? 'border-l-rose-500' : 'border-l-emerald-500'}`}>
                <div>
                  <p className={`text-sm font-semibold ${result.anyUnavailable ? 'text-rose-700 dark:text-rose-300' : 'text-emerald-700 dark:text-emerald-300'}`}>
                    {result.anyUnavailable ? 'Order would be blocked' : 'Order can be placed'}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    {!result.restaurant.available
                      ? result.restaurant.reason
                      : result.items.some((i) => !i.available)
                        ? 'One or more items in the cart are unavailable — see below.'
                        : result.coupon && !result.coupon.valid
                          ? `Coupon: ${result.coupon.reason}`
                          : 'Every rule in the pipeline passed for this cart.'}
                  </p>
                </div>
                <p className={`shrink-0 text-2xl font-bold ${simulating ? 'text-slate-300 dark:text-slate-600' : 'text-slate-800 dark:text-slate-100'}`}>
                  {formatCurrency(result.pricing.payable)}
                </p>
              </div>

              <SectionCard title="Pricing breakdown">
                <dl className="space-y-1.5 text-sm">
                  <Row label="Item total" value={formatCurrency(result.pricing.itemTotal)} />
                  {result.pricing.discountAmount > 0 && <Row label="Coupon discount" value={`-${formatCurrency(result.pricing.discountAmount)}`} tone="text-emerald-600 dark:text-emerald-400" />}
                  <Row label="Tax" value={formatCurrency(result.pricing.tax)} />
                  <Row label={`Restaurant charge${restaurant ? ` (${restaurant.restaurantCharges}%)` : ''}`} value={formatCurrency(result.pricing.restaurantCharge)} />
                  <Row
                    label={`Delivery charge (${result.pricing.deliveryChargeBasis.toLowerCase().replace(/_/g, ' ')}${result.pricing.distanceKm ? `, ${result.pricing.distanceKm} km` : ''})`}
                    value={formatCurrency(result.pricing.deliveryCharge)}
                  />
                  {result.pricing.platformFee > 0 && <Row label="Platform fee" value={formatCurrency(result.pricing.platformFee)} />}
                  <div className="flex justify-between border-t border-slate-100 pt-1.5 text-base font-semibold text-slate-800 dark:border-slate-800 dark:text-slate-100">
                    <span>Payable</span>
                    <span>{formatCurrency(result.pricing.payable)}</span>
                  </div>
                </dl>
              </SectionCard>
            </>
          )}
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
