import { createContext, useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { orderService } from '@/services/orderService'
import { restaurantService } from '@/services/restaurantService'
import { storeOwnerOrderService } from '@/services/storeOwnerOrderService'
import { appConfigService, type FirebaseWebConfig } from '@/services/appConfigService'
import { onForegroundMessage } from '@/lib/firebaseMessaging'
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

function hasFirebaseConfig(config: FirebaseWebConfig): boolean {
  return !!(config.apiKey && config.projectId && config.appId && config.vapidKey)
}

// eslint-disable-next-line react-refresh/only-export-components
export const NewOrderAlertContext = createContext<NewOrderAlertContextValue | undefined>(undefined)

/**
 * Surfaces a global toast + optional chime for newly-placed orders, regardless of which page is
 * currently open — mounted once above the router so it keeps running across every admin/
 * restaurant-owner route. Entirely inert (no listening, no UI) until the user opts in via
 * settings — see readNewOrderAlertSettings.
 *
 * Two mechanisms, picked by `settings.usePush` (default true): a real-time push (see
 * OrderNotificationService#notifyAdminsOfNewOrder / #notifyNewOrder on the backend — a NEW_ORDER
 * push is always sent, unconditionally, regardless of this per-browser choice; this only decides
 * whether THIS browser listens for it) or polling the backend on an interval. Push automatically
 * falls back to polling if Firebase isn't configured (or a token can't be obtained) — see the
 * `pushAvailable` effect below - so "usePush: true" is a preference, not a hard requirement.
 */
export function NewOrderAlertProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth()
  const [settings, setSettings] = useState<NewOrderAlertSettings>(() => readNewOrderAlertSettings())
  const [alerts, setAlerts] = useState<NewOrderAlertItem[]>([])
  const [pushAvailable, setPushAvailable] = useState(false)
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

  const addAlert = useCallback(
    (order: { id: number; uniqueOrderId: string; restaurantName?: string; payable: number; createdAt: string }) => {
      setAlerts((prev) => [
        { key: `${order.id}-${Date.now()}`, orderId: order.id, uniqueOrderId: order.uniqueOrderId, restaurantName: order.restaurantName, payable: order.payable, createdAt: order.createdAt },
        ...prev,
      ])
      if (settings.soundEnabled) playNewOrderChime()
    },
    [settings.soundEnabled],
  )

  // Whether push is actually usable right now — checked once per enable, independent of the
  // usePush preference itself, so switching usePush on/off doesn't need a fresh Firebase config
  // fetch each time.
  useEffect(() => {
    if (!isAuthenticated || !settings.enabled || (!isAdminLike && !isStoreOwner)) {
      setPushAvailable(false)
      return
    }
    let cancelled = false
    appConfigService.getPublicFirebaseConfig().then((config) => {
      if (!cancelled) setPushAvailable(hasFirebaseConfig(config))
    })
    return () => {
      cancelled = true
    }
  }, [isAuthenticated, settings.enabled, isAdminLike, isStoreOwner])

  const usingPush = settings.enabled && settings.usePush && pushAvailable

  // Push path: one onForegroundMessage subscription, filtered to NEW_ORDER-category messages (see
  // usePushNotifications in Topbar, which skips showing its own generic toast for the same reason
  // this one exists — this is the richer, order-specific UI for that event).
  useEffect(() => {
    if (!usingPush) return
    let cancelled = false
    let cleanup: (() => void) | null = null

    appConfigService.getPublicFirebaseConfig().then((firebaseConfig) => {
      if (cancelled) return
      cleanup = onForegroundMessage(firebaseConfig, (payload) => {
        if (payload.data?.type !== 'NEW_ORDER') return
        const data = payload.data
        const orderId = Number(data.orderId)
        if (!Number.isFinite(orderId)) return
        addAlert({
          id: orderId,
          uniqueOrderId: data.uniqueOrderId ?? '',
          restaurantName: data.restaurantName,
          payable: Number(data.payable) || 0,
          createdAt: new Date().toISOString(),
        })
      })
    })

    return () => {
      cancelled = true
      cleanup?.()
    }
  }, [usingPush, addAlert])

  // Polling path: primary mechanism when usePush is off, and the automatic fallback while push
  // availability hasn't resolved yet or Firebase isn't configured at all.
  useEffect(() => {
    // Reset the "already seen" baseline whenever polling (re)starts, so the very first poll never
    // dumps every currently-placed order as a flurry of "new" alerts.
    seenIds.current = null
  }, [settings.enabled, user?.id])

  useEffect(() => {
    if (!isAuthenticated || !user || !settings.enabled || (!isAdminLike && !isStoreOwner) || usingPush) {
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
        freshlyNew.forEach(addAlert)
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
  }, [isAuthenticated, user?.id, settings.enabled, settings.intervalSeconds, usingPush, isAdminLike, isStoreOwner, addAlert])

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
