// TypeScript mirror of the Laravel table structure documented in the
// project instructions. Field names are kept camelCase to match those
// tables 1:1, so the day the Spring Boot API is wired up, response DTOs
// should be able to map onto these interfaces with no field renaming.

import type { Id } from './common'

export type PaymentMode = 'cod' | 'online' | 'wallet'
export type DeliveryType = 'delivery' | 'pickup'
export type DiscountType = 'flat' | 'percentage'
export type OrderFrom = 'app' | 'web' | 'pos'

export interface User {
  id: Id
  name: string
  email: string
  phone: string
  photo: string | null
  isActive: boolean
  role: 'admin' | 'employee' | 'restaurant-owner' | 'delivery-guy' | 'customer'
  deliveryPin?: string | null
  defaultAddressId?: Id | null
  deliveryGuyDetailId?: Id | null
  createdBy?: Id | null
  updatedBy?: Id | null
  createdAt: string
  updatedAt: string
}

export interface Address {
  id: Id
  userId: Id
  address: string
  house: string
  landmark: string
  tag: string
  latitude: number
  longitude: number
  createdAt: string
  updatedAt: string
}

export interface Location {
  id: Id
  name: string
  description: string
  isPopular: boolean
  isActive: boolean
}

export interface PopularGeoPlace {
  id: Id
  name: string
  latitude: number
  longitude: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface RestaurantCategory {
  id: Id
  name: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface RestaurantCategorySlider {
  id: Id
  name: string
  image: string
  imagePlaceholder: string
  categoriesIds: Id[]
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Restaurant {
  id: Id
  name: string
  slug: string
  description: string
  contactNumber: string
  openingTime: string
  closingTime: string
  locationId: Id
  image: string
  placeholderImage: string
  images: string[]
  rating: number
  deliveryTime: number
  priceRange: 1 | 2 | 3
  isPureveg: boolean
  address: string
  pincode: string
  landmark: string
  sku: string
  latitude: number
  longitude: number
  certificate: string | null
  restaurantCharges: number
  deliveryCharges: number
  isActive: boolean
  isAccepted: boolean
  isFeatured: boolean
  commissionRate: number
  deliveryType: 'self-pickup' | 'delivery' | 'both'
  deliveryRadius: number
  deliveryChargeType: 'fixed' | 'dynamic'
  baseDeliveryCharge: number
  baseDeliveryDistance: number
  extraDeliveryCharge: number
  extraDeliveryDistance: number
  minOrderPrice: number
  isNotifiable: boolean
  autoAcceptable: boolean
  isSchedulable: boolean
  isAcceptCod: boolean
  categoryIds: Id[]
  createdBy: Id | null
  updatedBy: Id | null
  createdAt: string
  updatedAt: string
}

export interface RestaurantUser {
  id: Id
  userId: Id
  restaurantId: Id
  createdAt: string
  updatedAt: string
}

export interface ItemCategory {
  id: Id
  name: string
  isEnabled: boolean
  userId: Id
  createdAt: string
  updatedAt: string
}

export interface Item {
  id: Id
  restaurantId: Id
  itemCategoryId: Id
  name: string
  desc: string
  price: number
  oldPrice: number | null
  image: string
  placeholderImage: string
  isRecommended: boolean
  isPopular: boolean
  isNew: boolean
  isActive: boolean
  isVeg: boolean
  addonCategoryIds: Id[]
  createdAt: string
  updatedAt: string
}

export interface AddonCategory {
  id: Id
  name: string
  type: 'single' | 'multiple'
  userId: Id
  createdAt: string
  updatedAt: string
}

export interface AddonCategoryItem {
  id: Id
  addonCategoryId: Id
  itemId: Id
  createdAt: string
  updatedAt: string
}

export interface Addon {
  id: Id
  name: string
  price: number
  addonCategoryId: Id
  userId: Id
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Coupon {
  id: Id
  name: string
  description: string
  code: string
  discountType: DiscountType
  discount: number
  expiryDate: string
  isActive: boolean
  restaurantId: Id | null
  minOrderAmount: number
  uptoAmount: number
  totalCoupon: number
  count: number
  maxCount: number
  createdAt: string
  updatedAt: string
}

export interface CouponUsage {
  id: Id
  couponId: Id
  userId: Id
  restaurantId: Id
  couponUsed: number
  createdAt: string
  updatedAt: string
}

export interface OrderStatus {
  id: Id
  name:
    | 'Placed'
    | 'Accepted'
    | 'Preparing'
    | 'Ready for Pickup'
    | 'Picked Up'
    | 'On the way'
    | 'Delivered'
    | 'Cancelled'
    | 'Rejected'
}

export interface OrderItemAddon {
  id: Id
  orderitemId: Id
  addonCategoryName: string
  addonName: string
  addonPrice: number
  createdAt: string
  updatedAt: string
}

export interface OrderItem {
  id: Id
  orderId: Id
  itemId: Id
  name: string
  quantity: number
  price: number
  addons: OrderItemAddon[]
  createdAt: string
  updatedAt: string
}

export interface Order {
  id: Id
  uniqueOrderId: string
  orderstatusId: Id
  userId: Id
  restaurantId: Id
  couponName: string | null
  location: string
  address: string
  tax: number
  restaurantCharge: number
  deliveryCharge: number
  driverTipAmount: number
  total: number
  payable: number
  paymentMode: PaymentMode
  orderComment: string | null
  transactionId: string | null
  deliveryType: DeliveryType
  deliveryPin: string
  prepareTime: number
  orderFrom: OrderFrom
  restaurantAcceptAt: string | null
  restaurantReadyAt: string | null
  riderAcceptAt: string | null
  riderPickedAt: string | null
  riderDeliverAt: string | null
  deliveryGuyId: Id | null
  items: OrderItem[]
  createdAt: string
  updatedAt: string
}

export interface AcceptDelivery {
  id: Id
  orderId: Id
  userId: Id
  customerId: Id
  isComplete: boolean
  createdAt: string
  updatedAt: string
}

export interface GpsPoint {
  id: Id
  orderId: Id
  userLat: number
  userLong: number
  deliveryLat: number
  deliveryLong: number
  heading: number
  bearing: number
  createdAt: string
  updatedAt: string
}

export interface DeliveryGuyDetail {
  id: Id
  userId: Id
  name: string
  age: number
  gender: 'male' | 'female' | 'other'
  photo: string | null
  description: string
  vehicleNumber: string
  commissionRate: number
  isNotifiable: boolean
  maxAcceptDeliveryLimit: number
  rating: number
  isActive: boolean
  isOnline: boolean
  lastLat: number | null
  lastLng: number | null
  lastSeenAt: string | null
  createdBy: Id | null
  updatedBy: Id | null
  createdAt: string
  updatedAt: string
}

export interface DeliveryCollection {
  id: Id
  userId: Id
  amount: number
  createdAt: string
  updatedAt: string
}

export interface DeliveryCollectionLog {
  id: Id
  deliveryCollectionId: Id
  amount: number
  type: 'credit' | 'debit'
  message: string
  createdAt: string
  updatedAt: string
}

export interface RestaurantEarning {
  id: Id
  restaurantId: Id
  userId: Id
  amount: number
  isRequested: boolean
  isProcessed: boolean
  restaurantPayoutId: Id | null
  createdAt: string
  updatedAt: string
}

export interface RestaurantPayout {
  id: Id
  restaurantId: Id
  restaurantEarningId: Id
  amount: number
  status: 'pending' | 'processing' | 'paid' | 'rejected'
  transactionMode: string
  transactionId: string | null
  message: string | null
  createdAt: string
  updatedAt: string
}

export interface Wallet {
  id: Id
  holderType: string
  holderId: Id
  name: string
  slug: string
  description: string
  balance: number
  decimalPlaces: number
  createdAt: string
  updatedAt: string
}

export interface Transaction {
  id: Id
  payableType: string
  payableId: Id
  walletId: Id
  type: 'credit' | 'debit'
  amount: number
  confirmed: boolean
  meta: Record<string, unknown> | null
  uuid: string
  createdAt: string
  updatedAt: string
}

export interface Support {
  id: Id
  userId: Id
  orderId: Id | null
  restaurantId: Id | null
  issue: string
  message: string
  media: string | null
  resolved: boolean
  resolvedBy: Id | null
  createdAt: string
  updatedAt: string
}

export interface Rating {
  id: Id
  rating: number
  orderId: Id
  name: string
  tags: string[]
  comment: string
  rateableType: 'restaurant' | 'delivery-guy' | 'item'
  rateableId: Id
  userId: Id
  createdAt: string
  updatedAt: string
}

export interface Alert {
  id: Id
  userId: Id
  data: {
    title: string
    body: string
    type: string
    image?: string | null
    url?: string | null
  }
  isRead: boolean
  createdAt: string
  updatedAt: string
}

export interface PushToken {
  id: Id
  token: string
  status: string
  isSent: boolean
  isActive: boolean
  userId: Id
  createdAt: string
  updatedAt: string
}

export interface Page {
  id: Id
  name: string
  slug: string
  body: string
  createdAt: string
  updatedAt: string
}

export interface Translation {
  id: Id
  languageName: string
  languageCode: string
  data: Record<string, string>
  isDefault: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface PromoSlider {
  id: Id
  name: string
  isActive: boolean
  locationId: Id | null
  positionId: number
  size: 'small' | 'medium' | 'large'
  createdAt: string
  updatedAt: string
}

export interface Slide {
  id: Id
  promoSliderId: Id
  uniqueId: string
  name: string
  description: string
  image: string
  imagePlaceholder: string
  url: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface PaymentGateway {
  id: Id
  name: string
  description: string
  logo: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface SmsGateway {
  id: Id
  gatewayName: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Module {
  id: Id
  name: string
  shortName: string
  code: string
  description: string
  version: string
  isActive: boolean
  isInstalled: boolean
  settingsPath: string | null
  updateDate: string | null
  createdAt: string
  updatedAt: string
}

export interface Role {
  id: Id
  name: string
  guardName: string
  createdAt: string
  updatedAt: string
}

export interface Permission {
  id: Id
  name: string
  guardName: string
  createdAt: string
  updatedAt: string
}

export interface LoginSession {
  id: Id
  userId: Id
  location: string
  loginAt: string
  lastCheckoutAt: string | null
  logoutAt: string | null
  createdAt: string
  updatedAt: string
}

export interface Setting {
  id: Id
  key: string
  value: string
}

export interface TripDetail {
  id: Id
  orderId: Id
  customerId: Id
  restaurantId: Id
  riderId: Id
  deliveryCollectionId: Id | null
  distanceTravelled: number
  riderEarning: number
  restaurantEarning: number
  cashCollectedFromCustomer: number
  cashOnHold: number
  isSettlementDone: boolean
  createdAt: string
  updatedAt: string
}
