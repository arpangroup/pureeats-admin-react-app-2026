// Order orchestration journey — a richer view of an order's lifecycle than the flat
// `orderstatusId` field. Kitchen prep and delivery-partner logistics are modelled as two
// parallel branches that join at PICKED_UP (so the UI can show which side was left
// waiting on the other), and terminal outcomes are split into distinct, accountable
// reasons instead of one catch-all "Cancelled".
import type { OrderRow } from '@/services/orderService'

export type JourneyStateId =
  // Happy path (numbered 1-11, in the order a full delivery journey visits them)
  | 'PAYMENT_PENDING'
  | 'PLACED'
  | 'ACCEPTED'
  | 'PREPARING'
  | 'READY_TO_PICK'
  | 'ASSIGNED'
  | 'PARTNER_REACHED_STORE'
  | 'PICKED_UP'
  | 'ON_THE_WAY'
  | 'NEARBY'
  | 'DELIVERED'
  // Branch / exception states (numbered 12-19)
  | 'PAYMENT_FAILED'
  | 'DELIVERY_PARTNER_REASSIGNED'
  | 'CUSTOMER_UNAVAILABLE'
  | 'REFUND_INITIATED'
  | 'RETURNED'
  | 'CANCELLED_BY_CUSTOMER'
  | 'REJECTED_BY_RESTAURANT'
  | 'AUTO_CANCELLED'

export type JourneyActor = 'Customer' | 'Restaurant' | 'System' | 'Delivery partner'

export interface JourneyStateMeta {
  id: JourneyStateId
  number: number
  title: string
  actor: JourneyActor
  description: string
}

export const JOURNEY_STATES: JourneyStateMeta[] = [
  { id: 'PAYMENT_PENDING', number: 1, title: 'Payment Pending', actor: 'System', description: 'Charge is being authorised for an online/wallet order.' },
  { id: 'PLACED', number: 2, title: 'Order Placed', actor: 'Customer', description: 'Order is created — immediately for COD, once payment clears for online/wallet.' },
  { id: 'ACCEPTED', number: 3, title: 'Confirmed', actor: 'Restaurant', description: 'Restaurant confirms it can fulfil the order.' },
  { id: 'PREPARING', number: 4, title: 'Preparing', actor: 'Restaurant', description: 'Kitchen has started cooking the order.' },
  { id: 'READY_TO_PICK', number: 5, title: 'Ready for Pickup', actor: 'Restaurant', description: 'Food is packed and waiting at the counter.' },
  { id: 'ASSIGNED', number: 6, title: 'Delivery Partner Assigned', actor: 'System', description: 'A rider is matched and heading to the restaurant.' },
  { id: 'PARTNER_REACHED_STORE', number: 7, title: 'Partner Reached Store', actor: 'Delivery partner', description: 'Rider has arrived at the restaurant to collect the order.' },
  { id: 'PICKED_UP', number: 8, title: 'Picked Up', actor: 'Delivery partner', description: 'Rider has collected the order from the restaurant.' },
  { id: 'ON_THE_WAY', number: 9, title: 'On the Way', actor: 'Delivery partner', description: 'Rider is en route to the customer.' },
  { id: 'NEARBY', number: 10, title: 'Nearby', actor: 'Delivery partner', description: 'Rider is close to the drop-off location — arriving any moment.' },
  { id: 'DELIVERED', number: 11, title: 'Delivered', actor: 'Delivery partner', description: 'Order handed to the customer (or self-collected).' },
  { id: 'PAYMENT_FAILED', number: 12, title: 'Payment Failed', actor: 'System', description: 'Charge did not go through — no Order record is ever created from this branch.' },
  { id: 'DELIVERY_PARTNER_REASSIGNED', number: 13, title: 'Partner Reassigned', actor: 'System', description: 'The original rider cancelled or timed out; a new rider is being matched.' },
  { id: 'CUSTOMER_UNAVAILABLE', number: 14, title: 'Customer Unavailable', actor: 'Delivery partner', description: 'Rider is at the drop-off but cannot reach the customer.' },
  { id: 'REFUND_INITIATED', number: 15, title: 'Refund Initiated', actor: 'System', description: 'A post-pickup issue triggered a refund instead of a simple cancellation.' },
  { id: 'RETURNED', number: 16, title: 'Returned', actor: 'System', description: 'Order marked returned/refunded — food never reached the customer.' },
  { id: 'CANCELLED_BY_CUSTOMER', number: 17, title: 'Cancelled by Customer', actor: 'Customer', description: 'Customer cancelled before the order was picked up.' },
  { id: 'REJECTED_BY_RESTAURANT', number: 18, title: 'Rejected by Restaurant', actor: 'Restaurant', description: 'Restaurant declined the order outright.' },
  { id: 'AUTO_CANCELLED', number: 19, title: 'Auto-Cancelled', actor: 'System', description: 'System cancelled automatically — no response, or no rider found in time.' },
]

