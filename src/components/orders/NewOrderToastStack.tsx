import { useNavigate } from 'react-router-dom'
import { Bell, X } from 'lucide-react'
import { useNewOrderAlerts } from '@/hooks/useNewOrderAlerts'
import { formatCurrency } from '@/lib/format'

/** Renders on top of every page (mounted once, above the router) so a new-order alert is visible no matter where the admin/owner currently is. */
export function NewOrderToastStack() {
  const { alerts, dismissAlert, dismissAllAlerts, orderBasePath } = useNewOrderAlerts()
  const navigate = useNavigate()

  if (alerts.length === 0) return null

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[100] flex w-full max-w-sm flex-col gap-2 print:hidden">
      {alerts.length > 1 && (
        <button
          className="pointer-events-auto self-end rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-slate-500 shadow-lg hover:text-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
          onClick={dismissAllAlerts}
        >
          Dismiss all ({alerts.length})
        </button>
      )}
      {alerts.map((alert) => (
        <div
          key={alert.key}
          className="pointer-events-auto flex items-start gap-3 rounded-xl border border-brand-200 bg-white p-3.5 shadow-lg animate-in fade-in slide-in-from-top-2 dark:border-brand-500/30 dark:bg-slate-900"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
            <Bell size={17} />
          </span>
          <button
            className="min-w-0 flex-1 text-left"
            onClick={() => {
              dismissAlert(alert.key)
              navigate(`${orderBasePath}/${alert.orderId}`)
            }}
          >
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">New order received</p>
            <p className="truncate text-xs text-slate-500 dark:text-slate-400">
              {alert.uniqueOrderId}
              {alert.restaurantName ? ` · ${alert.restaurantName}` : ''} · {formatCurrency(alert.payable)}
            </p>
            <p className="mt-0.5 text-xs font-medium text-brand-600 dark:text-brand-400">Click to view order</p>
          </button>
          <button
            className="shrink-0 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
            onClick={() => dismissAlert(alert.key)}
            aria-label="Dismiss"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  )
}
