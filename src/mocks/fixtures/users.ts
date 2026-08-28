import type { User, DeliveryGuyDetail, LoginSession, TripDetail } from '@/types/entities'

export const users: User[] = [
  // Admin / employees
  { id: 1, name: 'Arpan Admin', email: 'arpan@pureeats.in', phone: '9800000001', photo: null, isActive: true, role: 'admin', createdBy: null, updatedBy: null, createdAt: '2025-11-01T09:00:00Z', updatedAt: '2025-11-01T09:00:00Z' },
  { id: 2, name: 'Nisha Rao', email: 'nisha.ops@pureeats.in', phone: '9800000002', photo: null, isActive: true, role: 'employee', createdBy: 1, updatedBy: 1, createdAt: '2025-11-05T09:00:00Z', updatedAt: '2025-11-05T09:00:00Z' },
  { id: 3, name: 'Karthik Iyer', email: 'karthik.support@pureeats.in', phone: '9800000003', photo: null, isActive: true, role: 'employee', createdBy: 1, updatedBy: 1, createdAt: '2025-11-06T09:00:00Z', updatedAt: '2025-11-06T09:00:00Z' },
  { id: 4, name: 'Fatima Sheikh', email: 'fatima.finance@pureeats.in', phone: '9800000004', photo: null, isActive: false, role: 'employee', createdBy: 1, updatedBy: 2, createdAt: '2025-11-10T09:00:00Z', updatedAt: '2025-12-01T09:00:00Z' },

  // Restaurant owners
  { id: 10, name: 'Ravi Shankar', email: 'ravi@spicegarden.in', phone: '9811100001', photo: null, isActive: true, role: 'restaurant-owner', createdBy: 1, updatedBy: 1, createdAt: '2025-11-02T09:00:00Z', updatedAt: '2025-11-02T09:00:00Z' },
  { id: 11, name: 'Meera Nair', email: 'meera@dosacorner.in', phone: '9811100002', photo: null, isActive: true, role: 'restaurant-owner', createdBy: 1, updatedBy: 1, createdAt: '2025-11-03T09:00:00Z', updatedAt: '2025-11-03T09:00:00Z' },
  { id: 12, name: 'Arjun Verma', email: 'arjun@pizzahouse.in', phone: '9811100003', photo: null, isActive: true, role: 'restaurant-owner', createdBy: 1, updatedBy: 1, createdAt: '2025-11-04T09:00:00Z', updatedAt: '2025-11-04T09:00:00Z' },
  { id: 13, name: 'Divya Menon', email: 'divya@greenbowl.in', phone: '9811100004', photo: null, isActive: true, role: 'restaurant-owner', createdBy: 2, updatedBy: 2, createdAt: '2025-11-07T09:00:00Z', updatedAt: '2025-11-07T09:00:00Z' },
  { id: 14, name: 'Sameer Khan', email: 'sameer@kebabking.in', phone: '9811100005', photo: null, isActive: false, role: 'restaurant-owner', createdBy: 1, updatedBy: 3, createdAt: '2025-11-09T09:00:00Z', updatedAt: '2025-12-15T09:00:00Z' },

  // Delivery guys
  { id: 20, name: 'Suresh Patil', email: 'suresh.rider@pureeats.in', phone: '9822200001', photo: null, isActive: true, role: 'delivery-guy', deliveryGuyDetailId: 1, createdBy: 1, updatedBy: 1, createdAt: '2025-11-11T09:00:00Z', updatedAt: '2025-11-11T09:00:00Z' },
  { id: 21, name: 'Ramesh Gowda', email: 'ramesh.rider@pureeats.in', phone: '9822200002', photo: null, isActive: true, role: 'delivery-guy', deliveryGuyDetailId: 2, createdBy: 1, updatedBy: 1, createdAt: '2025-11-12T09:00:00Z', updatedAt: '2025-11-12T09:00:00Z' },
  { id: 22, name: 'Anil Kumar', email: 'anil.rider@pureeats.in', phone: '9822200003', photo: null, isActive: true, role: 'delivery-guy', deliveryGuyDetailId: 3, createdBy: 2, updatedBy: 2, createdAt: '2025-11-13T09:00:00Z', updatedAt: '2025-11-13T09:00:00Z' },
  { id: 23, name: 'Vinod Salvi', email: 'vinod.rider@pureeats.in', phone: '9822200004', photo: null, isActive: false, role: 'delivery-guy', deliveryGuyDetailId: 4, createdBy: 1, updatedBy: 3, createdAt: '2025-11-14T09:00:00Z', updatedAt: '2025-12-20T09:00:00Z' },
  { id: 24, name: 'Deepak Yadav', email: 'deepak.rider@pureeats.in', phone: '9822200005', photo: null, isActive: true, role: 'delivery-guy', deliveryGuyDetailId: 5, createdBy: 1, updatedBy: 1, createdAt: '2025-11-15T09:00:00Z', updatedAt: '2025-11-15T09:00:00Z' },

  // Customers
  { id: 30, name: 'Pooja Sharma', email: 'pooja.sharma@gmail.com', phone: '9900011001', photo: null, isActive: true, role: 'customer', deliveryPin: '4821', defaultAddressId: 1, createdBy: null, updatedBy: null, createdAt: '2025-12-01T09:00:00Z', updatedAt: '2025-12-01T09:00:00Z' },
  { id: 31, name: 'Rohit Malhotra', email: 'rohit.m@gmail.com', phone: '9900011002', photo: null, isActive: true, role: 'customer', deliveryPin: '3390', defaultAddressId: 2, createdBy: null, updatedBy: null, createdAt: '2025-12-02T09:00:00Z', updatedAt: '2025-12-02T09:00:00Z' },
  { id: 32, name: 'Ananya Das', email: 'ananya.das@gmail.com', phone: '9900011003', photo: null, isActive: true, role: 'customer', deliveryPin: '7712', defaultAddressId: 3, createdBy: null, updatedBy: null, createdAt: '2025-12-03T09:00:00Z', updatedAt: '2025-12-03T09:00:00Z' },
  { id: 33, name: 'Vikram Singh', email: 'vikram.singh@gmail.com', phone: '9900011004', photo: null, isActive: true, role: 'customer', deliveryPin: '5567', defaultAddressId: 4, createdBy: null, updatedBy: null, createdAt: '2025-12-04T09:00:00Z', updatedAt: '2025-12-04T09:00:00Z' },
  { id: 34, name: 'Sneha Reddy', email: 'sneha.reddy@gmail.com', phone: '9900011005', photo: null, isActive: true, role: 'customer', deliveryPin: '9043', defaultAddressId: 5, createdBy: null, updatedBy: null, createdAt: '2025-12-05T09:00:00Z', updatedAt: '2025-12-05T09:00:00Z' },
  { id: 35, name: 'Amitabh Joshi', email: 'amitabh.j@gmail.com', phone: '9900011006', photo: null, isActive: false, role: 'customer', deliveryPin: '2287', defaultAddressId: 6, createdBy: null, updatedBy: null, createdAt: '2025-12-06T09:00:00Z', updatedAt: '2026-01-10T09:00:00Z' },
]

