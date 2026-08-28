import { apiClient } from '@/lib/apiClient'
import { createCrudService } from '@/lib/crudServiceFactory'
import { mockDelay, paginate } from '@/lib/mockUtils'
import { IS_MOCK } from '@/config/env'
import { users, restaurantUsers, restaurants, loginSessions } from '@/mocks/fixtures'
import { mockDelay as delay, nextMockId } from '@/lib/mockUtils'
import type { ListParams, Paginated, UserRole } from '@/types/common'
import type { User, RestaurantUser, LoginSession } from '@/types/entities'

const base = createCrudService<User>(users, '/users', ['name', 'email', 'phone'])

/** Users list scoped to one role — powers Users, Employees and Restaurant Owners screens. */
async function listByRole(role: UserRole, params: ListParams = {}): Promise<Paginated<User>> {
  if (IS_MOCK) {
    await mockDelay()
    const rows = users.filter((u) => u.role === role)
    return paginate(rows, params, ['name', 'email', 'phone'])
  }
  const { data } = await apiClient.get<Paginated<User>>('/users', { params: { ...params, role } })
  return data
}

export const userService = {
  ...base,
  listByRole,

  async toggleActive(id: number, isActive: boolean) {
    return base.update(id, { isActive } as Partial<User>)
  },

  /** Restaurants owned by a given restaurant-owner user (for the mapping screen). */
  restaurantsForOwner(ownerId: number) {
    const ids = restaurantUsers.filter((ru) => ru.userId === ownerId).map((ru) => ru.restaurantId)
    return restaurants.filter((r) => ids.includes(r.id))
  },

  async updateOwnerRestaurants(ownerId: number, restaurantIds: number[]): Promise<void> {
    if (IS_MOCK) {
      await delay(150)
      for (let i = restaurantUsers.length - 1; i >= 0; i -= 1) {
        if (restaurantUsers[i].userId === ownerId) restaurantUsers.splice(i, 1)
      }
      const now = new Date().toISOString()
      restaurantIds.forEach((restaurantId) => {
        const link: RestaurantUser = { id: nextMockId(), userId: ownerId, restaurantId, createdAt: now, updatedAt: now }
        restaurantUsers.push(link)
      })
      return
    }
    await apiClient.put(`/restaurant-owners/${ownerId}/restaurants`, { restaurantIds })
  },

  /** Last N login sessions for a user — powers the Activity card on the user detail page. */
  async recentLoginSessions(userId: number, limit = 5): Promise<LoginSession[]> {
    if (IS_MOCK) {
      await delay(150)
      return loginSessions
        .filter((s) => s.userId === userId)
        .sort((a, b) => new Date(b.loginAt).getTime() - new Date(a.loginAt).getTime())
        .slice(0, limit)
    }
    const { data } = await apiClient.get<LoginSession[]>(`/users/${userId}/login-sessions`, { params: { limit } })
    return data
  },
}
