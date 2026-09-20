// Thin CRUD services for the straightforward "manage a list of records"
// screens. Each one is createCrudService bound to its fixture array and
// REST path — see src/lib/crudServiceFactory.ts for the mock/live switch.
import { apiClient } from '@/lib/apiClient'
import { createCrudService } from '@/lib/crudServiceFactory'
import { mockDelay, nextMockId } from '@/lib/mockUtils'
import { IS_MOCK } from '@/config/env'
import {
  itemCategories,
  addonCategories,
  addons,
  coupons,
  couponUsages,
  locations,
  popularGeoPlaces,
  restaurantCategories,
  restaurantCategorySliders,
  translations,
  pages,
  promoSliders,
  slides,
  modules,
  alerts,
  users,
  restaurants,
} from '@/mocks/fixtures'
import type {
  ItemCategory,
  AddonCategory,
  Addon,
  Coupon,
  Location,
  PopularGeoPlace,
  RestaurantCategory,
  RestaurantCategorySlider,
  Translation,
  Page,
  PromoSlider,
  Slide,
  Module,
  Alert,
} from '@/types/entities'

export const itemCategoryService = createCrudService<ItemCategory>(itemCategories, '/admin/item-categories', ['name'])
export const addonCategoryService = createCrudService<AddonCategory>(addonCategories, '/admin/addon-categories', ['name'])
export const addonService = createCrudService<Addon>(addons, '/admin/addons', ['name'])

/**
 * Store-owner-scoped item categories — separate from the admin-only itemCategoryService above,
 * since a STORE_OWNER can't reach /api/v1/admin/**. The backend (StoreOwnerMenuController) only
 * offers list/create plus an enable/disable toggle, never a generic update or delete, so this
 * intentionally has no `update`/`remove` (mirrors how restaurantService.toggleActive works —
 * a dedicated toggle method, not a PUT).
 */
export interface OwnerItemCategory { id: number; name: string; isEnabled: boolean }

export const ownerItemCategoryService = {
  async list(userId: number): Promise<OwnerItemCategory[]> {
    if (IS_MOCK) {
      await mockDelay()
      return itemCategories.filter((c) => c.userId === userId).map((c) => ({ id: c.id, name: c.name, isEnabled: c.isEnabled }))
    }
    const { data } = await apiClient.get<{ data: OwnerItemCategory[] }>('/store-owner/item-categories')
    return data.data
  },

  async create(userId: number, name: string): Promise<OwnerItemCategory> {
    if (IS_MOCK) {
      await mockDelay()
      const now = new Date().toISOString()
      const created: ItemCategory = { id: nextMockId(), name, isEnabled: true, userId, createdAt: now, updatedAt: now }
      itemCategories.unshift(created)
      return { id: created.id, name: created.name, isEnabled: created.isEnabled }
    }
    const { data } = await apiClient.post<{ data: OwnerItemCategory }>('/store-owner/item-categories', { name })
    return data.data
  },

  async setEnabled(id: number, enabled: boolean): Promise<void> {
    if (IS_MOCK) {
      await mockDelay(100)
      const i = itemCategories.findIndex((c) => c.id === id)
      if (i !== -1) itemCategories[i] = { ...itemCategories[i], isEnabled: enabled }
      return
    }
    await apiClient.patch(`/store-owner/item-categories/${id}/${enabled ? 'enable' : 'disable'}`)
  },
}

/**
 * Store-owner-scoped addon categories. Unlike item categories, the backend
 * (StoreOwnerAddonController) has no enable/disable for addon categories at all — just list and
 * create, so there is no per-row action here.
 */
export interface OwnerAddonCategory { id: number; name: string; type: 'single' | 'multiple' }

export const ownerAddonCategoryService = {
  async list(userId: number): Promise<OwnerAddonCategory[]> {
    if (IS_MOCK) {
      await mockDelay()
      return addonCategories.filter((c) => c.userId === userId).map((c) => ({ id: c.id, name: c.name, type: c.type }))
    }
    const { data } = await apiClient.get<{ data: OwnerAddonCategory[] }>('/store-owner/addon-categories')
    return data.data
  },

  async create(userId: number, name: string, type: 'single' | 'multiple'): Promise<OwnerAddonCategory> {
    if (IS_MOCK) {
      await mockDelay()
      const now = new Date().toISOString()
      const created: AddonCategory = { id: nextMockId(), name, type, userId, createdAt: now, updatedAt: now }
      addonCategories.unshift(created)
      return { id: created.id, name: created.name, type: created.type }
    }
    const { data } = await apiClient.post<{ data: OwnerAddonCategory }>('/store-owner/addon-categories', { name, type })
    return data.data
  },
}

/**
 * Store-owner-scoped addons. The backend has no flat "all my addons" list — addons are only
 * listable per addon-category (`GET /store-owner/addon-categories/{id}/addons`), and only
 * create + enable/disable exist, never a generic update or delete.
 */
export interface OwnerAddon { id: number; addonCategoryId: number; name: string; price: number; isActive: boolean }