export const deliveryGuyDetails: DeliveryGuyDetail[] = [
  { id: 1, userId: 20, name: 'Suresh Patil', age: 27, gender: 'male', photo: null, description: 'Reliable rider, 3 years experience', vehicleNumber: 'KA-05-AB-1234', commissionRate: 12, isNotifiable: true, maxAcceptDeliveryLimit: 3, rating: 4.7, isActive: true, isOnline: true, lastLat: 12.9352, lastLng: 77.6108, lastSeenAt: '2026-08-28T05:40:00Z', createdBy: 1, updatedBy: 1, createdAt: '2025-11-11T09:00:00Z', updatedAt: '2025-11-11T09:00:00Z' },
  { id: 2, userId: 21, name: 'Ramesh Gowda', age: 31, gender: 'male', photo: null, description: 'Prefers evening shifts', vehicleNumber: 'KA-03-CD-5678', commissionRate: 12, isNotifiable: true, maxAcceptDeliveryLimit: 2, rating: 4.5, isActive: true, isOnline: true, lastLat: 12.9312, lastLng: 77.5841, lastSeenAt: '2026-08-28T05:35:00Z', createdBy: 1, updatedBy: 1, createdAt: '2025-11-12T09:00:00Z', updatedAt: '2025-11-12T09:00:00Z' },
  { id: 3, userId: 22, name: 'Anil Kumar', age: 24, gender: 'male', photo: null, description: 'New rider, fast learner', vehicleNumber: 'KA-01-EF-9012', commissionRate: 10, isNotifiable: true, maxAcceptDeliveryLimit: 3, rating: 4.2, isActive: true, isOnline: false, lastLat: 12.9721, lastLng: 77.6415, lastSeenAt: '2026-08-27T19:20:00Z', createdBy: 2, updatedBy: 2, createdAt: '2025-11-13T09:00:00Z', updatedAt: '2025-11-13T09:00:00Z' },
  { id: 4, userId: 23, name: 'Vinod Salvi', age: 35, gender: 'male', photo: null, description: 'On leave', vehicleNumber: 'KA-02-GH-3456', commissionRate: 12, isNotifiable: false, maxAcceptDeliveryLimit: 2, rating: 4.0, isActive: false, isOnline: false, lastLat: null, lastLng: null, lastSeenAt: '2025-12-19T12:00:00Z', createdBy: 1, updatedBy: 3, createdAt: '2025-11-14T09:00:00Z', updatedAt: '2025-12-20T09:00:00Z' },
  { id: 5, userId: 24, name: 'Deepak Yadav', age: 29, gender: 'male', photo: null, description: 'Handles bulk restaurant zone', vehicleNumber: 'KA-04-IJ-7890', commissionRate: 15, isNotifiable: true, maxAcceptDeliveryLimit: 4, rating: 4.9, isActive: true, isOnline: true, lastLat: 12.9155, lastLng: 77.6390, lastSeenAt: '2026-08-28T05:42:00Z', createdBy: 1, updatedBy: 1, createdAt: '2025-11-15T09:00:00Z', updatedAt: '2025-11-15T09:00:00Z' },
]

