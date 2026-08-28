// Thin CRUD services for the straightforward "manage a list of records"
// screens. Each one is createCrudService bound to its fixture array and
// REST path — see src/lib/crudServiceFactory.ts for the mock/live switch.
import { createCrudService } from '@/lib/crudServiceFactory'
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
