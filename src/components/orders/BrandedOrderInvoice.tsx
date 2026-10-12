import type { ReactNode } from 'react'
import { MapPin, ReceiptText, Store } from 'lucide-react'
import type { OrderRow } from '@/services/orderService'
import { formatCurrency, formatDate } from '@/lib/format'

const NAVY = 'text-[#0b3b7a]'

function Box({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="rounded-lg border border-[#9ccfea] bg-[#e8f3fc] px-4 py-3">
      <p className={`text-sm font-bold ${NAVY}`}>{label}</p>
      <div className="mt-0.5 text-[15px] text-slate-800">{children}</div>
    </div>
  )
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={strong ? `flex justify-between bg-[#e8f3fc] px-4 py-2 text-lg font-bold ${NAVY}` : 'flex justify-between px-4 py-1 text-[15px] text-slate-800'}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  )
}

/**
 * Print-only "Branded" invoice (Settings -> General -> Invoice -> Invoice style) - the same layout as the PDF customers
 * download: header, order / customer / delivery partner boxes, restaurant and delivery address, item table, bill
 * breakdown and terms & conditions. Hidden on screen; shown when window.print() runs.
 */
export function BrandedOrderInvoice({ order, terms, platformLicence }: { order: OrderRow; terms: string[]; platformLicence: string }) {
  const itemsTotal = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const pickup = order.deliveryType === 'pickup'
  const fssai = [
    order.restaurantLicence ? `${order.restaurantName} holds FSSAI Lic. No. ${order.restaurantLicence}.` : null,
    platformLicence ? `PureEats is FSSAI certified as per Lic. No. ${platformLicence}.` : null,
  ].filter(Boolean)
  const numbered = [...terms.filter((t) => t.trim()), ...(fssai.length ? [`FSSAI Compliance: ${fssai.join(' ')}`] : [])]

  return (
    <div className="hidden space-y-3 print:block print:p-6">
      <div className="grid grid-cols-2 items-center rounded-lg border border-[#9ccfea] bg-[#e8f3fc] px-4 py-3">
        <div className="text-center">
          <p className="text-4xl font-extrabold leading-none">
            <span className={NAVY}>Pure</span>
            <span className="text-[#16a34a]">Eats</span>
          </p>
          <p className="mt-1 text-lg text-slate-800">Food Order</p>
        </div>
        <p className={`border-l border-[#0b3b7a]/40 text-center text-2xl font-bold ${NAVY}`}>Summary and Receipt</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Box label="Order ID:">{order.uniqueOrderId}</Box>
        <Box label="Order Time:">{formatDate(order.createdAt)}</Box>
        <Box label="Customer Name:">{order.customerName}</Box>
        <Box label="Delivery Partner:">{order.deliveryGuyName ?? (pickup ? 'Self pickup' : '-')}</Box>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-[#9ccfea] px-4 py-3">
          <p className={`flex items-center gap-2 text-base font-bold ${NAVY}`}>
            <Store size={18} /> RESTAURANT (Profile)
          </p>
          <p className={`mt-2 text-sm font-bold ${NAVY}`}>Name:</p>
          <p className="text-[15px] text-slate-800">{order.restaurantName}</p>
          {order.restaurantAddress && (
            <>
              <p className={`mt-1 text-sm font-bold ${NAVY}`}>Address:</p>
              <p className="text-[15px] text-slate-800">{order.restaurantAddress}</p>
            </>
          )}
        </div>
        <div className="rounded-lg border border-[#9ccfea] px-4 py-3">
          <p className={`flex items-center gap-2 text-base font-bold ${NAVY}`}>
            <MapPin size={18} className="text-rose-500" /> {pickup ? 'PICKUP' : 'DELIVERY (Address)'}
          </p>
          <p className="mt-2 text-[15px] text-slate-800">
            {!pickup && order.addressTag ? `${order.addressTag} - ` : ''}
            {order.address}
          </p>
          {!pickup && order.addressLandmark && <p className="text-sm text-slate-600">Landmark: {order.addressLandmark}</p>}
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-[#9ccfea]">
        <p className={`flex items-center gap-2 bg-[#e8f3fc] px-4 py-2 text-base font-bold ${NAVY}`}>
          <ReceiptText size={18} /> ITEM SUMMARY TABLE
        </p>
        <table className="w-full text-[15px]">
          <thead className="bg-[#e3f5e6] text-sm font-bold text-slate-800">
            <tr>
              <th className="border border-[#9ccfea] px-4 py-2 text-left">Item Name</th>
              <th className="border border-[#9ccfea] px-3 py-2 text-center">Qty</th>
              <th className="border border-[#9ccfea] px-3 py-2 text-center">Unit Price (Rs.)</th>
              <th className="border border-[#9ccfea] px-3 py-2 text-center">Total Price (Rs.)</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.id}>
                <td className="border border-[#9ccfea] px-4 py-2">
                  {item.name}
                  {item.addons.length > 0 && <span className="text-xs text-slate-500"> ({item.addons.map((a) => a.addonName).join(', ')})</span>}
                </td>
                <td className="border border-[#9ccfea] px-3 py-2 text-center">{item.quantity}</td>
                <td className="border border-[#9ccfea] px-3 py-2 text-right">{formatCurrency(item.price)}</td>
                <td className="border border-[#9ccfea] px-3 py-2 text-right">{formatCurrency(item.price * item.quantity)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="overflow-hidden rounded-lg border border-[#9ccfea] pb-2">
        <p className={`flex items-center gap-2 bg-[#e8f3fc] px-4 py-2 text-base font-bold ${NAVY}`}>
          <ReceiptText size={18} /> BILL BREAKDOWN
        </p>
        <div className="py-1">
          <Row label="Item total" value={formatCurrency(itemsTotal)} />
          {order.coupon && <Row label={`Discount (${order.coupon.code})`} value={`-${formatCurrency(order.coupon.discountAmount)}`} />}
          <Row label="Tax" value={formatCurrency(order.tax)} />
          <Row label="Restaurant charge" value={formatCurrency(order.restaurantCharge)} />
          {!pickup && <Row label="Delivery charge" value={formatCurrency(order.deliveryCharge)} />}
          {(order.platformFee ?? 0) > 0 && <Row label="Platform fee" value={formatCurrency(order.platformFee ?? 0)} />}
          {order.driverTipAmount > 0 && <Row label="Delivery partner tip" value={formatCurrency(order.driverTipAmount)} />}
        </div>
        <Row label="Grand total (incl. GST)" value={formatCurrency(order.payable)} strong />
        <p className="px-4 pt-2 text-[15px] text-slate-800">
          <span className={`font-bold ${NAVY}`}>Payment Method:</span> {order.paymentMode?.toUpperCase()}
        </p>
      </div>

      {numbered.length > 0 && (
        <div className="rounded-lg border border-[#9ccfea] px-4 py-3">
          <p className={`text-base font-bold ${NAVY}`}>Terms &amp; Conditions</p>
          <ol className={`mt-1 list-decimal space-y-0.5 pl-5 text-xs ${NAVY}`}>
            {numbered.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ol>
        </div>
      )}
    </div>
  )
}
