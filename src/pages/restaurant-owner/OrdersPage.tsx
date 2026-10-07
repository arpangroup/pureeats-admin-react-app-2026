import { StickyNote } from 'lucide-react'
import { useEffect, useState } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Badge, EmptyState, LoadingBlock } from '@/components/ui/Feedback'
import { Select } from '@/components/ui/FormControls'
import { useAsync } from '@/hooks/useAsync'
import { useAuth } from '@/hooks/useAuth'
import { restaurantService } from '@/services/restaurantService'
import { storeOwnerOrderService, type StoreOwnerOrderSummary } from '@/services/storeOwnerOrderService'
import { formatCurrency, formatDate } from '@/lib/format'

type Tab = 'new' | 'running'

export default function OwnerOrdersPage() {
  const { user } = useAuth()
  const { data: restaurantPage, isLoading: loadingRestaurants } = useAsync(() => restaurantService.listByOwner(user!.id, { perPage: 50 }), [user?.id])
  const restaurants = restaurantPage?.data ?? []
  const [restaurantId, setRestaurantId] = useState<number | null>(null)
  const [tab, setTab] = useState<Tab>('new')
  const [actingId, setActingId] = useState<number | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  useEffect(() => {
    if (!restaurantId && restaurants.length > 0) setRestaurantId(restaurants[0].id)
  }, [restaurants, restaurantId])

  const { data: newOrders, isLoading: loadingNew, reload: reloadNew } = useAsync(
    () => (restaurantId ? storeOwnerOrderService.newOrders(restaurantId) : Promise.resolve([])),
    [restaurantId],
  )
  const { data: runningOrders, isLoading: loadingRunning, reload: reloadRunning } = useAsync(
    () => (restaurantId ? storeOwnerOrderService.runningOrders(restaurantId) : Promise.resolve([])),
    [restaurantId],
  )

  async function runAction(action: Promise<void>) {
    setActionError(null)
    try {
      await action
      reloadNew()
      reloadRunning()
    } catch (err) {
      setActionError((err as { message?: string })?.message ?? 'Unable to update order')
    } finally {
      setActingId(null)
    }
  }

  function accept(order: StoreOwnerOrderSummary) {
    if (!restaurantId) return
    setActingId(order.id)
    runAction(storeOwnerOrderService.accept(restaurantId, order.id))
  }

  function markReady(order: StoreOwnerOrderSummary) {
    if (!restaurantId) return
    setActingId(order.id)
    runAction(storeOwnerOrderService.markReady(restaurantId, order.id))
  }

  function selfPickupComplete(order: StoreOwnerOrderSummary) {
    if (!restaurantId) return
    setActingId(order.id)
    runAction(storeOwnerOrderService.selfPickupComplete(restaurantId, order.id))
  }

  function cancel(order: StoreOwnerOrderSummary) {
    if (!restaurantId) return
    setActingId(order.id)
    runAction(storeOwnerOrderService.cancel(restaurantId, order.id))
  }

  if (loadingRestaurants) return <LoadingBlock />
  if (restaurants.length === 0) return <EmptyState title="No restaurant assigned" />
  if (!restaurantId) return null

  const rows = tab === 'new' ? newOrders ?? [] : runningOrders ?? []
  const isLoading = tab === 'new' ? loadingNew : loadingRunning

  return (
    <div>
      <PageHeader
        title="Orders"
        description="New orders awaiting acceptance, and orders currently in progress."
        actions={
          restaurants.length > 1 ? (
            <Select value={restaurantId} onChange={(e) => setRestaurantId(Number(e.target.value))} className="w-56">
              {restaurants.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </Select>
          ) : undefined
        }
      />

      <div className="mb-3 flex gap-2">
        <button
          className={`rounded-lg px-3.5 py-2 text-sm font-medium ${tab === 'new' ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}
          onClick={() => setTab('new')}
        >
          New {newOrders && newOrders.length > 0 ? `(${newOrders.length})` : ''}
        </button>
        <button
          className={`rounded-lg px-3.5 py-2 text-sm font-medium ${tab === 'running' ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}
          onClick={() => setTab('running')}
        >
          Running {runningOrders && runningOrders.length > 0 ? `(${runningOrders.length})` : ''}
        </button>
      </div>

      {actionError && <p className="mb-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">{actionError}</p>}

      {isLoading ? (
        <LoadingBlock />
      ) : rows.length === 0 ? (
        <EmptyState title={tab === 'new' ? 'No new orders' : 'No orders in progress'} />
      ) : (
        <div className="space-y-2.5">
          {rows.map((order) => (
            <div key={order.id} className="card flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <p className="font-medium text-slate-800 dark:text-slate-100">{order.uniqueOrderId}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  <Badge tone="slate">{order.status}</Badge>{' '}
                  {formatDate(order.createdAt)}
                  {order.deliveryGuyName && <> · Rider: {order.deliveryGuyName}</>}
                </p>
                {order.orderComment && (
                  <p className="mt-1 flex max-w-md items-start gap-1.5 rounded-md bg-amber-50 px-2 py-1 text-xs text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
                    <StickyNote size={12} className="mt-0.5 shrink-0" />
                    <span>
                      <span className="font-semibold">Note:</span> {order.orderComment}
                    </span>
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span className="font-medium text-slate-700 dark:text-slate-200">{formatCurrency(order.total)}</span>
                <div className="flex gap-1.5">
                  {tab === 'new' && (
                    <button className="btn-primary px-3 py-1.5 text-xs" disabled={actingId === order.id} onClick={() => accept(order)}>
                      {actingId === order.id ? 'Accepting…' : 'Accept'}
                    </button>
                  )}
                  {tab === 'running' && (order.status === 'Accepted' || order.status === 'Preparing') && (
                    <button className="btn-primary px-3 py-1.5 text-xs" disabled={actingId === order.id} onClick={() => markReady(order)}>
                      {actingId === order.id ? 'Updating…' : 'Mark Ready'}
                    </button>
                  )}
                  {tab === 'running' && order.status === 'Ready for Pickup' && (
                    <button className="btn-secondary px-3 py-1.5 text-xs" disabled={actingId === order.id} onClick={() => selfPickupComplete(order)}>
                      {actingId === order.id ? 'Updating…' : 'Self-Pickup Complete'}
                    </button>
                  )}
                  <button className="btn-secondary px-3 py-1.5 text-xs text-rose-600" disabled={actingId === order.id} onClick={() => cancel(order)}>
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
