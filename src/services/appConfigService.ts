import { apiClient } from '@/lib/apiClient'
import { mockDelay } from '@/lib/mockUtils'
import { IS_MOCK } from '@/config/env'

/**
 * The admin-facing shape of the backend's AppConfig blob (GET/PUT /admin/app-config) — the same
 * config the customer app fetches (read-only, computed severity) from GET /app-config. Every field
 * the customer app actually reads lives here; this panel only surfaces a subset of them (Google
 * Maps, Razorpay, Firebase) under Settings → Customer Application — see CustomerAppConfigPanel.
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
}

/** What PUT actually accepts — every field above except the computed razorpayKeySecretSet, plus the write-only razorpayKeySecret. Leaving razorpayKeySecret blank on save preserves whatever's already stored server-side rather than erasing it. */
export type AppConfigAdminUpdate = Omit<AppConfigAdmin, 'razorpayKeySecretSet'> & { razorpayKeySecret?: string }

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
  restaurantListLayout: 'TWO_COLUMN',
  recommendedItemsLayout: 'TWO_COLUMN',
  restaurantItemsLayout: 'TWO_COLUMN',
  deliveryInstructionMode: 'QUICK_OPTIONS',
  deliveryInstructionOptions: [],
  mapProvider: 'OSM',
  orderStatusUpdateMode: 'POLL',
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
}

let mockState: AppConfigAdmin = { ...MOCK_CONFIG }

export const appConfigService = {
  async getAdmin(): Promise<AppConfigAdmin> {
    if (IS_MOCK) {
      await mockDelay()
      return { ...mockState }
    }
    const { data } = await apiClient.get<{ data: AppConfigAdmin }>('/admin/app-config')
    return data.data
  },

  async updateAdmin(payload: AppConfigAdminUpdate): Promise<AppConfigAdmin> {
    if (IS_MOCK) {
      await mockDelay()
      mockState = {
        ...mockState,
        ...payload,
        razorpayKeySecretSet: payload.razorpayKeySecret ? true : mockState.razorpayKeySecretSet,
      }
      return { ...mockState }
    }
    const { data } = await apiClient.put<{ data: AppConfigAdmin }>('/admin/app-config', payload)
    return data.data
  },
}
