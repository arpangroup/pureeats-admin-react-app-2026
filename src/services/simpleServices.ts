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

export const itemCategoryService = createCrudService<ItemCategory>(itemCategories, '/item-categories', ['name'])
export const addonCategoryService = createCrudService<AddonCategory>(addonCategories, '/addon-categories', ['name'])
export const addonService = createCrudService<Addon>(addons, '/addons', ['name'])
export const couponService = createCrudService<Coupon>(coupons, '/coupons', ['name', 'code'])
export const locationService = createCrudService<Location>(locations, '/locations', ['name'])
export const popularGeoPlaceService = createCrudService<PopularGeoPlace>(popularGeoPlaces, '/popular-geo-places', ['name'])
export const restaurantCategoryService = createCrudService<RestaurantCategory>(restaurantCategories, '/restaurant-categories', ['name'])
export const restaurantCategorySliderService = createCrudService<RestaurantCategorySlider>(restaurantCategorySliders, '/restaurant-category-sliders', ['name'])
export const translationService = createCrudService<Translation>(translations, '/translations', ['languageName'])
export const pageService = createCrudService<Page>(pages, '/pages', ['name', 'slug'])
export const promoSliderService = createCrudService<PromoSlider>(promoSliders, '/promo-sliders', ['name'])
export const slideService = createCrudService<Slide>(slides, '/slides', ['name'])
export const moduleService = createCrudService<Module>(modules, '/modules', ['name'])
export const notificationService = createCrudService<Alert>(alerts, '/alerts', [])

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
