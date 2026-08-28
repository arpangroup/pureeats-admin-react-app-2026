import type { DayOfWeek, DaySchedule, Restaurant, RestaurantCategory, RestaurantCategorySlider, RestaurantUser, TimeSlot } from '@/types/entities'

const ALL_DAYS: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

/** Same hours every open day, single slot — the common case for most restaurants. */
function uniformSchedule(open: string, close: string, closedDays: DayOfWeek[] = []): DaySchedule[] {
  return ALL_DAYS.map((day) => ({
    day,
    isOpen: !closedDays.includes(day),
    slots: closedDays.includes(day) ? [] : [{ open, close }],
  }))
}

export const restaurantCategories: RestaurantCategory[] = [
  { id: 1, name: 'North Indian', isActive: true, createdAt: '2025-10-01T09:00:00Z', updatedAt: '2025-10-01T09:00:00Z' },
  { id: 2, name: 'South Indian', isActive: true, createdAt: '2025-10-01T09:00:00Z', updatedAt: '2025-10-01T09:00:00Z' },
  { id: 3, name: 'Pizza', isActive: true, createdAt: '2025-10-01T09:00:00Z', updatedAt: '2025-10-01T09:00:00Z' },
  { id: 4, name: 'Healthy', isActive: true, createdAt: '2025-10-01T09:00:00Z', updatedAt: '2025-10-01T09:00:00Z' },
  { id: 5, name: 'Mughlai', isActive: true, createdAt: '2025-10-01T09:00:00Z', updatedAt: '2025-10-01T09:00:00Z' },
  { id: 6, name: 'Chinese', isActive: true, createdAt: '2025-10-01T09:00:00Z', updatedAt: '2025-10-01T09:00:00Z' },
  { id: 7, name: 'Desserts', isActive: false, createdAt: '2025-10-01T09:00:00Z', updatedAt: '2025-10-01T09:00:00Z' },
]

export const restaurantCategorySliders: RestaurantCategorySlider[] = [
  { id: 1, name: 'Top Cuisines', isActive: true, createdAt: '2025-10-02T09:00:00Z', updatedAt: '2025-10-02T09:00:00Z' },
  { id: 2, name: 'Weekend Picks', isActive: true, createdAt: '2025-10-03T09:00:00Z', updatedAt: '2025-10-03T09:00:00Z' },
]

const lunchDinnerSplit: TimeSlot[] = [{ open: '11:00', close: '15:00' }, { open: '18:00', close: '23:30' }]

