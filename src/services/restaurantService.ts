import { apiClient } from '@/lib/apiClient'
import { createCrudService } from '@/lib/crudServiceFactory'
import { mockDelay, paginate } from '@/lib/mockUtils'
import { toPaginated, type PageResponse } from '@/lib/pageResponse'
import { IS_MOCK } from '@/config/env'
import { restaurants, restaurantUsers } from '@/mocks/fixtures'
import type { ListParams, Paginated } from '@/types/common'
import type { Restaurant } from '@/types/entities'

const base = createCrudService<Restaurant>(restaurants, '/admin/restaurants', ['name', 'sku', 'contactNumber'])

/**
 * The backend's pricing engine reads the flat `deliveryCharges` field (required on create —
 * `RestaurantCreateRequest.deliveryCharges` is `@NotNull`), not `baseDeliveryCharge`/
 * `extraDeliveryCharge` (see backend README's "Delivery-charge tiering" note). The form only has
 * an input for `baseDeliveryCharge` ("Delivery charge (₹)" / "Base delivery charge (₹)"), so keep
 * `deliveryCharges` in sync with it on every save — otherwise it's left unset and create fails
 * validation with "deliveryCharges: must not be null".
 */
function withFlatDeliveryCharge(payload: Partial<Restaurant>): Partial<Restaurant> {
  if (payload.baseDeliveryCharge === undefined) return payload
  return { ...payload, deliveryCharges: payload.baseDeliveryCharge }
}

export interface RestaurantImage {
  id: number
  url: string
}

export interface RestaurantAuditLogEntry {
  id: number
  fieldName: string
  oldValue: string | null
  newValue: string | null
  updatedBy: number | null
  updatedByName: string | null
  updatedAt: string
}

export const restaurantService = {
  ...base,

  async create(payload: Partial<Restaurant>): Promise<Restaurant> {
    return base.create(withFlatDeliveryCharge(payload))
  },

  async update(id: number, payload: Partial<Restaurant>): Promise<Restaurant> {
    return base.update(id, withFlatDeliveryCharge(payload))
  },

  /** Restaurant-owner scoped list — only restaurants owned by this user. */
  async listByOwner(ownerId: number, params: ListParams = {}): Promise<Paginated<Restaurant>> {
    if (IS_MOCK) {
      await mockDelay()
      const ownedIds = restaurantUsers.filter((ru) => ru.userId === ownerId).map((ru) => ru.restaurantId)
      const rows = restaurants.filter((r) => ownedIds.includes(r.id))
      return paginate(rows, params, ['name', 'sku'])
    }
    const { data } = await apiClient.get<Paginated<Restaurant>>('/restaurant-owner/restaurants', { params })
    return data
  },

  async toggleActive(id: number, isActive: boolean) {
    return base.update(id, { isActive } as Partial<Restaurant>)
  },

  async toggleAccepted(id: number, isAccepted: boolean) {
    return base.update(id, { isAccepted } as Partial<Restaurant>)
  },

  /** Main/cover image (live mode only — separate from the gallery, immediate upload once the restaurant exists). */
  async uploadImage(restaurantId: number, file: File): Promise<string> {
    const formData = new FormData()
    formData.append('file', file)
    const { data } = await apiClient.post<{ data: RestaurantImage }>(`/admin/restaurants/${restaurantId}/image`, formData)
    return data.data.url
  },

  /** Gallery images (live mode only — mock mode keeps using the plain values.images array on the form). */
  async listImages(restaurantId: number): Promise<RestaurantImage[]> {
    if (IS_MOCK) return []
    const { data } = await apiClient.get<{ data: RestaurantImage[] }>(`/admin/restaurants/${restaurantId}/images`)
    return data.data
  },

  async uploadGalleryImage(restaurantId: number, file: File): Promise<RestaurantImage> {
    const formData = new FormData()
    formData.append('file', file)
    const { data } = await apiClient.post<{ data: RestaurantImage }>(`/admin/restaurants/${restaurantId}/images`, formData)
    return data.data
  },

  async deleteGalleryImage(restaurantId: number, mediaId: number): Promise<void> {
    await apiClient.delete(`/admin/restaurants/${restaurantId}/images/${mediaId}`)
  },

  async auditLog(restaurantId: number, params: ListParams = {}): Promise<Paginated<RestaurantAuditLogEntry>> {
    const { data } = await apiClient.get<{ data: PageResponse<RestaurantAuditLogEntry> }>(`/admin/restaurants/${restaurantId}/audit-log`, {
      params: { page: (params.page ?? 1) - 1, size: params.perPage ?? 20 },
    })
    return toPaginated(data.data)
  },
}
