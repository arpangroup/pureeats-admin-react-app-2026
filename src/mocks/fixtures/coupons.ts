import type { Coupon, CouponUsage } from '@/types/entities'

export const coupons: Coupon[] = [
  { id: 1, name: 'Welcome Offer', description: 'Flat ₹50 off on your first order', code: 'WELCOME50', discountType: 'flat', discount: 50, expiryDate: '2026-12-31', isActive: true, restaurantId: null, minOrderAmount: 199, uptoAmount: 50, totalCoupon: 1000, count: 342, maxCount: 1, createdAt: '2025-11-01T09:00:00Z', updatedAt: '2025-11-01T09:00:00Z' },
  { id: 2, name: 'Weekend Special', description: '20% off up to ₹100', code: 'WEEKEND20', discountType: 'percentage', discount: 20, expiryDate: '2026-09-30', isActive: true, restaurantId: null, minOrderAmount: 299, uptoAmount: 100, totalCoupon: 500, count: 128, maxCount: 3, createdAt: '2025-11-05T09:00:00Z', updatedAt: '2025-11-05T09:00:00Z' },
  { id: 3, name: 'Spice Garden Special', description: '15% off only at Spice Garden', code: 'SPICE15', discountType: 'percentage', discount: 15, expiryDate: '2026-10-15', isActive: true, restaurantId: 1, minOrderAmount: 249, uptoAmount: 75, totalCoupon: 300, count: 54, maxCount: 2, createdAt: '2025-11-10T09:00:00Z', updatedAt: '2025-11-10T09:00:00Z' },
  { id: 4, name: 'Pizza Party', description: 'Flat ₹75 off on Pizza House', code: 'PIZZA75', discountType: 'flat', discount: 75, expiryDate: '2026-09-01', isActive: false, restaurantId: 3, minOrderAmount: 399, uptoAmount: 75, totalCoupon: 200, count: 200, maxCount: 1, createdAt: '2025-11-12T09:00:00Z', updatedAt: '2026-01-05T09:00:00Z' },
  { id: 5, name: 'Big Order Bonanza', description: '₹150 off on orders above ₹999', code: 'BIG150', discountType: 'flat', discount: 150, expiryDate: '2026-11-30', isActive: true, restaurantId: null, minOrderAmount: 999, uptoAmount: 150, totalCoupon: 150, count: 22, maxCount: 1, createdAt: '2025-12-01T09:00:00Z', updatedAt: '2025-12-01T09:00:00Z' },
]

export const couponUsages: CouponUsage[] = [
  { id: 1, couponId: 1, userId: 30, restaurantId: 1, couponUsed: 1, createdAt: '2026-08-10T09:00:00Z', updatedAt: '2026-08-10T09:00:00Z' },
  { id: 2, couponId: 1, userId: 31, restaurantId: 2, couponUsed: 1, createdAt: '2026-08-11T09:00:00Z', updatedAt: '2026-08-11T09:00:00Z' },
  { id: 3, couponId: 2, userId: 32, restaurantId: 3, couponUsed: 2, createdAt: '2026-08-12T09:00:00Z', updatedAt: '2026-08-12T09:00:00Z' },
]