export const restaurants: Restaurant[] = [
  {
    id: 1, name: 'Spice Garden', slug: 'spice-garden', description: 'Authentic North Indian curries and tandoor specials.',
    contactNumber: '9811100001', openingTime: '10:00', closingTime: '23:00',
    weeklySchedule: uniformSchedule('10:00', '23:00'), locationId: 1,
    image: '', placeholderImage: '', images: [], rating: 4.5, deliveryTime: 32, priceRange: 2, isPureveg: false,
    address: '12, 5th Block, Koramangala', pincode: '560095', landmark: 'Near Forum Mall', sku: 'RES-0001',
    latitude: 12.9346, longitude: 77.6104, certificate: 'FSSAI-11421001000123', restaurantCharges: 20, deliveryCharges: 25,
    isActive: true, isAccepted: true, isFeatured: true, commissionRate: 18, deliveryType: 'delivery',
    deliveryRadius: 8, deliveryChargeType: 'dynamic', baseDeliveryCharge: 20, baseDeliveryDistance: 2,
    extraDeliveryCharge: 5, extraDeliveryDistance: 1, minOrderPrice: 99, isNotifiable: true, autoAcceptable: false,
    isSchedulable: true, isAcceptCod: true, categoryIds: [1, 5], createdBy: 1, updatedBy: 1,
    createdAt: '2025-11-02T09:00:00Z', updatedAt: '2026-08-20T09:00:00Z',
  },
  {
    id: 2, name: 'Dosa Corner', slug: 'dosa-corner', description: 'Crispy dosas, idlis and filter coffee since 1998.',
    contactNumber: '9811100002', openingTime: '07:00', closingTime: '22:00',
    weeklySchedule: uniformSchedule('07:00', '22:00'), locationId: 5,
    image: '', placeholderImage: '', images: [], rating: 4.7, deliveryTime: 25, priceRange: 1, isPureveg: true,
    address: '45, 4th Main, Jayanagar', pincode: '560011', landmark: 'Opp. Jayanagar Bus Stand', sku: 'RES-0002',
    latitude: 12.9308, longitude: 77.5838, certificate: 'FSSAI-11421001000456', restaurantCharges: 10, deliveryCharges: 20,
    isActive: true, isAccepted: true, isFeatured: true, commissionRate: 15, deliveryType: 'both',
    deliveryRadius: 6, deliveryChargeType: 'fixed', baseDeliveryCharge: 20, baseDeliveryDistance: 5,
    extraDeliveryCharge: 0, extraDeliveryDistance: 0, minOrderPrice: 79, isNotifiable: true, autoAcceptable: true,
    isSchedulable: false, isAcceptCod: true, categoryIds: [2], createdBy: 1, updatedBy: 2,
    createdAt: '2025-11-03T09:00:00Z', updatedAt: '2026-08-18T09:00:00Z',
  },
  {
    id: 3, name: 'Pizza House', slug: 'pizza-house', description: 'Wood-fired pizzas with fresh, local toppings.',
    contactNumber: '9811100003', openingTime: '11:00', closingTime: '23:30',
    weeklySchedule: ALL_DAYS.map((day) => ({ day, isOpen: true, slots: lunchDinnerSplit })), locationId: 2,
    image: '', placeholderImage: '', images: [], rating: 4.3, deliveryTime: 35, priceRange: 2, isPureveg: false,
    address: '100 Feet Road, Indiranagar', pincode: '560038', landmark: 'Near Sony World Signal', sku: 'RES-0003',
    latitude: 12.9719, longitude: 77.6412, certificate: null, restaurantCharges: 25, deliveryCharges: 30,
    isActive: true, isAccepted: true, isFeatured: false, commissionRate: 20, deliveryType: 'both',
    deliveryRadius: 10, deliveryChargeType: 'dynamic', baseDeliveryCharge: 25, baseDeliveryDistance: 2,
    extraDeliveryCharge: 6, extraDeliveryDistance: 1, minOrderPrice: 149, isNotifiable: false, autoAcceptable: false,
    isSchedulable: true, isAcceptCod: false, categoryIds: [3], createdBy: 1, updatedBy: 1,
    createdAt: '2025-11-04T09:00:00Z', updatedAt: '2026-08-15T09:00:00Z',
  },
  {
    id: 4, name: 'Green Bowl', slug: 'green-bowl', description: 'Salads, smoothie bowls and healthy wraps.',
    contactNumber: '9811100004', openingTime: '08:00', closingTime: '21:00',
    weeklySchedule: uniformSchedule('08:00', '21:00'), locationId: 3,
    image: '', placeholderImage: '', images: [], rating: 4.6, deliveryTime: 28, priceRange: 2, isPureveg: true,
    address: '27th Main, HSR Layout', pincode: '560102', landmark: 'Near Agara Lake', sku: 'RES-0004',
    latitude: 12.9151, longitude: 77.6386, certificate: 'FSSAI-11421001000789', restaurantCharges: 15, deliveryCharges: 22,
    isActive: true, isAccepted: true, isFeatured: true, commissionRate: 16, deliveryType: 'delivery',
    deliveryRadius: 7, deliveryChargeType: 'dynamic', baseDeliveryCharge: 22, baseDeliveryDistance: 2,
    extraDeliveryCharge: 4, extraDeliveryDistance: 1, minOrderPrice: 99, isNotifiable: true, autoAcceptable: true,
    isSchedulable: false, isAcceptCod: true, categoryIds: [4], createdBy: 2, updatedBy: 2,
    createdAt: '2025-11-07T09:00:00Z', updatedAt: '2026-08-22T09:00:00Z',
  },
  {
    id: 5, name: 'Kebab King', slug: 'kebab-king', description: 'Smoky kebabs and Mughlai classics.',
    contactNumber: '9811100005', openingTime: '12:00', closingTime: '00:00',
    weeklySchedule: uniformSchedule('12:00', '00:00'), locationId: 4,
    image: '', placeholderImage: '', images: [], rating: 4.1, deliveryTime: 40, priceRange: 3, isPureveg: false,
    address: 'ITPL Main Road, Whitefield', pincode: '560066', landmark: 'Near ITPL Gate', sku: 'RES-0005',
    latitude: 12.9857, longitude: 77.7371, certificate: null, restaurantCharges: 30, deliveryCharges: 35,
    isActive: false, isAccepted: true, isFeatured: false, commissionRate: 18, deliveryType: 'self-pickup',
    deliveryRadius: 9, deliveryChargeType: 'fixed', baseDeliveryCharge: 35, baseDeliveryDistance: 5,
    extraDeliveryCharge: 0, extraDeliveryDistance: 0, minOrderPrice: 199, isNotifiable: true, autoAcceptable: false,
    isSchedulable: true, isAcceptCod: true, categoryIds: [5], createdBy: 1, updatedBy: 3,
    createdAt: '2025-11-09T09:00:00Z', updatedAt: '2026-08-10T09:00:00Z',
  },
  {
    id: 6, name: 'Wok & Roll', slug: 'wok-and-roll', description: 'Indo-Chinese favourites, noodles and rolls.',
    contactNumber: '9811100006', openingTime: '11:30', closingTime: '23:00',
    weeklySchedule: uniformSchedule('11:30', '23:00', ['monday']), locationId: 6,
    image: '', placeholderImage: '', images: [], rating: 4.0, deliveryTime: 38, priceRange: 2, isPureveg: false,
    address: 'Neeladri Road, Electronic City', pincode: '560100', landmark: 'Near Infosys Gate 4', sku: 'RES-0006',
    latitude: 12.8452, longitude: 77.6602, certificate: null, restaurantCharges: 18, deliveryCharges: 28,
    isActive: true, isAccepted: false, isFeatured: false, commissionRate: 15, deliveryType: 'delivery',
    deliveryRadius: 8, deliveryChargeType: 'dynamic', baseDeliveryCharge: 25, baseDeliveryDistance: 2,
    extraDeliveryCharge: 5, extraDeliveryDistance: 1, minOrderPrice: 129, isNotifiable: true, autoAcceptable: false,
    isSchedulable: false, isAcceptCod: true, categoryIds: [6], createdBy: 2, updatedBy: 2,
    createdAt: '2025-12-01T09:00:00Z', updatedAt: '2026-08-05T09:00:00Z',
  },
]

export const restaurantUsers: RestaurantUser[] = [
  { id: 1, userId: 10, restaurantId: 1, createdAt: '2025-11-02T09:00:00Z', updatedAt: '2025-11-02T09:00:00Z' },
  { id: 2, userId: 11, restaurantId: 2, createdAt: '2025-11-03T09:00:00Z', updatedAt: '2025-11-03T09:00:00Z' },
  { id: 3, userId: 12, restaurantId: 3, createdAt: '2025-11-04T09:00:00Z', updatedAt: '2025-11-04T09:00:00Z' },
  { id: 4, userId: 13, restaurantId: 4, createdAt: '2025-11-07T09:00:00Z', updatedAt: '2025-11-07T09:00:00Z' },
  { id: 5, userId: 14, restaurantId: 5, createdAt: '2025-11-09T09:00:00Z', updatedAt: '2025-11-09T09:00:00Z' },
  { id: 6, userId: 12, restaurantId: 6, createdAt: '2025-12-01T09:00:00Z', updatedAt: '2025-12-01T09:00:00Z' },
]
