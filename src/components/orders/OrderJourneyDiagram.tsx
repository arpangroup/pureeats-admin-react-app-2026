import { formatDate } from '@/lib/format'
import { JOURNEY_EDGES, JOURNEY_STATES, type JourneyStateId, type OrderJourney } from '@/lib/orderJourney'

interface Rect {
  x: number
  y: number
  w: number
  h: number
}

const NODE_W = 152
const NODE_H = 80

// Column grid (pitch 192, shared by the main lanes and the exception row below them so
// each branch state lines up under the main-path node it stems from).
const C = [20, 212, 404, 596, 788, 980, 1172, 1364, 1556]
const Y_MAIN = 150 // kitchen spine: Payment Pending, Placed, Accepted, Preparing, Ready for Pickup
const Y_LOGISTICS = 350 // Assigned, Partner Reached Store
const Y_JOIN = 250 // Picked Up, On the Way, Nearby, Delivered
const Y_EXCEPTION = 520 // every branch/terminal state

const NODE_LAYOUT: Record<JourneyStateId, Rect> = {
  PAYMENT_PENDING: { x: C[0], y: Y_MAIN, w: NODE_W, h: NODE_H },
  PLACED: { x: C[1], y: Y_MAIN, w: NODE_W, h: NODE_H },
  ACCEPTED: { x: C[2], y: Y_MAIN, w: NODE_W, h: NODE_H },
  PREPARING: { x: C[3], y: Y_MAIN, w: NODE_W, h: NODE_H },
  READY_TO_PICK: { x: C[4], y: Y_MAIN, w: NODE_W, h: NODE_H },
  ASSIGNED: { x: C[3], y: Y_LOGISTICS, w: NODE_W, h: NODE_H },
  PARTNER_REACHED_STORE: { x: C[4], y: Y_LOGISTICS, w: NODE_W, h: NODE_H },
  PICKED_UP: { x: C[5], y: Y_JOIN, w: NODE_W, h: NODE_H },
  ON_THE_WAY: { x: C[6], y: Y_JOIN, w: NODE_W, h: NODE_H },
  NEARBY: { x: C[7], y: Y_JOIN, w: NODE_W, h: NODE_H },
  DELIVERED: { x: C[8], y: Y_JOIN, w: NODE_W, h: NODE_H },
  PAYMENT_FAILED: { x: C[0], y: Y_EXCEPTION, w: NODE_W, h: NODE_H },
  REJECTED_BY_RESTAURANT: { x: C[1], y: Y_EXCEPTION, w: NODE_W, h: NODE_H },
  CANCELLED_BY_CUSTOMER: { x: C[2], y: Y_EXCEPTION, w: NODE_W, h: NODE_H },
  DELIVERY_PARTNER_REASSIGNED: { x: C[3], y: Y_EXCEPTION, w: NODE_W, h: NODE_H },
  AUTO_CANCELLED: { x: C[4], y: Y_EXCEPTION, w: NODE_W, h: NODE_H },
  CUSTOMER_UNAVAILABLE: { x: C[5], y: Y_EXCEPTION, w: NODE_W, h: NODE_H },
  REFUND_INITIATED: { x: C[6], y: Y_EXCEPTION, w: NODE_W, h: NODE_H },
  RETURNED: { x: C[7], y: Y_EXCEPTION, w: NODE_W, h: NODE_H },
}

const VIEW_W = 1726
const VIEW_H = 660

function elbowPath(a: Rect, b: Rect): string {
  const ay = a.y + a.h / 2
  const by = b.y + b.h / 2
  if (Math.abs(ay - by) < 4) {
    const startX = b.x > a.x ? a.x + a.w : a.x
    const endX = b.x > a.x ? b.x : b.x + b.w
    return `M ${startX} ${ay} L ${endX} ${by}`
  }
  const ax = a.x + a.w / 2
  const bx = b.x + b.w / 2
  if (by > ay) {
    const startY = a.y + a.h
    const endY = b.y
    const midY = (startY + endY) / 2
    return `M ${ax} ${startY} L ${ax} ${midY} L ${bx} ${midY} L ${bx} ${endY}`
  }
  const startY = a.y
  const endY = b.y + b.h
  const midY = (startY + endY) / 2
  return `M ${ax} ${startY} L ${ax} ${midY} L ${bx} ${midY} L ${bx} ${endY}`
}

const SELF_PICKUP_PATH = (() => {
  const a = NODE_LAYOUT.READY_TO_PICK
  const b = NODE_LAYOUT.DELIVERED
  const x1 = a.x + a.w
  const y1 = a.y + a.h / 2
  const x2 = b.x
  const y2 = b.y + b.h / 2
  const midX = (x1 + x2) / 2
  return `M ${x1} ${y1} Q ${midX} 60 ${x2} ${y2}`
})()

