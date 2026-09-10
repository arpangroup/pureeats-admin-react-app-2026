import { apiClient } from '@/lib/apiClient'
import { mockDelay } from '@/lib/mockUtils'
import { IS_MOCK, MOCK_SETTINGS_CONFIRMATION_PASSWORD } from '@/config/env'

/**
 * The admin-facing shape of the backend's AppConfig blob (GET/PUT /admin/app-config) — the same
 * config the customer app fetches (read-only, computed severity) from GET /app-config. Every field
 * the customer app actually reads lives here; three small panels each edit and save a subset of it
 * from their own natural Settings tab — see GoogleMapsConfigPanel (Google Map),
 * RazorpayConfigPanel (Payment Gateways), FirebaseConfigPanel (Push Notifications), and the shared
 * useAppConfigAdminForm hook they're all built on.
 */
export interface AppConfigAdmin {
  latestVersion: string
  minSupportedVersion: string
  message: string | null
  googleMapsApiKey: string | null
  enabledPaymentMethods: string[]
  forceLogoutOnHardUpdate: boolean
  audioSearchEnabled: boolean
  promoSliderEnabled: boolean
  topPicksEnabled: boolean
  recommendedItemsEnabled: boolean
  cuisineCategorySectionEnabled: boolean
  restaurantListLayout: string
  recommendedItemsLayout: string
  restaurantItemsLayout: string
  deliveryInstructionMode: string
  deliveryInstructionOptions: { key: string; label: string; icon: string }[]
  mapProvider: string
  orderStatusUpdateMode: string
  orderStatusPollIntervalMs: number
  locationResolutionAuthenticatedPriority: string[]
  locationResolutionGuestPriority: string[]
  locationResolutionAuthenticatedFallbackLabel: string
  locationResolutionGuestFallbackLabel: string
  razorpayKeyId: string | null
  /** Never the raw secret — just whether one is already stored, so the form can show "already set" without ever receiving the plaintext value. */
  razorpayKeySecretSet: boolean
  firebaseApiKey: string | null
  firebaseAuthDomain: string | null
  firebaseProjectId: string | null
  firebaseStorageBucket: string | null
  firebaseMessagingSenderId: string | null
  firebaseAppId: string | null
  firebaseVapidKey: string | null
  /** Whether every settings/app-config save (here and the generic schema-driven form) must be accompanied by a correct confirmationPassword or the backend rejects it — computed server-side from whether pureeats.settings.confirmation-password is set. There's no admin-panel UI to change this, only that env var; see ConfirmPasswordDialog / useSettingsConfirmation. */
  settingsConfirmationEnabled: boolean
}

/**
 * What PUT actually accepts — every field above except the computed razorpayKeySecretSet is
 * optional, plus the write-only razorpayKeySecret. The backend treats an omitted field as "leave
 * it alone" (see AppConfigService#mergeOntoExisting), so callers should only ever include the
 * field(s) that actually changed — see useAppConfigAdminForm's save(), which diffs against the
 * originally-fetched config to build exactly that. Leaving razorpayKeySecret blank on save
 * preserves whatever's already stored server-side rather than erasing it, same idea.
 */
export type AppConfigAdminUpdate = Partial<Omit<AppConfigAdmin, 'razorpayKeySecretSet' | 'settingsConfirmationEnabled'>> & { razorpayKeySecret?: string }

export interface FirebaseWebConfig {
  apiKey: string
  authDomain: string
  projectId: string
  storageBucket: string
  messagingSenderId: string
  appId: string
  vapidKey: string
}

const EMPTY_FIREBASE_CONFIG: FirebaseWebConfig = { apiKey: '', authDomain: '', projectId: '', storageBucket: '', messagingSenderId: '', appId: '', vapidKey: '' }

