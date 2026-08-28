import type {
  DeliveryCollection,
  DeliveryCollectionLog,
  RestaurantEarning,
  RestaurantPayout,
  Wallet,
  Transaction,
} from '@/types/entities'

export const restaurantEarnings: RestaurantEarning[] = [
  { id: 1, restaurantId: 1, userId: 10, amount: 18420, isRequested: true, isProcessed: true, restaurantPayoutId: 1, createdAt: '2026-08-01T09:00:00Z', updatedAt: '2026-08-05T09:00:00Z' },
  { id: 2, restaurantId: 2, userId: 11, amount: 12980, isRequested: true, isProcessed: false, restaurantPayoutId: 2, createdAt: '2026-08-08T09:00:00Z', updatedAt: '2026-08-08T09:00:00Z' },
  { id: 3, restaurantId: 3, userId: 12, amount: 24310, isRequested: false, isProcessed: false, restaurantPayoutId: null, createdAt: '2026-08-15T09:00:00Z', updatedAt: '2026-08-15T09:00:00Z' },
  { id: 4, restaurantId: 4, userId: 13, amount: 9650, isRequested: true, isProcessed: true, restaurantPayoutId: 3, createdAt: '2026-08-18T09:00:00Z', updatedAt: '2026-08-19T09:00:00Z' },
]

export const restaurantPayouts: RestaurantPayout[] = [
  { id: 1, restaurantId: 1, restaurantEarningId: 1, amount: 18420, status: 'paid', transactionMode: 'Bank Transfer', transactionId: 'PYT-88213', message: 'Weekly settlement', createdAt: '2026-08-05T09:00:00Z', updatedAt: '2026-08-05T09:00:00Z' },
  { id: 2, restaurantId: 2, restaurantEarningId: 2, amount: 12980, status: 'processing', transactionMode: 'UPI', transactionId: null, message: null, createdAt: '2026-08-08T09:00:00Z', updatedAt: '2026-08-08T09:00:00Z' },
  { id: 3, restaurantId: 4, restaurantEarningId: 4, amount: 9650, status: 'paid', transactionMode: 'Bank Transfer', transactionId: 'PYT-88214', message: 'Weekly settlement', createdAt: '2026-08-19T09:00:00Z', updatedAt: '2026-08-19T09:00:00Z' },
  { id: 4, restaurantId: 5, restaurantEarningId: 4, amount: 4200, status: 'rejected', transactionMode: 'Bank Transfer', transactionId: null, message: 'Bank details mismatch', createdAt: '2026-08-20T09:00:00Z', updatedAt: '2026-08-21T09:00:00Z' },
]

export const deliveryCollections: DeliveryCollection[] = [
  { id: 1, userId: 20, amount: 3420, createdAt: '2026-08-27T09:00:00Z', updatedAt: '2026-08-27T09:00:00Z' },
  { id: 2, userId: 21, amount: 1980, createdAt: '2026-08-27T09:00:00Z', updatedAt: '2026-08-27T09:00:00Z' },
  { id: 3, userId: 24, amount: 5210, createdAt: '2026-08-27T09:00:00Z', updatedAt: '2026-08-27T09:00:00Z' },
]

export const deliveryCollectionLogs: DeliveryCollectionLog[] = [
  { id: 1, deliveryCollectionId: 1, amount: 340, type: 'credit', message: 'COD collected for order PE1004', createdAt: '2026-08-27T10:00:00Z', updatedAt: '2026-08-27T10:00:00Z' },
  { id: 2, deliveryCollectionId: 1, amount: 200, type: 'debit', message: 'Cash handover to hub', createdAt: '2026-08-27T18:00:00Z', updatedAt: '2026-08-27T18:00:00Z' },
  { id: 3, deliveryCollectionId: 2, amount: 220, type: 'credit', message: 'COD collected for order PE1011', createdAt: '2026-08-27T11:30:00Z', updatedAt: '2026-08-27T11:30:00Z' },
]

export const wallets: Wallet[] = [
  { id: 1, holderType: 'User', holderId: 30, name: 'Pooja Sharma', slug: 'pooja-sharma', description: 'Customer wallet', balance: 420, decimalPlaces: 2, createdAt: '2025-12-01T09:00:00Z', updatedAt: '2026-08-20T09:00:00Z' },
  { id: 2, holderType: 'User', holderId: 31, name: 'Rohit Malhotra', slug: 'rohit-malhotra', description: 'Customer wallet', balance: 0, decimalPlaces: 2, createdAt: '2025-12-02T09:00:00Z', updatedAt: '2026-08-10T09:00:00Z' },
  { id: 3, holderType: 'Restaurant', holderId: 1, name: 'Spice Garden', slug: 'spice-garden', description: 'Restaurant wallet', balance: 18420, decimalPlaces: 2, createdAt: '2025-11-02T09:00:00Z', updatedAt: '2026-08-05T09:00:00Z' },
]

export const transactions: Transaction[] = [
  { id: 1, payableType: 'Order', payableId: 4, walletId: 1, type: 'credit', amount: 50, confirmed: true, meta: { reason: 'Coupon cashback' }, uuid: 'txn-uuid-0001', createdAt: '2026-08-10T09:00:00Z', updatedAt: '2026-08-10T09:00:00Z' },
  { id: 2, payableType: 'Order', payableId: 9, walletId: 1, type: 'debit', amount: 30, confirmed: true, meta: { reason: 'Applied on order PE1009' }, uuid: 'txn-uuid-0002', createdAt: '2026-08-15T09:00:00Z', updatedAt: '2026-08-15T09:00:00Z' },
  { id: 3, payableType: 'RestaurantPayout', payableId: 1, walletId: 3, type: 'debit', amount: 18420, confirmed: true, meta: { reason: 'Payout settled' }, uuid: 'txn-uuid-0003', createdAt: '2026-08-05T09:00:00Z', updatedAt: '2026-08-05T09:00:00Z' },
]
