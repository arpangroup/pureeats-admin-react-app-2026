import { apiClient } from '@/lib/apiClient'
import { createCrudService } from '@/lib/crudServiceFactory'
import { mockDelay, paginate } from '@/lib/mockUtils'
import { IS_MOCK } from '@/config/env'
import { items } from '@/mocks/fixtures'
import type { ListParams, Paginated } from '@/types/common'
import type { Item } from '@/types/entities'

const base = createCrudService<Item>(items, '/admin/items', ['name', 'desc'])

export interface ItemBulkRow {
  restaurantId: number
  itemCategoryId: number
  name: string
  desc: string
  price: number
  oldPrice: number | null
  isVeg: boolean
}

export interface ItemBulkRowResult {
  index: number
  success: boolean
  message: string | null
  itemId: number | null
}

export interface ItemBulkUploadResult {
  totalRows: number
  successCount: number
  failureCount: number
  results: ItemBulkRowResult[]
}

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

  /** Live mode only — item's image field is set immediately on upload, returning the resolved URL. */
  async uploadImage(id: number, file: File): Promise<string> {
    const formData = new FormData()
    formData.append('file', file)
    const { data } = await apiClient.post<{ data: { url: string } }>(`/admin/items/${id}/image`, formData)
    return data.data.url
  },

  async bulkCreate(rows: ItemBulkRow[]): Promise<ItemBulkUploadResult> {
    if (IS_MOCK) {
      await mockDelay()
      const results: ItemBulkRowResult[] = []
      let successCount = 0
      for (let i = 0; i < rows.length; i += 1) {
        const row = rows[i]
        if (!row.name || !row.price) {
          results.push({ index: i, success: false, message: 'Name and price are required.', itemId: null })
          continue
        }
        const now = new Date().toISOString()
        const record = {
          ...row,
          image: '',
          placeholderImage: '',
          isRecommended: false,
          isPopular: false,
          isNew: true,
          isActive: true,
          addonCategoryIds: [],
          createdAt: now,
          updatedAt: now,
        }
        const created = await base.create(record as Partial<Item>)
        results.push({ index: i, success: true, message: 'Created', itemId: created.id })
        successCount += 1
      }
      return { totalRows: rows.length, successCount, failureCount: rows.length - successCount, results }
    }
    const { data } = await apiClient.post<{ data: ItemBulkUploadResult }>('/admin/items/bulk', {
      items: rows.map((row) => ({ ...row, image: '', desc: row.desc, isRecommended: false, isPopular: false })),
    })
    return data.data
  },
}
