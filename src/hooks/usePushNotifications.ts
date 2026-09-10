import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { appConfigService } from '@/services/appConfigService'
import { notificationService } from '@/services/simpleServices'
import { onForegroundMessage, requestPushToken } from '@/lib/firebaseMessaging'

export interface PushToastState {
  title: string
  body: string
  image?: string
  clickAction?: string
}

/**
 * Registers this admin/staff/restaurant-owner session's FCM push token once per login (so a push
 * targeted at their user id — e.g. via AdminNotificationTestController's test-push endpoint —
 * actually reaches this browser), and surfaces any push that arrives while the tab is open as a
 * dismissible toast. Mounted once in Topbar (rendered once per authenticated layout, not per page),
 * mirroring the customer app's usePushNotifications/PushNotificationBootstrap pair.
 *
 * `onNotification` fires on every foreground push in addition to the toast — Topbar uses it to
 * reload the notification bell's list immediately rather than waiting for the next manual refresh,
 * since a push arriving doesn't otherwise invalidate that already-fetched list.
 */
export function usePushNotifications(onNotification?: () => void) {
  const { user } = useAuth()
  const [toast, setToast] = useState<PushToastState | null>(null)

  useEffect(() => {
    if (!user) return
    let cancelled = false
    let cleanup: (() => void) | null = null

    appConfigService.getPublicFirebaseConfig().then((firebaseConfig) => {
      if (cancelled) return
      requestPushToken(firebaseConfig).then((token) => {
        if (cancelled || !token) return
        notificationService
          .registerPushToken(token)
          .then(() => console.info('[push] token registered with backend'))
          .catch((err) => console.error('[push] POST /notifications/push-token failed', err))
      })
      cleanup = onForegroundMessage(firebaseConfig, (payload) => {
        const title = payload.notification?.title || String(payload.data?.title ?? 'PureEats')
        const body = payload.notification?.body || String(payload.data?.body ?? '')
        const image = payload.notification?.image || payload.data?.image
        const clickAction = payload.fcmOptions?.link || payload.data?.click_action
        setToast({ title, body, image, clickAction })
        onNotification?.()
      })
    })

    return () => {
      cancelled = true
      cleanup?.()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.email])

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 6000)
    return () => clearTimeout(timer)
  }, [toast])

  return { toast, dismiss: () => setToast(null) }
}