const MOCK_CONFIG: AppConfigAdmin = {
  latestVersion: '1.0.0',
  minSupportedVersion: '1.0.0',
  message: null,
  googleMapsApiKey: null,
  enabledPaymentMethods: [],
  forceLogoutOnHardUpdate: false,
  audioSearchEnabled: false,
  promoSliderEnabled: true,
  topPicksEnabled: true,
  recommendedItemsEnabled: true,
  cuisineCategorySectionEnabled: true,
  restaurantListLayout: 'TWO_COLUMN',
  recommendedItemsLayout: 'TWO_COLUMN',
  restaurantItemsLayout: 'TWO_COLUMN',
  deliveryInstructionMode: 'QUICK_OPTIONS',
  deliveryInstructionOptions: [],
  mapProvider: 'OSM',
  orderStatusUpdateMode: 'PUSH',
  orderStatusPollIntervalMs: 8000,
  locationResolutionAuthenticatedPriority: ['saved', 'gps', 'ip'],
  locationResolutionGuestPriority: ['gps', 'ip'],
  locationResolutionAuthenticatedFallbackLabel: 'Set your location',
  locationResolutionGuestFallbackLabel: 'Other',
  razorpayKeyId: null,
  razorpayKeySecretSet: false,
  firebaseApiKey: null,
  firebaseAuthDomain: null,
  firebaseProjectId: null,
  firebaseStorageBucket: null,
  firebaseMessagingSenderId: null,
  firebaseAppId: null,
  firebaseVapidKey: null,
  settingsConfirmationEnabled: MOCK_SETTINGS_CONFIRMATION_PASSWORD.length > 0,
}

let mockState: AppConfigAdmin = { ...MOCK_CONFIG }

/** Shared by both appConfigService.updateAdmin and settingsService.updateMany's mock branches, mirroring AppConfigService#verifyConfirmationPassword on the backend — one gate, two save surfaces, both checked against the same env-configured value (VITE_MOCK_SETTINGS_CONFIRMATION_PASSWORD in mock mode). */
export function mockVerifyConfirmationPassword(confirmPassword?: string) {
  if (!MOCK_SETTINGS_CONFIRMATION_PASSWORD) return
  if (confirmPassword !== MOCK_SETTINGS_CONFIRMATION_PASSWORD) {
    throw { message: 'Incorrect confirmation password' }
  }
}

export const appConfigService = {
  async getAdmin(): Promise<AppConfigAdmin> {
    if (IS_MOCK) {
      await mockDelay()
      return { ...mockState }
    }
    const { data } = await apiClient.get<{ data: AppConfigAdmin }>('/admin/app-config')
    return data.data
  },

  async updateAdmin(payload: AppConfigAdminUpdate, confirmPassword?: string): Promise<AppConfigAdmin> {
    if (IS_MOCK) {
      await mockDelay()
      mockVerifyConfirmationPassword(confirmPassword)
      mockState = {
        ...mockState,
        ...payload,
        razorpayKeySecretSet: payload.razorpayKeySecret ? true : mockState.razorpayKeySecretSet,
      }
      return { ...mockState }
    }
    const { data } = await apiClient.put<{ data: AppConfigAdmin }>('/admin/app-config', { config: payload, confirmationPassword: confirmPassword })
    return data.data
  },

  /**
   * Firebase web config only, off the same public GET /app-config the customer app fetches at boot
   * — deliberately not the ADMIN-only /admin/app-config above, since a restaurant-owner-role session
   * (which also renders Topbar) can't call that. Used purely so this admin panel can register its
   * own FCM push token and receive foreground pushes (see usePushNotifications) — never for editing.
   */
  async getPublicFirebaseConfig(): Promise<FirebaseWebConfig> {
    if (IS_MOCK) {
      await mockDelay()
      return { ...EMPTY_FIREBASE_CONFIG }
    }
    const { data } = await apiClient.get<{ data: { firebaseApiKey: string; firebaseAuthDomain: string; firebaseProjectId: string; firebaseStorageBucket: string; firebaseMessagingSenderId: string; firebaseAppId: string; firebaseVapidKey: string } }>('/app-config')
    return {
      apiKey: data.data.firebaseApiKey || '',
      authDomain: data.data.firebaseAuthDomain || '',
      projectId: data.data.firebaseProjectId || '',
      storageBucket: data.data.firebaseStorageBucket || '',
      messagingSenderId: data.data.firebaseMessagingSenderId || '',
      appId: data.data.firebaseAppId || '',
      vapidKey: data.data.firebaseVapidKey || '',
    }
  },
}