export const loginSessions: LoginSession[] = [
  { id: 1, userId: 1, location: 'Koramangala HQ', loginAt: '2026-08-28T04:00:00Z', lastCheckoutAt: null, logoutAt: null, createdAt: '2026-08-28T04:00:00Z', updatedAt: '2026-08-28T04:00:00Z' },
  { id: 2, userId: 20, location: 'Koramangala', loginAt: '2026-08-28T03:30:00Z', lastCheckoutAt: '2026-08-28T05:10:00Z', logoutAt: null, createdAt: '2026-08-28T03:30:00Z', updatedAt: '2026-08-28T05:10:00Z' },
  { id: 3, userId: 20, location: 'Koramangala', loginAt: '2026-08-27T03:15:00Z', lastCheckoutAt: null, logoutAt: '2026-08-27T13:40:00Z', createdAt: '2026-08-27T03:15:00Z', updatedAt: '2026-08-27T13:40:00Z' },
  { id: 4, userId: 20, location: 'Koramangala', loginAt: '2026-08-26T03:45:00Z', lastCheckoutAt: null, logoutAt: '2026-08-26T14:05:00Z', createdAt: '2026-08-26T03:45:00Z', updatedAt: '2026-08-26T14:05:00Z' },
  { id: 5, userId: 20, location: 'Jayanagar', loginAt: '2026-08-25T04:00:00Z', lastCheckoutAt: null, logoutAt: '2026-08-25T12:50:00Z', createdAt: '2026-08-25T04:00:00Z', updatedAt: '2026-08-25T12:50:00Z' },
  { id: 6, userId: 20, location: 'Koramangala', loginAt: '2026-08-24T03:50:00Z', lastCheckoutAt: null, logoutAt: '2026-08-24T13:10:00Z', createdAt: '2026-08-24T03:50:00Z', updatedAt: '2026-08-24T13:10:00Z' },
  { id: 7, userId: 24, location: 'HSR Layout', loginAt: '2026-08-28T02:50:00Z', lastCheckoutAt: '2026-08-28T05:42:00Z', logoutAt: null, createdAt: '2026-08-28T02:50:00Z', updatedAt: '2026-08-28T05:42:00Z' },
  { id: 8, userId: 24, location: 'HSR Layout', loginAt: '2026-08-27T03:00:00Z', lastCheckoutAt: null, logoutAt: '2026-08-27T15:30:00Z', createdAt: '2026-08-27T03:00:00Z', updatedAt: '2026-08-27T15:30:00Z' },
]

export const tripDetails: TripDetail[] = [
  { id: 1, orderId: 1, customerId: 30, restaurantId: 1, riderId: 20, deliveryCollectionId: null, distanceTravelled: 3.4, riderEarning: 55, restaurantEarning: 18420, cashCollectedFromCustomer: 0, cashOnHold: 0, isSettlementDone: true, createdAt: '2026-08-10T09:30:00Z', updatedAt: '2026-08-10T10:10:00Z' },
  { id: 2, orderId: 4, customerId: 31, restaurantId: 1, riderId: 20, deliveryCollectionId: null, distanceTravelled: 2.1, riderEarning: 40, restaurantEarning: 0, cashCollectedFromCustomer: 620, cashOnHold: 0, isSettlementDone: true, createdAt: '2026-08-12T13:15:00Z', updatedAt: '2026-08-12T13:55:00Z' },
  { id: 3, orderId: 9, customerId: 32, restaurantId: 2, riderId: 20, deliveryCollectionId: 1, distanceTravelled: 4.8, riderEarning: 65, restaurantEarning: 0, cashCollectedFromCustomer: 0, cashOnHold: 0, isSettlementDone: true, createdAt: '2026-08-15T18:20:00Z', updatedAt: '2026-08-15T19:05:00Z' },
  { id: 4, orderId: 12, customerId: 33, restaurantId: 4, riderId: 24, deliveryCollectionId: null, distanceTravelled: 1.9, riderEarning: 35, restaurantEarning: 0, cashCollectedFromCustomer: 0, cashOnHold: 0, isSettlementDone: true, createdAt: '2026-08-18T09:05:00Z', updatedAt: '2026-08-18T09:40:00Z' },
  { id: 5, orderId: 15, customerId: 34, restaurantId: 4, riderId: 24, deliveryCollectionId: null, distanceTravelled: 5.2, riderEarning: 70, restaurantEarning: 0, cashCollectedFromCustomer: 890, cashOnHold: 0, isSettlementDone: false, createdAt: '2026-08-22T12:40:00Z', updatedAt: '2026-08-22T13:25:00Z' },
  { id: 6, orderId: 20, customerId: 30, restaurantId: 1, riderId: 24, deliveryCollectionId: null, distanceTravelled: 3.0, riderEarning: 48, restaurantEarning: 0, cashCollectedFromCustomer: 0, cashOnHold: 0, isSettlementDone: false, createdAt: '2026-08-27T20:10:00Z', updatedAt: '2026-08-27T20:50:00Z' },
]
