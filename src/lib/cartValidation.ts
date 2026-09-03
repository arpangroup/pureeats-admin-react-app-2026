// Client-side mirror of the backend's cart-validation pipeline (pureeats-order-service's
// CartValidationRule chain + OrderPricingService + CouponService). Mirrors, rather than calls,
// the backend because this is a what-if simulator: an admin can toggle inputs the real APIs don't
// expose (simulated stock, simulated distance, "is this the customer's first order", "how many
// orders has this customer placed in the last few minutes") to walk through failure modes without
// needing to manufacture that real-world state first. Every rule here is now a real,
// server-enforced `CartValidationRule` bean — see `implemented` on each result; the "Suggested
// enhancements" panel lists what's still just an idea.
import type { Addon, Coupon, Item, Restaurant } from '@/types/entities'

export type RuleStatus = 'pass' | 'fail' | 'warn' | 'info' | 'skipped'
export type RuleCategory = 'restaurant' | 'items' | 'economics' | 'coupon' | 'payment' | 'pricing' | 'account'

export interface RuleResult {
  id: string
  number: number
  title: string
  category: RuleCategory
  status: RuleStatus
  summary: string
  detail?: string
  /** Would this alone stop the order from being placed (mirrors the fail-fast placeOrder gate). */
  blocking: boolean
  /** 'live' = a real backend rule today; 'suggested' = proposed, not yet enforced server-side. */
  implemented: 'live' | 'suggested'
}

export interface CartLineInput {
  item: Item
  quantity: number
  /** null = unlimited/untracked (the common case — most items have no stock column set). */
  simulatedStock: number | null
  /** Addon ids the "customer" picked for this line — validated against item.addonCategoryIds. */
  selectedAddonIds: number[]
}

export interface CartSimulatorInput {
  restaurant: Restaurant
  lines: CartLineInput[]
  deliveryType: 'delivery' | 'pickup'
  distanceKm: number
  paymentMode: 'cod' | 'online' | 'wallet'
  couponCode: string
  isFirstOrder: boolean
  forceClosed: boolean
  /** How many orders this customer has already placed in the rate-limit window — simulates OrderFrequencyRule. */
  recentOrderCount: number
}

export const ORDER_RATE_LIMIT = { windowMinutes: 10, maxOrders: 3 }

export interface PricingResult {
  itemTotal: number
  discount: number
  amountAfterDiscount: number
  tax: number
  restaurantCharge: number
  deliveryCharge: number
  deliveryBasis: 'FIXED' | 'DYNAMIC' | 'SELF_PICKUP' | 'FREE_DELIVERY_COUPON'
  distanceKm: number
  payable: number
}

export interface CartSimulationResult {
  rules: RuleResult[]
  pricing: PricingResult
  verdict: 'placeable' | 'blocked'
  blockingRule: RuleResult | null
}

const TAX_PERCENTAGE = 5