export const ownerAddonService = {
  async listForCategory(addonCategoryId: number): Promise<OwnerAddon[]> {
    if (IS_MOCK) {
      await mockDelay()
      return addons.filter((a) => a.addonCategoryId === addonCategoryId).map((a) => ({ id: a.id, addonCategoryId: a.addonCategoryId, name: a.name, price: a.price, isActive: a.isActive }))
    }
    const { data } = await apiClient.get<{ data: OwnerAddon[] }>(`/store-owner/addon-categories/${addonCategoryId}/addons`)
    return data.data
  },

  async create(userId: number, payload: { addonCategoryId: number; name: string; price: number }): Promise<OwnerAddon> {
    if (IS_MOCK) {
      await mockDelay()
      const now = new Date().toISOString()
      const created: Addon = { id: nextMockId(), name: payload.name, price: payload.price, addonCategoryId: payload.addonCategoryId, userId, isActive: true, createdAt: now, updatedAt: now }
      addons.unshift(created)
      return { id: created.id, addonCategoryId: created.addonCategoryId, name: created.name, price: created.price, isActive: created.isActive }
    }
    const { data } = await apiClient.post<{ data: OwnerAddon }>('/store-owner/addons', payload)
    return data.data
  },

  async setEnabled(id: number, enabled: boolean): Promise<void> {
    if (IS_MOCK) {
      await mockDelay(100)
      const i = addons.findIndex((a) => a.id === id)
      if (i !== -1) addons[i] = { ...addons[i], isActive: enabled }
      return
    }
    await apiClient.patch(`/store-owner/addons/${id}/${enabled ? 'enable' : 'disable'}`)
  },
}
export const couponService = createCrudService<Coupon>(coupons, '/admin/coupons', ['name', 'code'])
/** Store-owner scoped — same shape, but hits /store-owner/coupons (list/update/delete are ownership-checked server-side: only the coupon's creator may edit/delete it). */
export const ownerCouponService = createCrudService<Coupon>(coupons, '/store-owner/coupons', ['name', 'code'])
export const locationService = createCrudService<Location>(locations, '/admin/locations', ['name'])
export const popularGeoPlaceService = createCrudService<PopularGeoPlace>(popularGeoPlaces, '/popular-geo-places', ['name'])
export const restaurantCategoryService = createCrudService<RestaurantCategory>(restaurantCategories, '/admin/restaurant-categories', ['name'])

/** Minimal option shape for dropdowns/pickers — id+name is all a restaurant-edit form needs. */
export interface SelectOption {
  id: number
  name: string
}

/**
 * Every active serviceable location, for the restaurant form's "Serviceable location" picker.
 * Hits the public (no-auth) `/locations` list — unlike {@link locationService}, this needs to
 * work from the restaurant-owner's own edit form too, not just the admin-only Locations page.
 */
export async function listActiveLocations(): Promise<SelectOption[]> {
  if (IS_MOCK) {
    await mockDelay(100)
    return locations.filter((l) => l.isActive).map((l) => ({ id: l.id, name: l.name }))
  }
  const { data } = await apiClient.get<{ data: SelectOption[] }>('/locations')
  return data.data
}

/** Every active cuisine category, for the restaurant form's "Cuisine categories" picker — public (no-auth) `/restaurant-categories` list. */
export async function listActiveRestaurantCategories(): Promise<SelectOption[]> {
  if (IS_MOCK) {
    await mockDelay(100)
    return restaurantCategories.filter((c) => c.isActive).map((c) => ({ id: c.id, name: c.name }))
  }
  const { data } = await apiClient.get<{ data: SelectOption[] }>('/restaurant-categories')
  return data.data
}

/** Every active, accepted restaurant, for pickers like the Promo Slider's "Links to a restaurant" — public (no-auth) `/restaurants` list, same one the customer app's Home page uses. */
export async function listActiveRestaurants(): Promise<SelectOption[]> {
  if (IS_MOCK) {
    await mockDelay(100)
    return restaurants.filter((r) => r.isActive && r.isAccepted).map((r) => ({ id: r.id, name: r.name }))
  }
  const { data } = await apiClient.get<{ data: { id: number; name: string }[] }>('/restaurants')
  return data.data.map((r) => ({ id: r.id, name: r.name }))
}
export const restaurantCategorySliderService = createCrudService<RestaurantCategorySlider>(restaurantCategorySliders, '/admin/restaurant-category-sliders', ['name'])
export const translationService = createCrudService<Translation>(translations, '/translations', ['languageName'])
export const pageService = createCrudService<Page>(pages, '/pages', ['name', 'slug'])
export const promoSliderService = createCrudService<PromoSlider>(promoSliders, '/admin/promo-sliders', ['name'])
const slideBase = createCrudService<Slide>(slides, '/admin/slides', ['name'])

