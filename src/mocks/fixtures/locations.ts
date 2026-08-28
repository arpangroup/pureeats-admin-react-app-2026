import type { Location, PopularGeoPlace } from '@/types/entities'

export const locations: Location[] = [
  { id: 1, name: 'Koramangala', description: 'South Bangalore tech hub', isPopular: true, isActive: true },
  { id: 2, name: 'Indiranagar', description: 'Trendy cafes and pubs', isPopular: true, isActive: true },
  { id: 3, name: 'HSR Layout', description: 'Residential and startups', isPopular: true, isActive: true },
  { id: 4, name: 'Whitefield', description: 'IT corridor', isPopular: false, isActive: true },
  { id: 5, name: 'Jayanagar', description: 'Old Bangalore charm', isPopular: false, isActive: true },
  { id: 6, name: 'Electronic City', description: 'IT parks and tech campuses', isPopular: false, isActive: true },
  { id: 7, name: 'MG Road', description: 'Central business district', isPopular: true, isActive: false },
]

export const popularGeoPlaces: PopularGeoPlace[] = [
  { id: 1, name: 'Forum Mall, Koramangala', latitude: 12.9346, longitude: 77.6104, isActive: true, createdAt: '2026-01-05T10:00:00Z', updatedAt: '2026-01-05T10:00:00Z' },
  { id: 2, name: '100 Feet Road, Indiranagar', latitude: 12.9719, longitude: 77.6412, isActive: true, createdAt: '2026-01-06T10:00:00Z', updatedAt: '2026-01-06T10:00:00Z' },
  { id: 3, name: 'Agara Lake, HSR Layout', latitude: 12.9151, longitude: 77.6386, isActive: true, createdAt: '2026-01-07T10:00:00Z', updatedAt: '2026-01-07T10:00:00Z' },
  { id: 4, name: 'ITPL Main Gate, Whitefield', latitude: 12.9857, longitude: 77.7371, isActive: false, createdAt: '2026-01-08T10:00:00Z', updatedAt: '2026-01-08T10:00:00Z' },
]