export const JOURNEY_STATE_BY_ID: Record<JourneyStateId, JourneyStateMeta> = Object.fromEntries(
  JOURNEY_STATES.map((s) => [s.id, s]),
) as Record<JourneyStateId, JourneyStateMeta>

export type JourneyEdgeKind = 'happy' | 'cancel' | 'self-pickup' | 'reassign' | 'refund' | 'payment-fail'

export interface JourneyEdgeMeta {
  id: string
  from: JourneyStateId
  to: JourneyStateId
  label: string
  kind: JourneyEdgeKind
}

function edge(from: JourneyStateId, to: JourneyStateId, label: string, kind: JourneyEdgeKind): JourneyEdgeMeta {
  return { id: `${from}->${to}`, from, to, label, kind }
}

export const JOURNEY_EDGES: JourneyEdgeMeta[] = [
  // Payment
  edge('PAYMENT_PENDING', 'PLACED', 'Payment confirmed', 'happy'),
  edge('PAYMENT_PENDING', 'PAYMENT_FAILED', 'Charge declined', 'payment-fail'),
  // Kitchen spine
  edge('PLACED', 'ACCEPTED', 'Restaurant accepts', 'happy'),
  edge('ACCEPTED', 'PREPARING', 'Kitchen starts', 'happy'),
  edge('PREPARING', 'READY_TO_PICK', 'Order ready', 'happy'),
  // Logistics branch (parallel to kitchen once accepted)
  edge('ACCEPTED', 'ASSIGNED', 'Rider matched', 'happy'),
  edge('READY_TO_PICK', 'ASSIGNED', 'Rider matched', 'happy'),
  edge('ASSIGNED', 'DELIVERY_PARTNER_REASSIGNED', 'Rider cancelled / timed out', 'reassign'),
  edge('DELIVERY_PARTNER_REASSIGNED', 'ASSIGNED', 'New rider matched', 'reassign'),
  edge('ASSIGNED', 'PARTNER_REACHED_STORE', 'Partner reaches restaurant', 'happy'),
  // Join + self-pickup shortcut
  edge('READY_TO_PICK', 'PICKED_UP', 'Handoff (join)', 'happy'),
  edge('PARTNER_REACHED_STORE', 'PICKED_UP', 'Handoff (join)', 'happy'),
  edge('READY_TO_PICK', 'DELIVERED', 'Self-pickup by customer', 'self-pickup'),
  // Drop-off spine
  edge('PICKED_UP', 'ON_THE_WAY', 'Heads to customer', 'happy'),
  edge('ON_THE_WAY', 'NEARBY', 'Approaching drop-off', 'happy'),
  edge('NEARBY', 'DELIVERED', 'Delivered to customer', 'happy'),
  // Drop-off race mirror
  edge('NEARBY', 'CUSTOMER_UNAVAILABLE', 'Cannot reach customer', 'refund'),
  edge('CUSTOMER_UNAVAILABLE', 'DELIVERED', 'Retry succeeds', 'happy'),
  edge('CUSTOMER_UNAVAILABLE', 'REFUND_INITIATED', 'Delivery attempt fails', 'refund'),
  // Post-pickup refund path
  edge('PICKED_UP', 'REFUND_INITIATED', 'Post-pickup issue', 'refund'),
  edge('ON_THE_WAY', 'REFUND_INITIATED', 'Post-pickup issue', 'refund'),
  edge('NEARBY', 'REFUND_INITIATED', 'Post-pickup issue', 'refund'),
  edge('REFUND_INITIATED', 'RETURNED', 'Refund processed', 'refund'),
  // Pre-pickup terminations
  edge('PLACED', 'CANCELLED_BY_CUSTOMER', 'Customer cancels', 'cancel'),
  edge('ACCEPTED', 'CANCELLED_BY_CUSTOMER', 'Customer cancels', 'cancel'),
  edge('PREPARING', 'CANCELLED_BY_CUSTOMER', 'Customer cancels', 'cancel'),
  edge('READY_TO_PICK', 'CANCELLED_BY_CUSTOMER', 'Customer cancels', 'cancel'),
  edge('ASSIGNED', 'CANCELLED_BY_CUSTOMER', 'Customer cancels', 'cancel'),
  edge('PLACED', 'REJECTED_BY_RESTAURANT', 'Restaurant declines', 'cancel'),
  edge('PLACED', 'AUTO_CANCELLED', 'No response in time', 'cancel'),
  edge('ASSIGNED', 'AUTO_CANCELLED', 'No rider found in time', 'cancel'),
  edge('READY_TO_PICK', 'AUTO_CANCELLED', 'No rider ever arrived', 'cancel'),
]

