import type { UserRole } from '@/types/common'
import type { User } from '@/types/entities'

/** Admin base path for each role's list screen — mirrors roleBasePaths in UserDetailView. */
const ROLE_BASE_PATHS: Record<UserRole, string> = {
  admin: '/admin/users',
  customer: '/admin/users',
  employee: '/admin/employees',
  'restaurant-owner': '/admin/restaurant-owners',
  'delivery-guy': '/admin/delivery-guys',
}

/** Admin detail-page URL for a user, routed to the list screen matching their role. */
export function userDetailPath(user: Pick<User, 'id' | 'role'>): string {
  return `${ROLE_BASE_PATHS[user.role]}/${user.id}`
}

export function restaurantDetailPath(restaurantId: number): string {
  return `/admin/restaurants/${restaurantId}/edit`
}

export function deliveryGuyDetailPath(userId: number): string {
  return `/admin/delivery-guys/${userId}`
}
