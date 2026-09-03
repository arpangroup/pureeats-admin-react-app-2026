import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Bike, Calculator, GitBranch, History, MapPin, MessageSquare, Phone, Printer, Receipt, Store, Tag, User as UserIcon, UserPlus } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { LoadingBlock, EmptyState } from '@/components/ui/Feedback'
import { Select } from '@/components/ui/FormControls'
import { Modal } from '@/components/ui/Modal'
import { useAsync } from '@/hooks/useAsync'
import { orderService } from '@/services/orderService'
import { deliveryGuyService } from '@/services/deliveryGuyService'
import { users } from '@/mocks/fixtures'
import { formatCurrency, formatDate } from '@/lib/format'
import { OrderStatusBadge } from './OrderStatusBadge'
import { OrderInvoice } from './OrderInvoice'
import { OrderJourneyOverlay } from './OrderJourneyOverlay'

export function OrderDetailView({ basePath }: { basePath: string }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const orderId = Number(id)
  const { data: order, isLoading, reload } = useAsync(() => orderService.get(orderId), [orderId])
  const [updating, setUpdating] = useState(false)
  const { data: statuses } = useAsync(() => orderService.statuses(), [])
  const { data: journey } = useAsync(() => orderService.journey(orderId), [orderId, order?.statusName])
  const { data: timeline } = useAsync(() => orderService.timeline(orderId, order ?? undefined), [orderId, order?.statusName])
  const isAdmin = basePath.startsWith('/admin')
  const { data: riders } = useAsync(() => (isAdmin ? deliveryGuyService.list({ perPage: 100 }) : Promise.resolve(null)), [isAdmin])
  const [assignModalOpen, setAssignModalOpen] = useState(false)
  const [selectedRiderId, setSelectedRiderId] = useState<number | ''>('')
  const [assigning, setAssigning] = useState(false)
  const [assignError, setAssignError] = useState<string | null>(null)
  const [journeyOpen, setJourneyOpen] = useState(false)

  async function handleStatusChange(statusId: number) {
    const status = statuses?.find((s) => s.id === statusId)
    if (!status) return
    setUpdating(true)
    try {
      await orderService.updateStatus(orderId, status)
      reload()
    } finally {
      setUpdating(false)
    }
  }

  async function handleAssignDriver() {
    if (!selectedRiderId) return
    setAssigning(true)
    setAssignError(null)
    try {
      await orderService.assignDriver(orderId, Number(selectedRiderId))
      setAssignModalOpen(false)
      setSelectedRiderId('')
      reload()
    } catch (err) {
      setAssignError(err instanceof Error ? err.message : 'Could not assign driver')
    } finally {
      setAssigning(false)
    }
  }

  if (isLoading) return <LoadingBlock />
  if (!order) return <EmptyState title="Order not found" />

  const itemsTotal = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const customer = users.find((u) => u.id === order.userId)

  return (
    <div>
      <OrderInvoice order={order} />
      <div className="print:hidden">
      <button onClick={() => navigate(basePath)} className="btn-ghost mb-3 px-2 print:hidden">
        <ArrowLeft size={15} /> Back to orders
      </button>

      <PageHeader
        title={order.uniqueOrderId}
        description={`Placed ${formatDate(order.createdAt)}`}
        actions={
          <div className="flex items-center gap-2 print:hidden">
            <OrderStatusBadge status={order.statusName} />
            <button className="btn-secondary" onClick={() => setJourneyOpen(true)}>
              <GitBranch size={15} /> Order flow
            </button>
            <Select
              value={order.orderstatusId}
              disabled={updating}
              onChange={(e) => handleStatusChange(Number(e.target.value))}
              className="w-44"
            >
              {(statuses ?? []).map((s) => {
                const legal = order.legalNextStatuses === null || order.legalNextStatuses.includes(s.name)
                return (
                  <option key={s.id} value={s.id} disabled={!legal}>
                    Mark as {s.name}
                  </option>
                )
              })}
            </Select>
            <button className="btn-secondary" onClick={() => window.print()}>
              <Printer size={15} /> Print
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          <div className="card p-4">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
              <Receipt size={16} /> Items
            </h2>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-start justify-between py-2.5 text-sm">
                  <div>
                    <p className="font-medium text-slate-700 dark:text-slate-200">
                      {item.quantity} × {item.name}
                    </p>
                    {item.addons.length > 0 && (
                      <p className="text-xs text-slate-400 dark:text-slate-500">
                        {item.addons.map((a) => `${a.addonCategoryName}: ${a.addonName}`).join(', ')}
                      </p>
                    )}
                  </div>
                  <p className="font-medium text-slate-700 dark:text-slate-200">{formatCurrency(item.price * item.quantity)}</p>
                </div>
              ))}
            </div>
            <div className="mt-3 space-y-1.5 border-t border-slate-100 pt-3 text-sm dark:border-slate-800">
              <div className="flex justify-between text-slate-500 dark:text-slate-400">
                <span>Item total</span>
                <span>{formatCurrency(itemsTotal)}</span>
              </div>
              {order.coupon && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                  <span>Coupon ({order.coupon.code})</span>
                  <span>-{formatCurrency(order.coupon.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-500 dark:text-slate-400">
                <span>Tax</span>
                <span>{formatCurrency(order.tax)}</span>
              </div>
              <div className="flex justify-between text-slate-500 dark:text-slate-400">
                <span>Restaurant charge</span>
                <span>{formatCurrency(order.restaurantCharge)}</span>
              </div>
              <div className="flex justify-between text-slate-500 dark:text-slate-400">
                <span>Delivery charge</span>
                <span>{formatCurrency(order.deliveryCharge)}</span>
              </div>
              {order.driverTipAmount > 0 && (
                <div className="flex justify-between text-slate-500 dark:text-slate-400">
                  <span>Rider tip</span>
                  <span>{formatCurrency(order.driverTipAmount)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-slate-100 pt-1.5 text-base font-semibold text-slate-800 dark:border-slate-800 dark:text-slate-100">
                <span>Total payable</span>
                <span>{formatCurrency(order.payable)}</span>
              </div>
            </div>
          </div>

          
          {order.pricingBreakdown && (
            <div className="card p-4 print:hidden">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                <Calculator size={16} /> How this was calculated
              </h2>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                <dt className="text-slate-500 dark:text-slate-400">Item total</dt>
                <dd className="text-right text-slate-700 dark:text-slate-200">{formatCurrency(order.pricingBreakdown.itemTotal)}</dd>
                <dt className="text-slate-500 dark:text-slate-400">Discount</dt>
                <dd className="text-right text-slate-700 dark:text-slate-200">-{formatCurrency(order.pricingBreakdown.discountAmount)}</dd>
                <dt className="text-slate-500 dark:text-slate-400">Amount after discount</dt>
                <dd className="text-right text-slate-700 dark:text-slate-200">{formatCurrency(order.pricingBreakdown.amountAfterDiscount)}</dd>
                <dt className="text-slate-500 dark:text-slate-400">Tax ({order.pricingBreakdown.taxPercentage}%)</dt>
                <dd className="text-right text-slate-700 dark:text-slate-200">{formatCurrency(order.pricingBreakdown.taxAmount)}</dd>
                <dt className="text-slate-500 dark:text-slate-400">Restaurant charge ({order.pricingBreakdown.restaurantChargePercentage}%)</dt>
                <dd className="text-right text-slate-700 dark:text-slate-200">{formatCurrency(order.pricingBreakdown.restaurantChargeAmount)}</dd>
                <dt className="text-slate-500 dark:text-slate-400">Delivery charge basis</dt>
                <dd className="text-right capitalize text-slate-700 dark:text-slate-200">{order.pricingBreakdown.deliveryChargeBasis.toLowerCase().replace(/_/g, ' ')}</dd>
                <dt className="text-slate-500 dark:text-slate-400">Distance (restaurant → customer)</dt>
                <dd className="text-right text-slate-700 dark:text-slate-200">{order.pricingBreakdown.distanceKm} km</dd>
                {order.pricingBreakdown.restaurantLatitude && (
                  <>
                    <dt className="text-slate-500 dark:text-slate-400">Restaurant coordinates</dt>
                    <dd className="text-right text-slate-700 dark:text-slate-200">
                      {order.pricingBreakdown.restaurantLatitude}, {order.pricingBreakdown.restaurantLongitude}
                    </dd>
                  </>
                )}
                {order.pricingBreakdown.customerLatitude && (
                  <>
                    <dt className="text-slate-500 dark:text-slate-400">Customer coordinates</dt>
                    <dd className="text-right text-slate-700 dark:text-slate-200">
                      {order.pricingBreakdown.customerLatitude}, {order.pricingBreakdown.customerLongitude}
                    </dd>
                  </>
                )}
              </dl>
            </div>
          )}

          <div className="card p-4">
            <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">Order timeline</h2>
            <ol className="space-y-3 text-sm">
              <TimelineRow label="Order placed" value={timeline?.placedAt ?? order.createdAt} />
              <TimelineRow label="Restaurant accepted" value={timeline?.restaurantAcceptedAt ?? null} />
              <TimelineRow label="Restaurant ready" value={timeline?.restaurantReadyAt ?? null} />
              <TimelineRow label="Rider assigned" value={timeline?.riderAssignedAt ?? null} />
              <TimelineRow label="Picked up" value={timeline?.pickedUpAt ?? null} />
              <TimelineRow label="Delivered" value={timeline?.deliveredAt ?? null} />
              {timeline?.cancelledAt && <TimelineRow label="Cancelled" value={timeline.cancelledAt} />}
            </ol>
          </div>

        </div>

        <div className="space-y-4">
          <div className="card p-4">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
              <UserIcon size={16} /> Customer
            </h2>
            {isAdmin ? (
              <Link to={`/admin/users/${order.userId}`} className="text-sm font-medium text-brand-600 hover:underline dark:text-brand-400">
                {order.customerName}
              </Link>
            ) : (
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{order.customerName}</p>
            )}
            {(order.customerEmail ?? customer?.email) && (
              <p className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                <MessageSquare size={12} className="shrink-0" /> {order.customerEmail ?? customer?.email}
              </p>
            )}
            {(order.customerPhone ?? customer?.phone) && (
              <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                <Phone size={12} className="shrink-0" /> {order.customerPhone ?? customer?.phone}
              </p>
            )}
            <p className="mt-2 flex items-start gap-1.5 text-sm text-slate-500 dark:text-slate-400">
              <MapPin size={14} className="mt-0.5 shrink-0" /> {order.address}
            </p>
            {order.orderComment && (
              <div className="mt-3 rounded-lg bg-amber-50 px-3 py-2 dark:bg-amber-500/10">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">Order note / cooking instructions</p>
                <p className="mt-0.5 text-sm text-amber-800 dark:text-amber-300">"{order.orderComment}"</p>
              </div>
            )}
          </div>

          <div className="card p-4">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
              <Store size={16} /> Restaurant
            </h2>
            {isAdmin ? (
              <Link to={`/admin/restaurants/${order.restaurantId}/edit`} className="text-sm font-medium text-brand-600 hover:underline dark:text-brand-400">
                {order.restaurantName}
              </Link>
            ) : (
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{order.restaurantName}</p>
            )}
            <p className="mt-1 text-xs text-slate-400 dark:text-slate-500 capitalize">{order.deliveryType} · from {order.orderFrom}</p>
          </div>

          <div className="card p-4 print:hidden">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
              <Tag size={16} /> Coupon
            </h2>
            {order.coupon ? (
              <>
                {order.coupon.name && <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{order.coupon.name}</p>}
                {isAdmin && order.coupon.couponId ? (
                  <Link
                    to={`/admin/coupons/${order.coupon.couponId}/edit`}
                    className="mt-1 inline-block font-mono text-xs text-brand-600 hover:underline dark:text-brand-400"
                  >
                    {order.coupon.code}
                  </Link>
                ) : (
                  <p className="mt-1 font-mono text-xs text-emerald-600 dark:text-emerald-400">{order.coupon.code}</p>
                )}
                <p className="mt-1.5 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                  -{formatCurrency(order.coupon.discountAmount)}
                </p>
              </>
            ) : (
              <p className="text-sm text-slate-400 dark:text-slate-500">No coupon applied</p>
            )}
          </div>
          
          <div className="card p-4">
            <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">Payment</h2>
            <p className="text-sm capitalize text-slate-700 dark:text-slate-200">{order.paymentMode}</p>
            {order.transactionId && <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">Txn: {order.transactionId}</p>}
          </div>

          <div className="card p-4 print:hidden">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
              <History size={16} /> Order journey
            </h2>
            {journey && journey.length > 0 ? (
              <ol className="space-y-3 text-sm">
                {journey.map((entry) => (
                  <li key={entry.id} className="border-b border-slate-50 pb-2 last:border-0 last:pb-0 dark:border-slate-800/60">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-slate-700 dark:text-slate-200">
                        {entry.fromStatus ? `${entry.fromStatus} → ${entry.toStatus}` : entry.toStatus}
                      </span>
                      <span className="text-xs text-slate-400 dark:text-slate-500">{formatDate(entry.createdAt)}</span>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
                      {entry.actorName ?? entry.actorType} ({entry.actorType.toLowerCase()}){entry.note ? ` — ${entry.note}` : ''}
                    </p>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-slate-400 dark:text-slate-500">No history recorded yet.</p>
            )}
          </div>

          {order.deliveryGuyName ? (
            <div className="card p-4">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                <Bike size={16} /> Delivery partner
              </h2>
              {isAdmin && order.deliveryGuyId ? (
                <Link to={`/admin/delivery-guys/${order.deliveryGuyId}`} className="text-sm font-medium text-brand-600 hover:underline dark:text-brand-400">
                  {order.deliveryGuyName}
                </Link>
              ) : (
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{order.deliveryGuyName}</p>
              )}
              <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">Delivery PIN: {order.deliveryPin}</p>
            </div>
          ) : (
            isAdmin && (
              <div className="card p-4 print:hidden">
                <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                  <Bike size={16} /> Delivery partner
                </h2>
                <p className="mb-3 text-sm text-slate-400 dark:text-slate-500">No driver assigned yet.</p>
                <button className="btn-secondary w-full" onClick={() => setAssignModalOpen(true)}>
                  <UserPlus size={15} /> Assign driver
                </button>
              </div>
            )
          )}

        </div>
      </div>
      </div>

      <Modal
        open={assignModalOpen}
        onClose={() => {
          setAssignModalOpen(false)
          setAssignError(null)
        }}
        title="Assign a delivery driver"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setAssignModalOpen(false)} disabled={assigning}>
              Cancel
            </button>
            <button className="btn-primary" onClick={handleAssignDriver} disabled={assigning || !selectedRiderId}>
              {assigning ? 'Assigning…' : 'Assign driver'}
            </button>
          </>
        }
      >
        {assignError && <p className="mb-3 text-sm text-rose-600 dark:text-rose-400">{assignError}</p>}
        <Select value={selectedRiderId} onChange={(e) => setSelectedRiderId(e.target.value ? Number(e.target.value) : '')}>
          <option value="">Select a delivery partner…</option>
          {(riders?.data ?? []).map((r) => (
            <option key={r.id} value={r.userId}>
              {r.name} {r.vehicleNumber ? `(${r.vehicleNumber})` : ''}
            </option>
          ))}
        </Select>
      </Modal>

      <OrderJourneyOverlay open={journeyOpen} onClose={() => setJourneyOpen(false)} order={order} />
    </div>
  )
}

function TimelineRow({ label, value }: { label: string; value: string | null }) {
  return (
    <li className="flex items-center justify-between border-b border-slate-50 pb-2 last:border-0 last:pb-0 dark:border-slate-800/60">
      <span className={value ? 'text-slate-700 dark:text-slate-200' : 'text-slate-300 dark:text-slate-600'}>{label}</span>
      <span className={value ? 'text-slate-500 dark:text-slate-400' : 'text-slate-300 dark:text-slate-600'}>{value ? formatDate(value) : 'Pending'}</span>
    </li>
  )
}
