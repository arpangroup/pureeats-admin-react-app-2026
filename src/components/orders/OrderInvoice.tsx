import type { OrderRow } from '@/services/orderService'
import { formatCurrency, formatDate } from '@/lib/format'

/** Print-only tax-invoice layout — hidden on screen, shown (and everything else hidden) via CSS when window.print() runs. */
export function OrderInvoice({ order }: { order: OrderRow }) {
  const itemsTotal = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0)

  return (
    <div className="hidden print:block print:p-8">
      <div className="flex items-start justify-between border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">PureEats</h1>
          <p className="mt-0.5 text-xs text-slate-500">Order invoice</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-semibold text-slate-900">{order.uniqueOrderId}</p>
          <p className="text-xs text-slate-500">{formatDate(order.createdAt)}</p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-6 text-sm">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Billed to</p>
          <p className="mt-1 font-medium text-slate-900">{order.customerName}</p>
          {order.customerEmail && <p className="text-slate-600">{order.customerEmail}</p>}
          {order.customerPhone && <p className="text-slate-600">{order.customerPhone}</p>}
          <p className="mt-1 text-slate-600">{order.address}</p>
        </div>
        <div className="text-right">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">From</p>
          <p className="mt-1 font-medium text-slate-900">{order.restaurantName}</p>
          {order.restaurantPhone && <p className="text-slate-600">{order.restaurantPhone}</p>}
        </div>
      </div>

      <table className="mt-6 w-full text-sm">
        <thead>
          <tr className="border-b border-slate-300 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            <th className="py-2">Item</th>
            <th className="py-2 text-center">Qty</th>
            <th className="py-2 text-right">Price</th>
            <th className="py-2 text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((item) => (
            <tr key={item.id} className="border-b border-slate-100">
              <td className="py-2">
                <p className="text-slate-900">{item.name}</p>
                {item.addons.length > 0 && (
                  <p className="text-xs text-slate-500">{item.addons.map((a) => a.addonName).join(', ')}</p>
                )}
              </td>
              <td className="py-2 text-center text-slate-700">{item.quantity}</td>
              <td className="py-2 text-right text-slate-700">{formatCurrency(item.price)}</td>
              <td className="py-2 text-right text-slate-900">{formatCurrency(item.price * item.quantity)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-4 flex justify-end">
        <div className="w-64 space-y-1.5 text-sm">
          <div className="flex justify-between text-slate-600">
            <span>Item total</span>
            <span>{formatCurrency(itemsTotal)}</span>
          </div>
          {order.coupon && (
            <div className="flex justify-between text-slate-600">
              <span>Coupon ({order.coupon.code})</span>
              <span>-{formatCurrency(order.coupon.discountAmount)}</span>
            </div>
          )}
          <div className="flex justify-between text-slate-600">
            <span>Tax</span>
            <span>{formatCurrency(order.tax)}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Restaurant charge</span>
            <span>{formatCurrency(order.restaurantCharge)}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Delivery charge</span>
            <span>{formatCurrency(order.deliveryCharge)}</span>
          </div>
          {order.driverTipAmount > 0 && (
            <div className="flex justify-between text-slate-600">
              <span>Rider tip</span>
              <span>{formatCurrency(order.driverTipAmount)}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-slate-300 pt-1.5 text-base font-semibold text-slate-900">
            <span>Total</span>
            <span>{formatCurrency(order.payable)}</span>
          </div>
        </div>
      </div>

      <div className="mt-8 flex items-center justify-between border-t border-slate-200 pt-3 text-xs text-slate-500">
        <span>Payment mode: <span className="capitalize">{order.paymentMode}</span></span>
        <span>Thank you for ordering with PureEats.</span>
      </div>
    </div>
  )
}