export const slideService = {
  ...slideBase,

  async forSlider(sliderType: Slide['sliderType'], sliderId: number): Promise<Slide[]> {
    if (IS_MOCK) {
      await mockDelay(150)
      return slides
        .filter((s) => s.sliderType === sliderType && s.sliderId === sliderId)
        .sort((a, b) => a.positionId - b.positionId)
    }
    const { data } = await apiClient.get<{ data: Slide[] }>('/admin/slides', { params: { sliderType, sliderId } })
    return data.data
  },

  async countsBySlider(sliderType: Slide['sliderType']): Promise<Record<number, number>> {
    if (IS_MOCK) {
      await mockDelay(50)
      const counts: Record<number, number> = {}
      slides.filter((s) => s.sliderType === sliderType).forEach((s) => {
        counts[s.sliderId] = (counts[s.sliderId] ?? 0) + 1
      })
      return counts
    }
    const { data } = await apiClient.get<{ data: Record<number, number> }>('/admin/slides/counts', { params: { sliderType } })
    return data.data
  },

  /** Live mode only — slide's image field is set immediately on upload, returning the resolved URL. */
  async uploadImage(id: number, file: File): Promise<string> {
    const formData = new FormData()
    formData.append('file', file)
    const { data } = await apiClient.post<{ data: { url: string } }>(`/admin/slides/${id}/image`, formData)
    return data.data.url
  },
}
export const moduleService = createCrudService<Module>(modules, '/modules', ['name'])

/** The signed-in user's own alerts (last 7 days, max 20) — not a generic paginated admin resource. */
export const notificationService = {
  async list(): Promise<Alert[]> {
    if (IS_MOCK) {
      await mockDelay()
      return [...alerts].sort((a, b) => b.id - a.id)
    }
    const { data } = await apiClient.get<{ data: Alert[] }>('/notifications')
    return data.data
  },

  async markRead(id: number): Promise<void> {
    if (IS_MOCK) {
      await mockDelay(150)
      const index = alerts.findIndex((a) => a.id === id)
      if (index !== -1) alerts[index] = { ...alerts[index], isRead: true }
      return
    }
    await apiClient.patch(`/notifications/${id}/read`)
  },

  async markAllRead(): Promise<void> {
    if (IS_MOCK) {
      await mockDelay(150)
      alerts.forEach((a, i) => { alerts[i] = { ...a, isRead: true } })
      return
    }
    await apiClient.patch('/notifications/read-all')
  },

  async remove(id: number): Promise<void> {
    if (IS_MOCK) {
      await mockDelay(150)
      const index = alerts.findIndex((a) => a.id === id)
      if (index !== -1) alerts.splice(index, 1)
      return
    }
    await apiClient.delete(`/notifications/${id}`)
  },

  /** Registers/refreshes this device's FCM token so a push targeted at this admin's user id (e.g. via AdminNotificationTestController) reaches this browser tab — no-op in mock mode, same as the customer app's equivalent. `audience: 'STAFF'` auto-subscribes it to the standing "all_staff" broadcast topic (see PushAudience on the backend). */
  async registerPushToken(token: string): Promise<void> {
    if (IS_MOCK) return
    await apiClient.post('/notifications/push-token', { token, audience: 'STAFF' })
  },
}

export interface CouponUsageRow {
  id: number
  userName: string
  restaurantName: string
  couponUsed: number
  createdAt: string
}

export const couponUsageService = {
  async forCoupon(couponId: number): Promise<CouponUsageRow[]> {
    if (IS_MOCK) {
      await mockDelay(150)
      return couponUsages
        .filter((u) => u.couponId === couponId)
        .map((u) => ({
          id: u.id,
          userName: users.find((usr) => usr.id === u.userId)?.name ?? 'Unknown',
          restaurantName: restaurants.find((r) => r.id === u.restaurantId)?.name ?? 'Unknown',
          couponUsed: u.couponUsed,
          createdAt: u.createdAt,
        }))
        .sort((a, b) => b.id - a.id)
    }
    const { data } = await apiClient.get<{ data: CouponUsageRow[] }>(`/admin/coupons/${couponId}/usages`)
    return data.data
  },
}

export interface PushNotificationPayload {
  title: string
  message: string
  image: string | null
  url: string | null
  target: 'all' | 'selected'
  userIds: number[]
}

export const pushNotificationService = {
  /** Mock-only composer: this fans the notification out as Alert rows for the
   * targeted users — there's no real push delivery (APNs/FCM) in a standalone
   * mock app, so this simulates what those recipients would see in-app. */
  async send(payload: PushNotificationPayload): Promise<{ recipientCount: number }> {
    if (IS_MOCK) {
      await mockDelay(400)
      const recipientIds = payload.target === 'all' ? users.map((u) => u.id) : payload.userIds
      const now = new Date().toISOString()
      recipientIds.forEach((userId) => {
        const alert: Alert = {
          id: nextMockId(),
          userId,
          data: {
            title: payload.title,
            body: payload.message,
            type: 'push',
            image: payload.image,
            url: payload.url,
          },
          isRead: false,
          createdAt: now,
          updatedAt: now,
        }
        alerts.unshift(alert)
      })
      return { recipientCount: recipientIds.length }
    }
    const { data } = await apiClient.post<{ recipientCount: number }>('/notifications/send', payload)
    return data
  },
}