// The reassignment loop shares a pair of nodes in both directions — offset left/right so
// the "rider dropped out" and "new rider matched" edges render as two parallel lines, not one.
const REASSIGN_DOWN_PATH = (() => {
  const a = NODE_LAYOUT.ASSIGNED
  const b = NODE_LAYOUT.DELIVERY_PARTNER_REASSIGNED
  const x = a.x + a.w / 2 - 24
  return `M ${x} ${a.y + a.h} L ${x} ${b.y}`
})()
const REASSIGN_UP_PATH = (() => {
  const a = NODE_LAYOUT.ASSIGNED
  const b = NODE_LAYOUT.DELIVERY_PARTNER_REASSIGNED
  const x = a.x + a.w / 2 + 24
  return `M ${x} ${b.y} L ${x} ${a.y + a.h}`
})()

function nodeIconPath(kind: 'check' | 'x' | 'dot' | 'ring') {
  switch (kind) {
    case 'check':
      return <path d="M4 8.5l2.5 2.5L12 5" fill="none" stroke="white" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    case 'x':
      return <path d="M4.5 4.5l7 7M11.5 4.5l-7 7" fill="none" stroke="white" strokeWidth={1.8} strokeLinecap="round" />
    case 'ring':
      return <circle cx={8} cy={8} r={3.2} fill="white" />
    default:
      return <circle cx={8} cy={8} r={2.6} fill="currentColor" />
  }
}

const EDGE_COLOR: Record<string, { stroke: string; marker: string }> = {
  happy: { stroke: 'stroke-emerald-500', marker: 'arrow-happy' },
  'self-pickup': { stroke: 'stroke-sky-500', marker: 'arrow-self' },
  cancel: { stroke: 'stroke-rose-500', marker: 'arrow-cancel' },
  'payment-fail': { stroke: 'stroke-rose-500', marker: 'arrow-cancel' },
  reassign: { stroke: 'stroke-amber-500', marker: 'arrow-reassign' },
  refund: { stroke: 'stroke-violet-500', marker: 'arrow-refund' },
}

