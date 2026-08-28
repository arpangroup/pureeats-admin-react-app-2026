import type {
  Alert,
  Module,
  Page,
  PromoSlider,
  Rating,
  Slide,
  Support,
  Translation,
} from '@/types/entities'

export const ratings: Rating[] = [
  { id: 1, rating: 5, orderId: 7, name: 'Pooja Sharma', tags: ['Tasty', 'On time'], comment: 'Loved the butter chicken!', rateableType: 'restaurant', rateableId: 1, userId: 30, createdAt: '2026-08-20T12:00:00Z', updatedAt: '2026-08-20T12:00:00Z' },
  { id: 2, rating: 4, orderId: 12, name: 'Rohit Malhotra', tags: ['Fast delivery'], comment: 'Good but packaging could be better', rateableType: 'delivery-guy', rateableId: 20, userId: 31, createdAt: '2026-08-21T12:00:00Z', updatedAt: '2026-08-21T12:00:00Z' },
  { id: 3, rating: 3, orderId: 15, name: 'Ananya Das', tags: ['Late'], comment: 'Order took longer than expected', rateableType: 'restaurant', rateableId: 3, userId: 32, createdAt: '2026-08-22T12:00:00Z', updatedAt: '2026-08-22T12:00:00Z' },
  { id: 4, rating: 5, orderId: 18, name: 'Vikram Singh', tags: ['Great taste', 'Fresh'], comment: 'Best dosas in town', rateableType: 'restaurant', rateableId: 2, userId: 33, createdAt: '2026-08-23T12:00:00Z', updatedAt: '2026-08-23T12:00:00Z' },
]

export const alerts: Alert[] = [
  { id: 1, userId: 1, data: { title: 'New restaurant application', body: 'Wok & Roll requested approval', type: 'restaurant' }, isRead: false, createdAt: '2026-08-27T09:00:00Z', updatedAt: '2026-08-27T09:00:00Z' },
  { id: 2, userId: 1, data: { title: 'Payout requested', body: 'Dosa Corner requested a payout of ₹12,980', type: 'payout' }, isRead: false, createdAt: '2026-08-26T09:00:00Z', updatedAt: '2026-08-26T09:00:00Z' },
  { id: 3, userId: 1, data: { title: 'Low rated order', body: 'Order PE1015 received a 3-star rating', type: 'rating' }, isRead: true, createdAt: '2026-08-22T09:00:00Z', updatedAt: '2026-08-22T09:00:00Z' },
]

export const supportTickets: Support[] = [
  { id: 1, userId: 30, orderId: 4, restaurantId: 1, issue: 'Missing item', message: 'The naan was missing from my order', media: null, resolved: false, resolvedBy: null, createdAt: '2026-08-24T09:00:00Z', updatedAt: '2026-08-24T09:00:00Z' },
  { id: 2, userId: 32, orderId: 15, restaurantId: 3, issue: 'Late delivery', message: 'Order arrived 40 minutes late', media: null, resolved: true, resolvedBy: 2, createdAt: '2026-08-22T09:00:00Z', updatedAt: '2026-08-23T09:00:00Z' },
]

export const pages: Page[] = [
  { id: 1, name: 'About Us', slug: 'about-us', body: '<p>PureEats connects you to the best local restaurants.</p>', createdAt: '2025-10-01T09:00:00Z', updatedAt: '2026-01-05T09:00:00Z' },
  { id: 2, name: 'Terms & Conditions', slug: 'terms-conditions', body: '<p>By using PureEats you agree to the following terms...</p>', createdAt: '2025-10-01T09:00:00Z', updatedAt: '2026-01-05T09:00:00Z' },
  { id: 3, name: 'Privacy Policy', slug: 'privacy-policy', body: '<p>We take your privacy seriously...</p>', createdAt: '2025-10-01T09:00:00Z', updatedAt: '2026-01-05T09:00:00Z' },
  { id: 4, name: 'Refund Policy', slug: 'refund-policy', body: '<p>Refunds are processed within 5-7 business days...</p>', createdAt: '2025-10-01T09:00:00Z', updatedAt: '2026-01-05T09:00:00Z' },
]

