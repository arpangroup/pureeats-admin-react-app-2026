import { createContext, useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { orderService } from '@/services/orderService'
import { restaurantService } from '@/services/restaurantService'
import { storeOwnerOrderService } from '@/services/storeOwnerOrderService'
import { playNewOrderChime } from '@/lib/notificationSound'
import {
  readNewOrderAlertSettings,
  writeNewOrderAlertSettings,
  type NewOrderAlertSettings,
} from '@/lib/newOrderAlertSettings'

export interface NewOrderAlertItem {
  key: string
  orderId: number
  uniqueOrderId: string
  restaurantName?: string
  payable: number
  createdAt: string
}

interface NewOrderAlertContextValue {
  settings: NewOrderAlertSettings
  updateSettings: (patch: Partial<NewOrderAlertSettings>) => void
  alerts: NewOrderAlertItem[]
  dismissAlert: (key: string) => void
  dismissAllAlerts: () => void
  orderBasePath: string
}

/** How often the chime repeats while unacknowledged alerts are still on screen. */
const REPEAT_CHIME_INTERVAL_SECONDS = 8

// eslint-disable-next-line react-refresh/only-export-components
export const NewOrderAlertContext = createContext<NewOrderAlertContextValue | undefined>(undefined)

/**
 * Polls for newly placed orders on an interval and surfaces a global toast + optional chime,
 * regardless of which page is currently open — mounted once above the router so it keeps running
 * across every admin/restaurant-owner route. Entirely inert (no polling, no UI) until the user
 * opts in via settings — see readNewOrderAlertSettings.
 */
export function NewOrderAlertProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth()
  const [settings, setSettings] = useState<NewOrderAlertSettings>(() => readNewOrderAlertSettings())
  const [alerts, setAlerts] = useState<NewOrderAlertItem[]>([])
  const seenIds = useRef<Set<number> | null>(null)

  const isAdminLike = user?.role === 'admin' || user?.role === 'employee'
  const isStoreOwner = user?.role === 'restaurant-owner'
  const orderBasePath = isStoreOwner ? '/restaurant-owner/orders' : '/admin/orders'

  const updateSettings = useCallback((patch: Partial<NewOrderAlertSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch }
      writeNewOrderAlertSettings(next)
      return next
    })
  }, [])

  const dismissAlert = useCallback((key: string) => {
    setAlerts((prev) => prev.filter((a) => a.key !== key))
  }, [])

  const dismissAllAlerts = useCallback(() => {
    setAlerts([])
  }, [])

  useEffect(() => {
    // Reset the "already seen" baseline whenever polling (re)starts, so the very first poll never
    // dumps every currently-placed order as a flurry of "new" alerts.
    seenIds.current = null
  }, [settings.enabled, user?.id])

  useEffect(() => {
    if (!isAuthenticated || !user || !settings.enabled || (!isAdminLike && !isStoreOwner)) {
      return
    }

    let cancelled = false

    async function poll() {
      try {
        interface FetchedOrder {
          id: number
          uniqueOrderId: string
          restaurantName?: string
          payable: number
          createdAt: string
        }
        let fetched: FetchedOrder[] = []

        if (isAdminLike) {
          const statuses = await orderService.statuses()
          // Status id 1 is always PLACED (mock fixture and live API agree on the id even though
          // the display name differs — "Placed" vs the raw enum "PLACED" — so match on id, not name.
          const placed = statuses.find((s) => s.id === 1)
          if (!placed) return
          const page = await orderService.list({ statusId: placed.id, page: 1, perPage: 10 })
          fetched = page.data.map((o) => ({ id: o.id, uniqueOrderId: o.uniqueOrderId, restaurantName: o.restaurantName, payable: o.payable, createdAt: o.createdAt }))
        } else if (isStoreOwner) {
          const restaurantsPage = await restaurantService.listByOwner(user.id, { perPage: 50 })
          const results = await Promise.all(
            restaurantsPage.data.map((r) => storeOwnerOrderService.newOrders(r.id).then((rows) => rows.map((row) => ({ ...row, restaurantName: r.name })))),
          )
          fetched = results.flat().map((o) => ({ id: o.id, uniqueOrderId: o.uniqueOrderId, restaurantName: o.restaurantName, payable: o.payable, createdAt: o.createdAt }))
        }

        if (cancelled) return

        if (seenIds.current === null) {
          // First poll after enabling — record the baseline silently, don't alert on the backlog.
          seenIds.current = new Set(fetched.map((o) => o.id))
          return
        }

        const freshlyNew = fetched.filter((o) => !seenIds.current!.has(o.id))
        freshlyNew.forEach((o) => seenIds.current!.add(o.id))

        if (freshlyNew.length > 0) {
          setAlerts((prev) => [
            ...freshlyNew.map((o) => ({
              key: `${o.id}-${Date.now()}`,
              orderId: o.id,
              uniqueOrderId: o.uniqueOrderId,
              restaurantName: o.restaurantName,
              payable: o.payable,
              createdAt: o.createdAt,
            })),
            ...prev,
          ])
          if (settings.soundEnabled) {
            playNewOrderChime()
          }
        }
      } catch {
        // A transient poll failure (network blip, token refresh in flight) just gets retried next tick.
      }
    }

    poll()
    const intervalId = window.setInterval(poll, Math.max(15, settings.intervalSeconds) * 1000)
    return () => {
      cancelled = true
      window.clearInterval(intervalId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user?.id, settings.enabled, settings.intervalSeconds, settings.soundEnabled, isAdminLike, isStoreOwner])

  useEffect(() => {
    // Keep ringing every few seconds while unacknowledged alerts are on screen, not just once when
    // they first appear — stops as soon as the alert list empties (dismissed individually or all at once).
    if (alerts.length === 0 || !settings.soundEnabled) return
    const intervalId = window.setInterval(() => playNewOrderChime(), REPEAT_CHIME_INTERVAL_SECONDS * 1000)
    return () => window.clearInterval(intervalId)
  }, [alerts.length, settings.soundEnabled])

  return (
    <NewOrderAlertContext.Provider value={{ settings, updateSettings, alerts, dismissAlert, dismissAllAlerts, orderBasePath }}>
      {children}
    </NewOrderAlertContext.Provider>
  )
}
