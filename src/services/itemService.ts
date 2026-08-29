import { apiClient } from '@/lib/apiClient'
import { createCrudService } from '@/lib/crudServiceFactory'
import { mockDelay, paginate } from '@/lib/mockUtils'
import { IS_MOCK } from '@/config/env'
import { items } from '@/mocks/fixtures'
import type { ListParams, Paginated } from '@/types/common'
import type { Item } from '@/types/entities'

const base = createCrudService<Item>(items, '/admin/items', ['name', 'desc'])

export const itemService = {
  ...base,

  async listByRestaurant(restaurantId: number, params: ListParams = {}): Promise<Paginated<Item>> {
    if (IS_MOCK) {
      await mockDelay()
      const rows = items.filter((item) => item.restaurantId === restaurantId)
      return paginate(rows, params, ['name', 'desc'])
    }
    const { data } = await apiClient.get<Paginated<Item>>(`/restaurants/${restaurantId}/items`, { params })
    return data
  },

  async toggleActive(id: number, isActive: boolean) {
    return base.update(id, { isActive } as Partial<Item>)
  },
}
