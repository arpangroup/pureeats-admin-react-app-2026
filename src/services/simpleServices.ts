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
export const couponService = createCrudService<Coupon>(coupons, '/admin/coupons', ['name', 'code'])
/** Store-owner scoped — same shape, but hits /store-owner/coupons (list/update/delete are ownership-checked server-side: only the coupon's creator may edit/delete it). */
export const ownerCouponService = createCrudService<Coupon>(coupons, '/store-owner/coupons', ['name', 'code'])
export const locationService = createCrudService<Location>(locations, '/locations', ['name'])
export const popularGeoPlaceService = createCrudService<PopularGeoPlace>(popularGeoPlaces, '/popular-geo-places', ['name'])
export const restaurantCategoryService = createCrudService<RestaurantCategory>(restaurantCategories, '/admin/restaurant-categories', ['name'])
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
