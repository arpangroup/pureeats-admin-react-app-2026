import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Bike, MapPin, MessageSquare, Phone, Receipt, Store, Tag, User as UserIcon } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { LoadingBlock, EmptyState } from '@/components/ui/Feedback'
import { Select } from '@/components/ui/FormControls'
import { useAsync } from '@/hooks/useAsync'
import { orderService } from '@/services/orderService'
import { users } from '@/mocks/fixtures'
import { formatCurrency, formatDate } from '@/lib/format'
import { OrderStatusBadge } from './OrderStatusBadge'

export function OrderDetailView({ basePath }: { basePath: string }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const orderId = Number(id)
  const { data: order, isLoading, reload } = useAsync(() => orderService.get(orderId), [orderId])
  const [updating, setUpdating] = useState(false)
  const { data: statuses } = useAsync(() => orderService.statuses(), [])
  const isAdmin = basePath.startsWith('/admin')

  async function handleStatusChange(statusId: number) {
    setUpdating(true)
    try {
      await orderService.updateStatus(orderId, statusId)
      reload()
    } finally {
      setUpdating(false)
    }
  }

  if (isLoading) return <LoadingBlock />
  if (!order) return <EmptyState title="Order not found" />

  const itemsTotal = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const customer = users.find((u) => u.id === order.userId)

  return (
    <div>
      <button onClick={() => navigate(basePath)} className="btn-ghost mb-3 px-2">
        <ArrowLeft size={15} /> Back to orders
      </button>

      <PageHeader
        title={order.uniqueOrderId}
        description={`Placed ${formatDate(order.createdAt)}`}
        actions={
          <div className="flex items-center gap-2">
            <OrderStatusBadge status={order.statusName} />
            <Select
              value={order.orderstatusId}
              disabled={updating}
              onChange={(e) => handleStatusChange(Number(e.target.value))}
              className="w-44"
            >
              {(statuses ?? []).map((s) => (
                <option key={s.id} value={s.id}>
                  Mark as {s.name}
                </option>
              ))}
            </Select>
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
              {order.couponName && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                  <span>Coupon ({order.couponName})</span>
                  <span>Applied</span>
                </div>
              )}
              <div className="flex justify-between border-t border-slate-100 pt-1.5 text-base font-semibold text-slate-800 dark:border-slate-800 dark:text-slate-100">
                <span>Total payable</span>
                <span>{formatCurrency(order.payable)}</span>
              </div>
            </div>
          </div>

          <div className="card p-4">
            <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">Order timeline</h2>
            <ol className="space-y-3 text-sm">
              <TimelineRow label="Order placed" value={order.createdAt} />
              <TimelineRow label="Restaurant accepted" value={order.restaurantAcceptAt} />
              <TimelineRow label="Restaurant ready" value={order.restaurantReadyAt} />
              <TimelineRow label="Rider accepted" value={order.riderAcceptAt} />
              <TimelineRow label="Rider picked up" value={order.riderPickedAt} />
              <TimelineRow label="Delivered" value={order.riderDeliverAt} />
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
            {customer?.email && (
              <p className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                <MessageSquare size={12} className="shrink-0" /> {customer.email}
              </p>
            )}
            {customer?.phone && (
              <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                <Phone size={12} className="shrink-0" /> {customer.phone}
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

          <div className="card p-4">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
              <Tag size={16} /> Coupon
            </h2>
            {isAdmin ? (
              <Link to={`/admin/coupons/1/edit`} className="text-sm font-medium text-brand-600 hover:underline dark:text-brand-400">
                {order.couponName ?? 'No coupon applied'}
              </Link>
            ) : (
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{order.couponName ?? 'No coupon applied'}</p>
            )}
            <p className="mt-1 text-xs text-slate-400 dark:text-slate-500 capitalize">{order.couponCode ?? 'No coupon code'} · from {order.orderFrom}</p>
          </div>

          {order.deliveryGuyName && (
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
          )}

          <div className="card p-4">
            <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">Payment</h2>
            <p className="text-sm capitalize text-slate-700 dark:text-slate-200">{order.paymentMode}</p>
            {order.transactionId && <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">Txn: {order.transactionId}</p>}
          </div>
        </div>
      </div>
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
