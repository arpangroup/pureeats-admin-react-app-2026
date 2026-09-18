import { apiClient } from '@/lib/apiClient'
import { mockDelay } from '@/lib/mockUtils'
import { IS_MOCK } from '@/config/env'
import { deliveryGuyDetails } from '@/mocks/fixtures'

/**
 * Pushes a single simulated GPS tick for the Delivery Route Simulator admin page (see
 * DeliverySimulatorPage.tsx / useRouteSimulation.ts) to wherever a rider's "last known location"
 * actually lives, so a concurrently-open rider app / order-tracking view reflects the animation —
 * not just a local map redraw.
 *
 * Deliberately separate from deliveryGuyService.update() even though both eventually touch the same
 * lastLat/lastLng/lastSeenAt fields: this is a high-frequency, fire-and-forget location tick (one
 * call per animation-second while a route plays), not a general partial-update of a delivery
 * partner's profile, and it hits its own dedicated backend endpoint rather than the generic
 * PUT /admin/delivery-guys/{id}.
 */
export const deliveryLocationSimulateService = {
  /** `deliveryGuyId` is the DeliveryGuyDetail.id — the same id deliveryGuyService.get/update/remove use, not the userId. */
  async pushLocation(deliveryGuyId: number, lat: number, lng: number): Promise<void> {
    if (IS_MOCK) {
      // Short, fixed delay (not the configurable MOCK_DELAY_MS) — a route simulation ticks roughly
      // once a second, so this should feel near-instant rather than compounding into visible lag.
      await mockDelay(80)
      const index = deliveryGuyDetails.findIndex((d) => d.id === deliveryGuyId)
      if (index !== -1) {
        deliveryGuyDetails[index] = {
          ...deliveryGuyDetails[index],
          lastLat: lat,
          lastLng: lng,
          lastSeenAt: new Date().toISOString(),
        }
      }
      return
    }
    // Backend contract: POST /admin/delivery-guys/{id}/location, ADMIN/SUPER_ADMIN only.
    // lat/lng go over the wire as strings, matching this backend's existing convention for
    // coordinate fields elsewhere (see e.g. CartSimulatorPage's customerLat/customerLng).
    await apiClient.post(`/admin/delivery-guys/${deliveryGuyId}/location`, { lat: String(lat), lng: String(lng) })
  },
}
