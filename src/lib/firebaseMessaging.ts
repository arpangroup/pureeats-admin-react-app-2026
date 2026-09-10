import type { FirebaseApp } from 'firebase/app'
import type { Messaging, MessagePayload } from 'firebase/messaging'
import type { FirebaseWebConfig } from '@/services/appConfigService'

/**
 * Firebase Cloud Messaging wiring for this admin panel — lets an admin/staff/restaurant-owner
 * session receive a push notification targeted at their own user id (e.g. via
 * AdminNotificationTestController's test-push endpoint, or the customer app's PushNotificationSender
 * fan-out), the same way the customer app does. Mirrors src/lib/firebaseMessaging.ts in the customer
 * app almost exactly — kept as a separate copy since these are two independent apps/repos, not a
 * shared package.
 *
 * Entirely inert until real Firebase project config exists (see appConfigService.getPublicFirebaseConfig,
 * which reads the same admin-set values the Firebase Cloud Messaging settings panel writes). Every
 * export here is a safe no-op without that config.
 *
 * Note: this only covers *foreground* messaging (the tab is open). The background handler
 * (public/firebase-messaging-sw.js) is a plain static file outside Vite's build, so it can't read
 * this config at runtime — it needs its own values filled in by hand, same as the customer app's.
 */

let app: FirebaseApp | null = null
let messaging: Messaging | null = null
let initializedSignature: string | null = null

function isComplete(config: FirebaseWebConfig): boolean {
  return !!(config.apiKey && config.projectId && config.appId && config.vapidKey)
}

async function getMessagingInstance(config: FirebaseWebConfig): Promise<Messaging | null> {
  if (!isComplete(config)) {
    console.warn('[push] Firebase config incomplete — apiKey/projectId/appId/vapidKey must all be set', config)
    return null
  }
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    console.warn('[push] service workers unsupported in this browser/context')
    return null
  }
  const signature = `${config.apiKey}|${config.projectId}|${config.appId}`
  if (!messaging || signature !== initializedSignature) {
    const [{ initializeApp }, { getMessaging }] = await Promise.all([import('firebase/app'), import('firebase/messaging')])
    app = initializeApp(
      {
        apiKey: config.apiKey,
        authDomain: config.authDomain,
        projectId: config.projectId,
        storageBucket: config.storageBucket,
        messagingSenderId: config.messagingSenderId,
        appId: config.appId,
      },
      signature,
    )
    messaging = getMessaging(app)
    initializedSignature = signature
  }
  return messaging
}

/**
 * Registers the messaging service worker, asks for notification permission, and returns this
 * device's FCM registration token (or null if unsupported, unconfigured, or denied) — the caller is
 * responsible for sending it to `POST /api/v1/notifications/push-token` (see simpleServices'
 * notificationService.registerPushToken).
 */
export async function requestPushToken(config: FirebaseWebConfig): Promise<string | null> {
  const instance = await getMessagingInstance(config)
  if (!instance) return null
  try {
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
      console.warn(`[push] notification permission not granted (browser returned "${permission}") — reset it in the site's permission settings to be asked again`)
      return null
    }
    const { getToken } = await import('firebase/messaging')
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js')
    const token = await getToken(instance, { vapidKey: config.vapidKey, serviceWorkerRegistration: registration })
    console.info('[push] got FCM token', token)
    return token
  } catch (err) {
    console.error('[push] requestPushToken failed', err)
    return null
  }
}

/** Subscribes to messages that arrive while this admin panel tab is in the foreground. */
export function onForegroundMessage(config: FirebaseWebConfig, callback: (payload: MessagePayload) => void): () => void {
  let unsubscribe: (() => void) | null = null
  let cancelled = false

  getMessagingInstance(config).then(async (instance) => {
    if (!instance || cancelled) return
    const { onMessage } = await import('firebase/messaging')
    if (cancelled) return
    unsubscribe = onMessage(instance, callback)
  })

  return () => {
    cancelled = true
    unsubscribe?.()
  }
}