export interface JourneyNodeState {
  id: JourneyStateId
  /** false = this state doesn't apply to this order at all (e.g. payment states for a COD order). */
  applicable: boolean
  reached: boolean
  current: boolean
  at: string | null
  waitingNote?: string
}

export type RaceKind = 'partner-waited' | 'food-waited' | 'together' | 'partner-pending' | 'food-pending' | 'not-applicable'

export interface RaceInsight {
  kind: RaceKind
  minutes: number | null
  message: string
}

export type DropoffKind = 'clean' | 'retried' | 'failed' | 'pending' | 'not-applicable'

export interface DropoffInsight {
  kind: DropoffKind
  message: string
}

export interface OrderSlaMetrics {
  kitchenPrepMinutes: number | null
  riderTravelToStoreMinutes: number | null
  riderWaitAtStoreMinutes: number | null
  foodWaitForPickupMinutes: number | null
  handoffToDropoffMinutes: number | null
  totalFulfillmentMinutes: number | null
}

export type TerminalKind =
  | 'in-progress'
  | 'delivered'
  | 'returned'
  | 'cancelled-by-customer'
  | 'rejected-by-restaurant'
  | 'auto-cancelled'

export interface OrderJourney {
  orderId: number
  deliveryType: 'delivery' | 'pickup'
  isOnlinePayment: boolean
  terminalKind: TerminalKind
  cancelledFrom: JourneyStateId | null
  wasReassigned: boolean
  currentState: JourneyStateId
  nodes: Record<JourneyStateId, JourneyNodeState>
  pathEdgeIds: string[]
  race: RaceInsight
  dropoff: DropoffInsight
  sla: OrderSlaMetrics
}

const MIN = 60 * 1000

function iso(ms: number): string {
  return new Date(ms).toISOString()
}

function minutesBetween(a: number, b: number): number {
  return Math.round((b - a) / MIN)
}

function emptyNode(id: JourneyStateId): JourneyNodeState {
  return { id, applicable: true, reached: false, current: false, at: null }
}

interface CancelProfile {
  origin: JourneyStateId
  kitchenRank: 0 | 1 | 2 | 3
  assigned: boolean
}