export function OrderJourneyDiagram({ journey }: { journey: OrderJourney }) {
  const isEdgeActive = (id: string) => journey.pathEdgeIds.includes(id)

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} className="h-auto w-full min-w-[1580px]">
        <defs>
          <marker id="arrow-neutral" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0 0L10 5L0 10z" className="fill-slate-300 dark:fill-slate-700" />
          </marker>
          <marker id="arrow-happy" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0 0L10 5L0 10z" className="fill-emerald-500" />
          </marker>
          <marker id="arrow-self" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0 0L10 5L0 10z" className="fill-sky-500" />
          </marker>
          <marker id="arrow-cancel" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0 0L10 5L0 10z" className="fill-rose-500" />
          </marker>
          <marker id="arrow-reassign" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0 0L10 5L0 10z" className="fill-amber-500" />
          </marker>
          <marker id="arrow-refund" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0 0L10 5L0 10z" className="fill-violet-500" />
          </marker>
        </defs>

        {JOURNEY_EDGES.map((edgeMeta) => {
          const active = isEdgeActive(edgeMeta.id)
          const isSelfPickup = edgeMeta.id === 'READY_TO_PICK->DELIVERED'
          const isReassignDown = edgeMeta.id === 'ASSIGNED->DELIVERY_PARTNER_REASSIGNED'
          const isReassignUp = edgeMeta.id === 'DELIVERY_PARTNER_REASSIGNED->ASSIGNED'
          const path = isSelfPickup
            ? SELF_PICKUP_PATH
            : isReassignDown
              ? REASSIGN_DOWN_PATH
              : isReassignUp
                ? REASSIGN_UP_PATH
                : elbowPath(NODE_LAYOUT[edgeMeta.from], NODE_LAYOUT[edgeMeta.to])
          const colors = EDGE_COLOR[edgeMeta.kind]
          const marker = active ? colors.marker : 'arrow-neutral'
          const strokeClass = active ? colors.stroke : 'stroke-slate-200 dark:stroke-slate-700'
          return (
            <path
              key={edgeMeta.id}
              d={path}
              fill="none"
              className={strokeClass}
              strokeWidth={active ? 2.75 : 1.4}
              strokeDasharray={edgeMeta.kind !== 'happy' ? '6 4' : undefined}
              markerEnd={`url(#${marker})`}
              opacity={active ? 1 : 0.55}
            />
          )
        })}

        {JOURNEY_STATES.map((meta) => {
          const rect = NODE_LAYOUT[meta.id]
          const state = journey.nodes[meta.id]
          const isBadTerminal = ['CANCELLED_BY_CUSTOMER', 'REJECTED_BY_RESTAURANT', 'AUTO_CANCELLED', 'PAYMENT_FAILED', 'RETURNED'].includes(meta.id)
          const isReachedBad = isBadTerminal && state.reached
          let bucket: 'reached' | 'current' | 'pending' | 'bad' | 'na' = 'pending'
          if (!state.applicable) bucket = 'na'
          else if (isReachedBad) bucket = 'bad'
          else if (state.current) bucket = 'current'
          else if (state.reached) bucket = 'reached'

          const palette = {
            reached: { border: 'stroke-emerald-400', bg: 'fill-emerald-50 dark:fill-emerald-500/10', badge: 'fill-emerald-500', text: 'fill-emerald-900 dark:fill-emerald-200', sub: 'fill-emerald-600/70 dark:fill-emerald-400/70' },
            current: { border: 'stroke-brand-500', bg: 'fill-brand-50 dark:fill-brand-500/10', badge: 'fill-brand-600', text: 'fill-brand-900 dark:fill-brand-200', sub: 'fill-brand-600/80 dark:fill-brand-400/80' },
            pending: { border: 'stroke-slate-200 dark:stroke-slate-700', bg: 'fill-white dark:fill-slate-900', badge: 'fill-slate-300 dark:fill-slate-600', text: 'fill-slate-400 dark:fill-slate-500', sub: 'fill-slate-300 dark:fill-slate-600' },
            bad: { border: 'stroke-rose-400', bg: 'fill-rose-50 dark:fill-rose-500/10', badge: 'fill-rose-500', text: 'fill-rose-900 dark:fill-rose-200', sub: 'fill-rose-600/70 dark:fill-rose-400/70' },
            na: { border: 'stroke-slate-100 dark:stroke-slate-800', bg: 'fill-slate-50 dark:fill-slate-900/40', badge: 'fill-slate-200 dark:fill-slate-700', text: 'fill-slate-300 dark:fill-slate-600', sub: 'fill-slate-300 dark:fill-slate-700' },
          }[bucket]

          const iconKind = bucket === 'reached' || bucket === 'bad' ? (bucket === 'bad' ? 'x' : 'check') : bucket === 'current' ? 'ring' : 'dot'
          const timeLabel = !state.applicable ? 'Not applicable' : state.at ? formatDate(state.at) : state.current ? 'In progress…' : 'Pending'

          return (
            <g key={meta.id} opacity={bucket === 'na' ? 0.55 : 1}>
              {bucket === 'current' && (
                <rect x={rect.x - 3} y={rect.y - 3} width={rect.w + 6} height={rect.h + 6} rx={14} className="fill-none stroke-brand-400" strokeWidth={2} opacity={0.6}>
                  <animate attributeName="opacity" values="0.6;0.1;0.6" dur="1.8s" repeatCount="indefinite" />
                </rect>
              )}
              <rect
                x={rect.x}
                y={rect.y}
                width={rect.w}
                height={rect.h}
                rx={12}
                className={`${palette.bg} ${palette.border}`}
                strokeWidth={bucket === 'pending' || bucket === 'na' ? 1.25 : 1.75}
                strokeDasharray={bucket === 'pending' || bucket === 'na' ? '4 3' : undefined}
              />
              <circle cx={rect.x + 20} cy={rect.y + 20} r={11} className={palette.badge} />
              <text x={rect.x + 20} y={rect.y + 24} textAnchor="middle" className="fill-white text-[11px] font-bold">
                {meta.number}
              </text>
              <g transform={`translate(${rect.x + rect.w - 28}, ${rect.y + 8})`}>{bucket !== 'na' && nodeIconPath(iconKind)}</g>
              <text x={rect.x + 14} y={rect.y + 44} className={`${palette.text} text-[12px] font-semibold`}>
                {meta.title}
              </text>
              <text x={rect.x + 14} y={rect.y + 59} className={`${palette.sub} text-[10px] font-medium uppercase tracking-wide`}>
                {meta.actor}
              </text>
              <text x={rect.x + 14} y={rect.y + 73} className={`${palette.sub} text-[10.5px]`}>
                {timeLabel}
              </text>
              {state.waitingNote && <rect x={rect.x + rect.w - 8} y={rect.y - 12} width={8} height={8} rx={4} className="fill-amber-400" />}
            </g>
          )
        })}
      </svg>
    </div>
  )
}