function withinOpeningHours(restaurant: Restaurant, now: Date): boolean {
  if (!restaurant.openingTime || !restaurant.closingTime) return true
  const [openH, openM] = restaurant.openingTime.split(':').map(Number)
  const [closeH, closeM] = restaurant.closingTime.split(':').map(Number)
  const nowMin = now.getHours() * 60 + now.getMinutes()
  const openMin = openH * 60 + openM
  const closeMin = closeH * 60 + closeM
  if (openMin <= closeMin) return nowMin >= openMin && nowMin <= closeMin
  return nowMin >= openMin || nowMin <= closeMin // overnight window
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

export function computeDeliveryCharge(
  restaurant: Restaurant,
  isSelfPickup: boolean,
  freeDelivery: boolean,
  distanceKm: number,
): { amount: number; basis: PricingResult['deliveryBasis'] } {
  if (isSelfPickup) return { amount: 0, basis: 'SELF_PICKUP' }
  if (freeDelivery) return { amount: 0, basis: 'FREE_DELIVERY_COUPON' }
  if (restaurant.deliveryChargeType === 'dynamic' && restaurant.baseDeliveryCharge != null) {
    let charge = restaurant.baseDeliveryCharge
    const baseDistance = restaurant.baseDeliveryDistance ?? 0
    if (distanceKm > baseDistance && restaurant.extraDeliveryDistance > 0 && restaurant.extraDeliveryCharge != null) {
      const extraKm = distanceKm - baseDistance
      const extraUnits = Math.ceil(extraKm / restaurant.extraDeliveryDistance)
      charge += restaurant.extraDeliveryCharge * extraUnits
    }
    return { amount: round2(charge), basis: 'DYNAMIC' }
  }
  return { amount: restaurant.deliveryCharges ?? 0, basis: 'FIXED' }
}

function couponDiscount(coupon: Coupon, orderAmount: number): { discount: number; freeDelivery: boolean } {
  if (coupon.discountType === 'percentage') {
    return { discount: round2(Math.min((orderAmount * coupon.discount) / 100, coupon.uptoAmount)), freeDelivery: false }
  }
  if (coupon.discountType === 'free_delivery') {
    return { discount: 0, freeDelivery: true }
  }
  return { discount: round2(Math.min(coupon.discount, orderAmount)), freeDelivery: false }
}

let ruleNumber = 0
function rule(r: Omit<RuleResult, 'number'>): RuleResult {
  ruleNumber += 1
  return { ...r, number: ruleNumber }
}

/** Pass the mock `coupons` and `addons` fixtures through. */
export function runCartValidation(input: CartSimulatorInput, coupons: Coupon[], addons: Addon[], now: Date = new Date()): CartSimulationResult {
  ruleNumber = 0
  const rules: RuleResult[] = []
  const { restaurant, lines, deliveryType, distanceKm, paymentMode, couponCode, isFirstOrder, forceClosed, recentOrderCount } = input

  // 1. Restaurant availability -------------------------------------------------
  let restaurantOk = true
  if (!restaurant.isActive) {
    restaurantOk = false
    rules.push(rule({ id: 'restaurant', title: 'Store availability', category: 'restaurant', status: 'fail',
      summary: 'This restaurant is currently unavailable.', detail: 'The store has been deactivated by an admin or the owner.',
      blocking: true, implemented: 'live' }))
  } else if (!restaurant.isAccepted) {
    restaurantOk = false
    rules.push(rule({ id: 'restaurant', title: 'Store availability', category: 'restaurant', status: 'fail',
      summary: 'This restaurant is not accepting orders right now.', detail: 'The owner has paused incoming orders.',
      blocking: true, implemented: 'live' }))
  } else if (forceClosed || !withinOpeningHours(restaurant, now)) {
    restaurantOk = false
    rules.push(rule({ id: 'restaurant', title: 'Store availability', category: 'restaurant', status: 'fail',
      summary: `This restaurant is closed right now (opens ${restaurant.openingTime}).`,
      detail: `Posted hours: ${restaurant.openingTime}–${restaurant.closingTime}.`, blocking: true, implemented: 'live' }))
  } else {
    rules.push(rule({ id: 'restaurant', title: 'Store availability', category: 'restaurant', status: 'pass',
      summary: 'Restaurant is active, accepting orders, and within its posted hours.',
      detail: `Open ${restaurant.openingTime}–${restaurant.closingTime}.`, blocking: false, implemented: 'live' }))
  }

  // 2. Item availability --------------------------------------------------------
  const unavailableItems = lines.filter((l) => !l.item.isActive)
  if (unavailableItems.length > 0) {
    rules.push(rule({ id: 'item-availability', title: 'Item availability', category: 'items', status: 'fail',
      summary: `${unavailableItems.length} item(s) are no longer available: ${unavailableItems.map((l) => l.item.name).join(', ')}.`,
      detail: 'Deactivated by the restaurant, or removed from the menu.', blocking: true, implemented: 'live' }))
  } else {
    rules.push(rule({ id: 'item-availability', title: 'Item availability', category: 'items', status: 'pass',
      summary: `All ${lines.length} item(s) in the cart are active and on the menu.`, blocking: false, implemented: 'live' }))
  }

  // 3. Item stock ----------------------------------------------------------------
  const outOfStock = lines.filter((l) => l.simulatedStock !== null && l.simulatedStock <= 0)
  const lowStock = lines.filter((l) => l.simulatedStock !== null && l.simulatedStock > 0 && l.simulatedStock < l.quantity)
  if (outOfStock.length > 0) {
    rules.push(rule({ id: 'item-stock', title: 'Item stock', category: 'items', status: 'fail',
      summary: `Out of stock: ${outOfStock.map((l) => l.item.name).join(', ')}.`, blocking: true, implemented: 'live' }))
  } else if (lowStock.length > 0) {
    rules.push(rule({ id: 'item-stock', title: 'Item stock', category: 'items', status: 'fail',
      summary: lowStock.map((l) => `Only ${l.simulatedStock} left of ${l.item.name} (requested ${l.quantity})`).join('; ') + '.',
      blocking: true, implemented: 'live' }))
  } else {
    rules.push(rule({ id: 'item-stock', title: 'Item stock', category: 'items', status: 'pass',
      summary: 'Enough stock for every line (or untracked/unlimited).', blocking: false, implemented: 'live' }))
  }

  const availableLines = lines.filter((l) => l.item.isActive && !(l.simulatedStock !== null && l.simulatedStock < l.quantity))
  const itemTotal = round2(availableLines.reduce((sum, l) => sum + l.item.price * l.quantity, 0))

  // 4. Addon selection ------------------------------------------------------------
  const addonById = new Map(addons.map((a) => [a.id, a]))
  const invalidAddonNotes: string[] = []
  for (const line of lines) {
    for (const addonId of line.selectedAddonIds) {
      const addon = addonById.get(addonId)
      const allowed = addon != null && line.item.addonCategoryIds.includes(addon.addonCategoryId)
      if (!allowed) {
        invalidAddonNotes.push(`"${addon?.name ?? `#${addonId}`}" is not offered on ${line.item.name}`)
      }
    }
  }
  if (invalidAddonNotes.length > 0) {
    rules.push(rule({ id: 'addon-selection', title: 'Addon selection', category: 'items', status: 'fail',
      summary: invalidAddonNotes.join('; ') + '.', detail: "Addon wasn't ever offered on this item, or belongs to a different item's addon category.",
      blocking: true, implemented: 'live' }))
  } else {
    const selectedCount = lines.reduce((sum, l) => sum + l.selectedAddonIds.length, 0)
    rules.push(rule({ id: 'addon-selection', title: 'Addon selection', category: 'items', status: selectedCount > 0 ? 'pass' : 'info',
      summary: selectedCount > 0 ? `All ${selectedCount} selected addon(s) are valid for their item.` : 'No addons selected.',
      blocking: false, implemented: 'live' }))
  }

  // 5. Delivery distance in range ---------------------------------------------------
  const isSelfPickup = deliveryType === 'pickup'
  if (isSelfPickup) {
    rules.push(rule({ id: 'distance', title: 'Delivery distance in range', category: 'economics', status: 'skipped',
      summary: 'Self-pickup — distance from the restaurant is not a constraint.', blocking: false, implemented: 'live' }))
  } else if (distanceKm > restaurant.deliveryRadius) {
    rules.push(rule({ id: 'distance', title: 'Delivery distance in range', category: 'economics', status: 'fail',
      summary: `Delivery address is ${distanceKm} km away — outside this restaurant's ${restaurant.deliveryRadius} km delivery radius.`,
      blocking: true, implemented: 'live' }))
  } else {
    rules.push(rule({ id: 'distance', title: 'Delivery distance in range', category: 'economics', status: 'pass',
      summary: `${distanceKm} km is within the ${restaurant.deliveryRadius} km delivery radius.`, blocking: false, implemented: 'live' }))
  }

  // 6. Minimum order amount ----------------------------------------------------------
  if (itemTotal < restaurant.minOrderPrice) {
    rules.push(rule({ id: 'min-order', title: 'Minimum order amount', category: 'economics', status: 'fail',
      summary: `Item total ₹${itemTotal} is below the ₹${restaurant.minOrderPrice} minimum order amount for this restaurant.`,
      blocking: true, implemented: 'live' }))
  } else {
    rules.push(rule({ id: 'min-order', title: 'Minimum order amount', category: 'economics', status: 'pass',
      summary: `₹${itemTotal} meets the ₹${restaurant.minOrderPrice} minimum for this restaurant.`, blocking: false, implemented: 'live' }))
  }

  // 7. Coupon validity ------------------------------------------------------------
  let discount = 0
  let freeDelivery = false
  if (couponCode.trim()) {
    const coupon = coupons.find((c) => c.code.toLowerCase() === couponCode.trim().toLowerCase())
    const restaurantIdNum = Number(restaurant.id)
    if (!coupon || !coupon.isActive) {
      rules.push(rule({ id: 'coupon', title: 'Coupon validity', category: 'coupon', status: 'fail',
        summary: `"${couponCode}" is not a valid or active coupon code.`, blocking: true, implemented: 'live' }))
    } else if (new Date(coupon.expiryDate).getTime() < now.getTime()) {
      rules.push(rule({ id: 'coupon', title: 'Coupon validity', category: 'coupon', status: 'fail',
        summary: `Coupon "${coupon.code}" expired on ${coupon.expiryDate}.`, blocking: true, implemented: 'live' }))
    } else if (coupon.restaurantId !== null && coupon.restaurantId !== restaurantIdNum) {
      rules.push(rule({ id: 'coupon', title: 'Coupon validity', category: 'coupon', status: 'fail',
        summary: `Coupon "${coupon.code}" is not valid for this restaurant.`, blocking: true, implemented: 'live' }))
    } else if (coupon.count >= coupon.totalCoupon) {
      rules.push(rule({ id: 'coupon', title: 'Coupon validity', category: 'coupon', status: 'fail',
        summary: `Coupon "${coupon.code}" has reached its usage limit (${coupon.count}/${coupon.totalCoupon}).`, blocking: true, implemented: 'live' }))
    } else if (itemTotal < coupon.minOrderAmount) {
      rules.push(rule({ id: 'coupon', title: 'Coupon validity', category: 'coupon', status: 'fail',
        summary: `Minimum order amount for "${coupon.code}" is ₹${coupon.minOrderAmount} (cart is ₹${itemTotal}).`, blocking: true, implemented: 'live' }))
    } else if (coupon.firstOrderOnly && !isFirstOrder) {
      rules.push(rule({ id: 'coupon', title: 'Coupon validity', category: 'coupon', status: 'fail',
        summary: `Coupon "${coupon.code}" is only valid on the customer's first order.`, blocking: true, implemented: 'live' }))
    } else {
      const result = couponDiscount(coupon, itemTotal)
      discount = result.discount
      freeDelivery = result.freeDelivery
      rules.push(rule({ id: 'coupon', title: 'Coupon validity', category: 'coupon', status: 'pass',
        summary: `"${coupon.code}" applied — ${freeDelivery ? 'free delivery' : `-₹${discount}`}.`, blocking: false, implemented: 'live' }))
    }
  } else {
    rules.push(rule({ id: 'coupon', title: 'Coupon validity', category: 'coupon', status: 'info',
      summary: 'No coupon code entered.', blocking: false, implemented: 'live' }))
  }

  // 8. Payment method accepted --------------------------------------------------------
  if (paymentMode === 'cod' && !restaurant.isAcceptCod) {
    rules.push(rule({ id: 'payment', title: 'Payment method accepted', category: 'payment', status: 'fail',
      summary: 'This restaurant does not accept Cash on Delivery.', blocking: true, implemented: 'live' }))
  } else {
    rules.push(rule({ id: 'payment', title: 'Payment method accepted', category: 'payment', status: 'pass',
      summary: `${paymentMode === 'cod' ? 'Cash on Delivery' : paymentMode === 'wallet' ? 'Wallet' : 'Online payment'} is accepted here.`,
      blocking: false, implemented: 'live' }))
  }

  // 9. Order frequency / rate limit ---------------------------------------------------
  if (recentOrderCount >= ORDER_RATE_LIMIT.maxOrders) {
    rules.push(rule({ id: 'order-frequency', title: 'Order frequency', category: 'account', status: 'fail',
      summary: `${recentOrderCount} orders already placed in the last ${ORDER_RATE_LIMIT.windowMinutes} minutes — please wait a little before placing another.`,
      detail: `Limit: ${ORDER_RATE_LIMIT.maxOrders} orders per ${ORDER_RATE_LIMIT.windowMinutes}-minute window.`, blocking: true, implemented: 'live' }))
  } else {
    rules.push(rule({ id: 'order-frequency', title: 'Order frequency', category: 'account', status: 'pass',
      summary: `${recentOrderCount} of ${ORDER_RATE_LIMIT.maxOrders} allowed orders used in the last ${ORDER_RATE_LIMIT.windowMinutes} minutes.`,
      blocking: false, implemented: 'live' }))
  }

  // 10. Delivery charge computation (informational) ------------------------------------
  const deliveryChargeResult = computeDeliveryCharge(restaurant, isSelfPickup, freeDelivery, distanceKm)
  rules.push(rule({ id: 'delivery-charge', title: 'Delivery charge computation', category: 'pricing', status: 'info',
    summary: isSelfPickup
      ? 'Self-pickup — no delivery charge.'
      : freeDelivery
        ? 'Waived by the applied coupon.'
        : deliveryChargeResult.basis === 'DYNAMIC'
          ? `Dynamic: ₹${restaurant.baseDeliveryCharge} base up to ${restaurant.baseDeliveryDistance} km, +₹${restaurant.extraDeliveryCharge} per ${restaurant.extraDeliveryDistance} km beyond that.`
          : `Fixed: flat ₹${restaurant.deliveryCharges} regardless of distance.`,
    detail: `Computed: ₹${deliveryChargeResult.amount} for ${distanceKm} km.`, blocking: false, implemented: 'live' }))

  // Final pricing -------------------------------------------------------------------
  const amountAfterDiscount = round2(itemTotal - discount)
  const tax = round2((amountAfterDiscount * TAX_PERCENTAGE) / 100)
  const restaurantCharge = round2((amountAfterDiscount * restaurant.restaurantCharges) / 100)
  const payable = round2(amountAfterDiscount + tax + restaurantCharge + deliveryChargeResult.amount)

  const pricing: PricingResult = {
    itemTotal, discount, amountAfterDiscount, tax, restaurantCharge,
    deliveryCharge: deliveryChargeResult.amount, deliveryBasis: deliveryChargeResult.basis,
    distanceKm, payable,
  }

  const blockingRule = rules.find((r) => r.blocking) ?? null
  return { rules, pricing, verdict: blockingRule ? 'blocked' : 'placeable', blockingRule }
}

export const SUGGESTED_ENHANCEMENTS = [
  'Surface a live payment-gateway health check (Razorpay/Stripe/etc. reachability) as its own rule, so a gateway outage fails fast instead of at the payment step.',
  'Add a duplicate-submission guard — reject an identical cart placed at the same restaurant again within a few seconds, to absorb an accidental double-tap on "Place order".',
  'Cap the payable amount allowed on Cash on Delivery (force prepaid above a configurable threshold) — a common loss-mitigation control most platforms apply on top of the accept/reject flag.',
  'Add a banned-pincode / not-serviceable-area list — a harder cutoff than the delivery radius alone for known problem areas (undeliverable, high return/fraud rate, ...).',
  'Block order placement for a suspended/flagged customer account outright, independent of what is in the cart.',
  'Cap quantity per line and total items per order — guards against a scripted bulk-order abuse pattern the current rules never look at.',
]