export const translations: Translation[] = [
  { id: 1, languageName: 'English', languageCode: 'en', data: { welcome: 'Welcome', order_now: 'Order Now' }, isDefault: true, isActive: true, createdAt: '2025-10-01T09:00:00Z', updatedAt: '2025-10-01T09:00:00Z' },
  { id: 2, languageName: 'Hindi', languageCode: 'hi', data: { welcome: 'स्वागत है', order_now: 'अभी ऑर्डर करें' }, isDefault: false, isActive: true, createdAt: '2025-10-02T09:00:00Z', updatedAt: '2025-10-02T09:00:00Z' },
  { id: 3, languageName: 'Kannada', languageCode: 'kn', data: { welcome: 'ಸ್ವಾಗತ', order_now: 'ಈಗ ಆರ್ಡರ್ ಮಾಡಿ' }, isDefault: false, isActive: false, createdAt: '2025-10-03T09:00:00Z', updatedAt: '2025-10-03T09:00:00Z' },
]

export const promoSliders: PromoSlider[] = [
  { id: 1, name: 'Home Top Banner', isActive: true, locationId: 1, positionId: 1, size: 'large', createdAt: '2025-10-01T09:00:00Z', updatedAt: '2025-10-01T09:00:00Z' },
  { id: 2, name: 'Weekend Deals', isActive: true, locationId: null, positionId: 2, size: 'medium', createdAt: '2025-10-05T09:00:00Z', updatedAt: '2025-10-05T09:00:00Z' },
]

export const slides: Slide[] = [
  { id: 1, promoSliderId: 1, uniqueId: 'slide-001', name: '50% off first order', description: 'New users only', image: '', imagePlaceholder: '', url: '/coupons/WELCOME50', isActive: true, createdAt: '2025-10-01T09:00:00Z', updatedAt: '2025-10-01T09:00:00Z' },
  { id: 2, promoSliderId: 1, uniqueId: 'slide-002', name: 'Free delivery weekend', description: 'On orders above ₹299', image: '', imagePlaceholder: '', url: '/coupons/WEEKEND20', isActive: true, createdAt: '2025-10-02T09:00:00Z', updatedAt: '2025-10-02T09:00:00Z' },
  { id: 3, promoSliderId: 2, uniqueId: 'slide-003', name: 'Try Pizza House', description: 'Now on PureEats', image: '', imagePlaceholder: '', url: '/restaurant/pizza-house', isActive: false, createdAt: '2025-10-06T09:00:00Z', updatedAt: '2025-10-06T09:00:00Z' },
]

export const modules: Module[] = [
  { id: 1, name: 'Rating Module', shortName: 'rating', code: 'ratingmodule', description: 'Collect and moderate order/restaurant/rider ratings', version: '1.4.0', isActive: true, isInstalled: true, settingsPath: '/admin/modules/rating/settings', updateDate: '2026-06-01', createdAt: '2025-10-01T09:00:00Z', updatedAt: '2026-06-01T09:00:00Z' },
  { id: 2, name: 'Loyalty Points', shortName: 'loyalty', code: 'loyaltymodule', description: 'Reward repeat customers with points', version: '1.0.2', isActive: false, isInstalled: true, settingsPath: '/admin/modules/loyalty/settings', updateDate: '2026-03-11', createdAt: '2025-12-01T09:00:00Z', updatedAt: '2026-03-11T09:00:00Z' },
  { id: 3, name: 'Live Chat Support', shortName: 'livechat', code: 'livechatmodule', description: 'In-app chat between customers and support', version: '0.9.0', isActive: false, isInstalled: false, settingsPath: null, updateDate: null, createdAt: '2026-02-01T09:00:00Z', updatedAt: '2026-02-01T09:00:00Z' },
]
