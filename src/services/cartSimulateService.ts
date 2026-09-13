import { apiClient } from '@/lib/apiClient'

export interface CartSimulateLine {
  itemId: number
  quantity: number
  selectedAddonIds: number[]
}

export interface CartSimulateRequest {
  restaurantId: number
  items: CartSimulateLine[]
  deliveryType: 'DELIVERY' | 'SELF_PICKUP'
  customerLat: string | null
  customerLng: string | null
  couponCode: string | null
  paymentMode: string | null
}

export interface CartSimulateResult {
  restaurant: { available: boolean; reason: string | null }
  items: { itemId: number; available: boolean; reason: string | null }[]
  coupon: { valid: boolean; reason: string | null; discountAmount: number; waivesDelivery: boolean } | null
  pricing: {
    itemTotal: number
    discountAmount: number
    tax: number
    restaurantCharge: number
    deliveryCharge: number
    deliveryChargeBasis: string
    distanceKm: number
    platformFee: number
    payable: number
  }
  anyUnavailable: boolean
}

/**
 * Backs the admin Cart Simulator — runs the *real* backend validation/pricing pipeline
 * (CartValidationService, the same one the customer app's Cart page and checkout use) against an
 * admin-picked restaurant/cart/location, instead of a client-side reimplementation of the rules
 * that could silently drift from what the backend actually does. No mock-mode branch: this only
 * makes sense against a real backend (uat/production) — see CartSimulatorPage's own empty-state
 * for mock mode.
 */
export const cartSimulateService = {
  async simulate(request: CartSimulateRequest): Promise<CartSimulateResult> {
    const { data } = await apiClient.post<{ data: CartSimulateResult }>('/admin/cart-simulate', request)
    return data.data
  },
}
