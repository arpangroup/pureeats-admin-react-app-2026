import { apiClient } from '@/lib/apiClient'
import { createCrudService } from '@/lib/crudServiceFactory'
import { mockDelay, paginate } from '@/lib/mockUtils'
import { IS_MOCK } from '@/config/env'
import { restaurants, restaurantUsers } from '@/mocks/fixtures'
import type { ListParams, Paginated } from '@/types/common'
import type { Restaurant } from '@/types/entities'

const base = createCrudService<Restaurant>(restaurants, '/restaurants', ['name', 'sku', 'contactNumber'])

export const restaurantService = {
  ...base,

  /** Restaurant-owner scoped list — only restaurants owned by this user. */
  async listByOwner(ownerId: number, params: ListParams = {}): Promise<Paginated<Restaurant>> {
    if (IS_MOCK) {
      await mockDelay()
      const ownedIds = restaurantUsers.filter((ru) => ru.userId === ownerId).map((ru) => ru.restaurantId)
      const rows = restaurants.filter((r) => ownedIds.includes(r.id))
      return paginate(rows, params, ['name', 'sku'])
    }
    const { data } = await apiClient.get<Paginated<Restaurant>>('/restaurant-owner/restaurants', { params })
    return data
  },

  async toggleActive(id: number, isActive: boolean) {
    return base.update(id, { isActive } as Partial<Restaurant>)
  },

  async toggleAccepted(id: number, isAccepted: boolean) {
    return base.update(id, { isAccepted } as Partial<Restaurant>)
  },
}
