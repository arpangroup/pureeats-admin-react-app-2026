import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Bike, MapPin, Receipt, User as UserIcon } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { LoadingBlock, EmptyState } from '@/components/ui/Feedback'
import { Select } from '@/components/ui/FormControls'
import { useAsync } from '@/hooks/useAsync'
import { orderService } from '@/services/orderService'
import { formatCurrency, formatDate } from '@/lib/format'
import { OrderStatusBadge } from './OrderStatusBadge'

export function OrderDetailView({ basePath }: { basePath: string }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const orderId = Number(id)
  const { data: order, isLoading, reload } = useAsync(() => orderService.get(orderId), [orderId])
  const [updating, setUpdating] = useState(false)
  const statuses = orderService.statuses()

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
              {statuses.map((s) => (
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
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
              <Receipt size={16} /> Items
            </h2>
            <div className="divide-y divide-slate-100">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-start justify-between py-2.5 text-sm">
                  <div>
                    <p className="font-medium text-slate-700">
                      {item.quantity} × {item.name}
                    </p>
                    {item.addons.length > 0 && (
                      <p className="text-xs text-slate-400">
                        {item.addons.map((a) => `${a.addonCategoryName}: ${a.addonName}`).join(', ')}
                      </p>
                    )}
                  </div>
                  <p className="font-medium text-slate-700">{formatCurrency(item.price * item.quantity)}</p>
                </div>
              ))}
            </div>
            <div className="mt-3 space-y-1.5 border-t border-slate-100 pt-3 text-sm">
              <div className="flex justify-between text-slate-500">
                <span>Item total</span>
                <span>{formatCurrency(itemsTotal)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Tax</span>
                <span>{formatCurrency(order.tax)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Restaurant charge</span>
                <span>{formatCurrency(order.restaurantCharge)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Delivery charge</span>
                <span>{formatCurrency(order.deliveryCharge)}</span>
              </div>
              {order.driverTipAmount > 0 && (
                <div className="flex justify-between text-slate-500">
                  <span>Rider tip</span>
                  <span>{formatCurrency(order.driverTipAmount)}</span>
                </div>
              )}
              {order.couponName && (
                <div className="flex justify-between text-emerald-600">
                  <span>Coupon ({order.couponName})</span>
                  <span>Applied</span>
                </div>
              )}
              <div className="flex justify-between border-t border-slate-100 pt-1.5 text-base font-semibold text-slate-800">
                <span>Total payable</span>
                <span>{formatCurrency(order.payable)}</span>
              </div>
            </div>
          </div>

          <div className="card p-4">
            <h2 className="mb-3 text-sm font-semibold text-slate-700">Order timeline</h2>
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
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
              <UserIcon size={16} /> Customer
            </h2>
            <p className="text-sm font-medium text-slate-700">{order.customerName}</p>
            <p className="mt-2 flex items-start gap-1.5 text-sm text-slate-500">
              <MapPin size={14} className="mt-0.5 shrink-0" /> {order.address}
            </p>
            {order.orderComment && <p className="mt-2 text-sm italic text-slate-500">"{order.orderComment}"</p>}
          </div>

          <div className="card p-4">
            <h2 className="mb-3 text-sm font-semibold text-slate-700">Restaurant</h2>
            <p className="text-sm font-medium text-slate-700">{order.restaurantName}</p>
            <p className="mt-1 text-xs text-slate-400 capitalize">{order.deliveryType} · from {order.orderFrom}</p>
          </div>

          {order.deliveryGuyName && (
            <div className="card p-4">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
                <Bike size={16} /> Delivery partner
              </h2>
              <p className="text-sm font-medium text-slate-700">{order.deliveryGuyName}</p>
              <p className="mt-1 text-xs text-slate-400">Delivery PIN: {order.deliveryPin}</p>
            </div>
          )}

          <div className="card p-4">
            <h2 className="mb-3 text-sm font-semibold text-slate-700">Payment</h2>
            <p className="text-sm capitalize text-slate-700">{order.paymentMode}</p>
            {order.transactionId && <p className="mt-1 text-xs text-slate-400">Txn: {order.transactionId}</p>}
          </div>
        </div>
      </div>
    </div>
  )
}

function TimelineRow({ label, value }: { label: string; value: string | null }) {
  return (
    <li className="flex items-center justify-between border-b border-slate-50 pb-2 last:border-0 last:pb-0">
      <span className={value ? 'text-slate-700' : 'text-slate-300'}>{label}</span>
      <span className={value ? 'text-slate-500' : 'text-slate-300'}>{value ? formatDate(value) : 'Pending'}</span>
    </li>
  )
}