const CANCEL_BY_CUSTOMER_PROFILES: CancelProfile[] = [
  { origin: 'PLACED', kitchenRank: 0, assigned: false },
  { origin: 'ACCEPTED', kitchenRank: 1, assigned: false },
  { origin: 'PREPARING', kitchenRank: 2, assigned: false },
  { origin: 'READY_TO_PICK', kitchenRank: 3, assigned: false },
  { origin: 'ASSIGNED', kitchenRank: 2, assigned: true },
]

const AUTO_CANCEL_PROFILES: CancelProfile[] = [
  { origin: 'PLACED', kitchenRank: 0, assigned: false },
  { origin: 'READY_TO_PICK', kitchenRank: 3, assigned: false },
  { origin: 'ASSIGNED', kitchenRank: 3, assigned: true },
]

type ReturnOrigin = 'PICKED_UP' | 'ON_THE_WAY' | 'NEARBY' | 'CUSTOMER_UNAVAILABLE'
const RETURN_ORIGINS: ReturnOrigin[] = ['PICKED_UP', 'ON_THE_WAY', 'NEARBY', 'CUSTOMER_UNAVAILABLE']

const KITCHEN_LADDER: JourneyStateId[] = ['PLACED', 'ACCEPTED', 'PREPARING', 'READY_TO_PICK']

// The mock backend only tracks a coarse status name; everything below is a deterministic
// (seeded by order id) but plausible reconstruction of a fuller timeline, since it doesn't
// track PREPARING, PARTNER_REACHED_STORE, or the exception branches separately yet.
export function buildOrderJourney(order: OrderRow): OrderJourney {
  const nodes = Object.fromEntries(JOURNEY_STATES.map((s) => [s.id, emptyNode(s.id)])) as Record<JourneyStateId, JourneyNodeState>
  const pathEdgeIds: string[] = []
  const seed = order.id
  const isPickup = order.deliveryType === 'pickup'
  const isOnlinePayment = order.paymentMode !== 'cod'
  const placedAt = new Date(order.createdAt).getTime()
  const terminatedAt = new Date(order.updatedAt).getTime()

  function reach(id: JourneyStateId, at: number, waitingNote?: string) {
    nodes[id] = { ...nodes[id], reached: true, at: iso(at), waitingNote }
  }
  function notApplicable(id: JourneyStateId) {
    nodes[id] = { ...nodes[id], applicable: false }
  }
  function markCurrent(id: JourneyStateId) {
    nodes[id] = { ...nodes[id], current: true }
  }
  function addEdge(from: JourneyStateId, to: JourneyStateId) {
    const found = JOURNEY_EDGES.find((e) => e.from === from && e.to === to)
    if (found) pathEdgeIds.push(found.id)
  }

  // --- Payment ---------------------------------------------------------
  if (isOnlinePayment) {
    reach('PAYMENT_PENDING', placedAt - 20 * 1000)
    addEdge('PAYMENT_PENDING', 'PLACED')
  } else {
    notApplicable('PAYMENT_PENDING')
    notApplicable('PAYMENT_FAILED')
  }
  reach('PLACED', placedAt)

  const acceptedAt = placedAt + 3 * MIN
  const preparingAt = acceptedAt + 1 * MIN
  const prepTime = Math.max(order.prepareTime, 10) * MIN
  const readyAt = preparingAt + prepTime
  const assignedAt = acceptedAt + 2 * MIN
  const travelToStore = 8 * MIN

  function kitchenAt(rank: 0 | 1 | 2 | 3): number {
    return [placedAt, acceptedAt, preparingAt, readyAt][rank]
  }
  function reachKitchenLadder(uptoRank: 0 | 1 | 2 | 3) {
    for (let r = 1; r <= uptoRank; r++) {
      addEdge(KITCHEN_LADDER[r - 1], KITCHEN_LADDER[r])
      reach(KITCHEN_LADDER[r], kitchenAt(r as 0 | 1 | 2 | 3))
    }
  }

  const isRejected = order.statusName === 'Rejected'
  const isCancelledByCustomer = order.statusName === 'Cancelled'
  const isAutoCancelled = order.statusName === 'Auto-Cancelled'
  const isReturned = order.statusName === 'Returned' && !isPickup // self-pickup can't fail a handoff — see fallback below
  const isDelivered = order.statusName === 'Delivered'
  const isReturnedButPickup = order.statusName === 'Returned' && isPickup

  let terminalKind: TerminalKind = 'in-progress'
  let cancelledFrom: JourneyStateId | null = null
  let currentState: JourneyStateId = 'PLACED'
  let wasReassigned = false
  let race: RaceInsight = isPickup
    ? { kind: 'not-applicable', minutes: null, message: 'Self-pickup order — no delivery partner involved.' }
    : { kind: 'not-applicable', minutes: null, message: 'No delivery partner assigned yet.' }
  let dropoff: DropoffInsight = isPickup
    ? { kind: 'not-applicable', message: 'Self-pickup order — customer collects in person.' }
    : { kind: 'not-applicable', message: 'Not there yet — order hasn’t reached the drop-off stage.' }
  const sla: OrderSlaMetrics = {
    kitchenPrepMinutes: null,
    riderTravelToStoreMinutes: null,
    riderWaitAtStoreMinutes: null,
    foodWaitForPickupMinutes: null,
    handoffToDropoffMinutes: null,
    totalFulfillmentMinutes: null,
  }

  if (isPickup) {
    notApplicable('ASSIGNED')
    notApplicable('DELIVERY_PARTNER_REASSIGNED')
    notApplicable('PARTNER_REACHED_STORE')
    notApplicable('PICKED_UP')
    notApplicable('ON_THE_WAY')
    notApplicable('NEARBY')
    notApplicable('CUSTOMER_UNAVAILABLE')
    notApplicable('REFUND_INITIATED')
    notApplicable('RETURNED')
  }

  // --- Pre-pickup terminations ------------------------------------------
  if (isRejected) {
    terminalKind = 'rejected-by-restaurant'
    cancelledFrom = 'PLACED'
    addEdge('PLACED', 'REJECTED_BY_RESTAURANT')
    reach('REJECTED_BY_RESTAURANT', terminatedAt)
    currentState = 'REJECTED_BY_RESTAURANT'
  } else if (isCancelledByCustomer || (isReturnedButPickup && seed % 2 === 0)) {
    // Self-pickup orders never reach ASSIGNED, so exclude assigned-origin profiles for them.
    const candidates = isPickup ? CANCEL_BY_CUSTOMER_PROFILES.filter((p) => !p.assigned) : CANCEL_BY_CUSTOMER_PROFILES
    const profile = candidates[seed % candidates.length]
    terminalKind = 'cancelled-by-customer'
    cancelledFrom = profile.origin
    reachKitchenLadder(profile.kitchenRank)
    if (profile.assigned) {
      addEdge('ACCEPTED', 'ASSIGNED')
      reach('ASSIGNED', assignedAt)
      race = { kind: 'partner-pending', minutes: null, message: 'Delivery partner had been assigned — order was cancelled before they reached the restaurant.' }
    }
    addEdge(profile.origin, 'CANCELLED_BY_CUSTOMER')
    reach('CANCELLED_BY_CUSTOMER', terminatedAt)
    currentState = 'CANCELLED_BY_CUSTOMER'
  } else if (isAutoCancelled || (isReturnedButPickup && seed % 2 === 1)) {
    const candidates = isPickup ? AUTO_CANCEL_PROFILES.filter((p) => !p.assigned) : AUTO_CANCEL_PROFILES
    const profile = candidates[seed % candidates.length]
    terminalKind = 'auto-cancelled'
    cancelledFrom = profile.origin
    reachKitchenLadder(profile.kitchenRank)
    if (profile.assigned) {
      addEdge(profile.kitchenRank >= 3 ? 'READY_TO_PICK' : 'ACCEPTED', 'ASSIGNED')
      reach('ASSIGNED', assignedAt)
      race = { kind: 'partner-pending', minutes: null, message: 'Delivery partner had been assigned but never arrived — the system auto-cancelled after no rider was found in time.' }
    }
    addEdge(profile.origin, 'AUTO_CANCELLED')
    reach('AUTO_CANCELLED', terminatedAt)
    currentState = 'AUTO_CANCELLED'
  } else if (isPickup) {
    // Self-pickup: either delivered (self-collected) or still progressing through the kitchen ladder.
    // 'Delivered (Self-Pickup)' is the live backend's distinct label for the same terminal state.
    const rank: Record<string, number> = { Placed: 0, Accepted: 1, Preparing: 2, 'Ready for Pickup': 3, Delivered: 4, 'Delivered (Self-Pickup)': 4 }
    const reachedRank = rank[order.statusName] ?? 0
    reachKitchenLadder(Math.min(reachedRank, 3) as 0 | 1 | 2 | 3)
    if (isDelivered || order.statusName === 'Delivered (Self-Pickup)' || reachedRank >= 4) {
      const deliveredAt = readyAt + 4 * MIN
      addEdge('READY_TO_PICK', 'DELIVERED')
      reach('DELIVERED', deliveredAt)
      terminalKind = 'delivered'
      currentState = 'DELIVERED'
      sla.totalFulfillmentMinutes = minutesBetween(placedAt, deliveredAt)
    } else {
      currentState = KITCHEN_LADDER[Math.min(reachedRank, 3)]
      markCurrent(currentState)
    }
  } else {
    // --- Full delivery journey: kitchen ladder + parallel logistics branch ---
    // 'Rider Assigned' is a real live-backend status with no mock-data equivalent — the mock
    // fixture never produces it, so this entry is a no-op there and only matters against the API.
    const rank: Record<string, number> = {
      Placed: 0, Accepted: 1, Preparing: 2, 'Ready for Pickup': 3, 'Rider Assigned': 4,
      'Picked Up': 5, 'On the way': 6, Delivered: 8,
    }
    // Returned implies the order got all the way through pickup, regardless of rank lookup.
    const baseRank = isReturned ? 7 : (rank[order.statusName] ?? 0)
    reachKitchenLadder(Math.min(baseRank, 3) as 0 | 1 | 2 | 3)
    sla.kitchenPrepMinutes = nodes.READY_TO_PICK.reached ? minutesBetween(preparingAt, readyAt) : null
    // Returned orders always fail post-pickup — which exact stage is chosen deterministically
    // and used below to gate how far the drop-off spine actually progressed.
    const returnOrigin: ReturnOrigin | null = isReturned ? RETURN_ORIGINS[seed % RETURN_ORIGINS.length] : null

    // Assignment can only have happened once the restaurant has at least accepted the order.
    const assignable = baseRank >= 1 || isReturned
    let effectiveAssignedAt = assignedAt
    if (assignable) {
      addEdge('ACCEPTED', 'ASSIGNED')
      reach('ASSIGNED', assignedAt)

      // Reassignment demo — roughly a quarter of delivery orders show one rider drop-out in
      // their history before a replacement was matched, purely to exercise the reassignment path.
      if (seed % 4 === 0) {
        wasReassigned = true
        const reassignedAt = assignedAt + 5 * MIN
        const secondAssignAt = reassignedAt + 3 * MIN
        addEdge('ASSIGNED', 'DELIVERY_PARTNER_REASSIGNED')
        reach('DELIVERY_PARTNER_REASSIGNED', reassignedAt, 'Original rider dropped out')
        addEdge('DELIVERY_PARTNER_REASSIGNED', 'ASSIGNED')
        effectiveAssignedAt = secondAssignAt
        reach('ASSIGNED', effectiveAssignedAt)
      }
    }

    const raceOutcome: RaceKind = seed % 3 === 0 ? 'partner-waited' : seed % 3 === 1 ? 'food-waited' : 'together'
    let reachedStoreAt: number
    if (raceOutcome === 'partner-waited') reachedStoreAt = effectiveAssignedAt + travelToStore
    else if (raceOutcome === 'food-waited') reachedStoreAt = readyAt + 6 * MIN
    else reachedStoreAt = readyAt - 1 * MIN
    sla.riderTravelToStoreMinutes = assignable ? minutesBetween(effectiveAssignedAt, reachedStoreAt) : null

    const reachedStorePossible = baseRank >= 5 || isReturned
    const reachedStoreLiveEarly = assignable && !reachedStorePossible && reachedStoreAt <= Date.now() && raceOutcome === 'partner-waited'
    if (reachedStorePossible || reachedStoreLiveEarly) {
      addEdge('ASSIGNED', 'PARTNER_REACHED_STORE')
      reach('PARTNER_REACHED_STORE', reachedStoreAt)
    }

    if (nodes.PARTNER_REACHED_STORE.reached) {
      const waitMin = Math.abs(minutesBetween(readyAt, reachedStoreAt))
      if (waitMin <= 1) {
        race = { kind: 'together', minutes: waitMin, message: 'Delivery partner arrived right as the order became ready — no wait.' }
        sla.riderWaitAtStoreMinutes = 0
        sla.foodWaitForPickupMinutes = 0
      } else if (reachedStoreAt < readyAt) {
        race = { kind: 'partner-waited', minutes: waitMin, message: `Delivery partner reached the restaurant ${waitMin} min before the food was ready — waited at the store.` }
        nodes.PARTNER_REACHED_STORE.waitingNote = `Waited ${waitMin} min for food`
        sla.riderWaitAtStoreMinutes = waitMin
        sla.foodWaitForPickupMinutes = 0
      } else {
        race = { kind: 'food-waited', minutes: waitMin, message: `Order was ready ${waitMin} min before the delivery partner arrived — food waited on the counter.` }
        nodes.READY_TO_PICK.waitingNote = `Waited ${waitMin} min for pickup`
        sla.riderWaitAtStoreMinutes = 0
        sla.foodWaitForPickupMinutes = waitMin
      }
    } else if (reachedStoreLiveEarly === false && nodes.ASSIGNED.reached && nodes.READY_TO_PICK.reached) {
      race = { kind: 'food-pending', minutes: null, message: 'Order is ready and waiting — delivery partner is still on the way to the restaurant.' }
      nodes.READY_TO_PICK.waitingNote = 'Waiting for partner'
    } else if (nodes.ASSIGNED.reached) {
      race = { kind: 'partner-pending', minutes: null, message: 'Delivery partner assigned — heading to the restaurant.' }
    }

    const pickedAt = Math.max(readyAt, reachedStoreAt) + 1 * MIN
    const pickedUpReached = baseRank >= 5 || isReturned
    if (pickedUpReached) {
      addEdge('READY_TO_PICK', 'PICKED_UP')
      addEdge('PARTNER_REACHED_STORE', 'PICKED_UP')
      reach('PICKED_UP', pickedAt)
    }

    const onTheWayAt = pickedAt + 1 * MIN
    const nearbyAt = onTheWayAt + 10 * MIN
    const onTheWayReached = pickedUpReached && (isReturned ? returnOrigin !== 'PICKED_UP' : baseRank >= 6 || isDelivered)
    if (onTheWayReached) {
      addEdge('PICKED_UP', 'ON_THE_WAY')
      reach('ON_THE_WAY', onTheWayAt)
    }
    // "Nearby" has no distinct status in the coarse order-status list yet — reconstructed
    // deterministically so roughly half of in-progress "On the way" orders show as nearby.
    const nearbyReached =
      onTheWayReached && (isReturned ? returnOrigin === 'NEARBY' || returnOrigin === 'CUSTOMER_UNAVAILABLE' : isDelivered || seed % 2 === 0)
    if (nearbyReached) {
      addEdge('ON_THE_WAY', 'NEARBY')
      reach('NEARBY', nearbyAt)
    }

    if (isReturned && returnOrigin) {
      // Post-pickup issue — which exact stage the delivery failed at, and whether the rider
      // first tried (and failed) to hand off in person, are both chosen above via returnOrigin.
      terminalKind = 'returned'
      let originAt = pickedAt
      if (returnOrigin === 'ON_THE_WAY') originAt = onTheWayAt
      else if (returnOrigin === 'NEARBY') originAt = nearbyAt
      if (returnOrigin === 'CUSTOMER_UNAVAILABLE') {
        const unavailableAt = nearbyAt + 3 * MIN
        addEdge('NEARBY', 'CUSTOMER_UNAVAILABLE')
        reach('CUSTOMER_UNAVAILABLE', unavailableAt)
        cancelledFrom = 'CUSTOMER_UNAVAILABLE'
        addEdge('CUSTOMER_UNAVAILABLE', 'REFUND_INITIATED')
        dropoff = { kind: 'failed', message: 'Rider reached the customer but could not complete the handoff — delivery failed.' }
        originAt = unavailableAt
      } else {
        cancelledFrom = returnOrigin
        addEdge(returnOrigin, 'REFUND_INITIATED')
        dropoff = { kind: 'not-applicable', message: 'Order was returned before reaching the customer.' }
      }
      const refundAt = originAt + 15 * MIN
      const returnedAt = refundAt + 30 * MIN
      reach('REFUND_INITIATED', refundAt)
      addEdge('REFUND_INITIATED', 'RETURNED')
      reach('RETURNED', returnedAt)
      currentState = 'RETURNED'
      sla.handoffToDropoffMinutes = minutesBetween(pickedAt, refundAt)
    } else if (isDelivered) {
      terminalKind = 'delivered'
      if (seed % 4 === 0) {
        // Drop-off race mirror demo: rider reaches Nearby but the customer doesn't answer,
        // then a retry succeeds — the delivered-side twin of the pickup-side wait.
        const unavailableAt = nearbyAt + 3 * MIN
        const deliveredAt = unavailableAt + 6 * MIN
        addEdge('NEARBY', 'CUSTOMER_UNAVAILABLE')
        reach('CUSTOMER_UNAVAILABLE', unavailableAt)
        addEdge('CUSTOMER_UNAVAILABLE', 'DELIVERED')
        reach('DELIVERED', deliveredAt)
        dropoff = { kind: 'retried', message: 'Customer did not answer on the first attempt — rider waited nearby and completed the handoff on retry.' }
        sla.handoffToDropoffMinutes = minutesBetween(pickedAt, deliveredAt)
      } else {
        const deliveredAt = nearbyAt + 3 * MIN
        addEdge('NEARBY', 'DELIVERED')
        reach('DELIVERED', deliveredAt)
        dropoff = { kind: 'clean', message: 'Straight handoff — customer was available when the rider arrived.' }
        sla.handoffToDropoffMinutes = minutesBetween(pickedAt, deliveredAt)
      }
      currentState = 'DELIVERED'
      sla.totalFulfillmentMinutes = minutesBetween(placedAt, new Date(nodes.DELIVERED.at as string).getTime())
    } else {
      const laterOrder: JourneyStateId[] = ['PLACED', 'ACCEPTED', 'PREPARING', 'READY_TO_PICK', 'ASSIGNED', 'PARTNER_REACHED_STORE', 'PICKED_UP', 'ON_THE_WAY', 'NEARBY']
      currentState = [...laterOrder].reverse().find((id) => nodes[id].reached) ?? 'PLACED'
      markCurrent(currentState)
      if (currentState === 'NEARBY') dropoff = { kind: 'pending', message: 'Rider is nearby — handoff not confirmed yet.' }
      else if (nodes.PICKED_UP.reached) dropoff = { kind: 'pending', message: 'Order is on its way — not at the drop-off yet.' }
    }
  }

  return {
    orderId: order.id,
    deliveryType: order.deliveryType,
    isOnlinePayment,
    terminalKind,
    cancelledFrom,
    wasReassigned,
    currentState,
    nodes,
    pathEdgeIds,
    race,
    dropoff,
    sla,
  }
}
