import { apiClient } from '@/lib/apiClient'
import { mockDelay, paginate } from '@/lib/mockUtils'
import { IS_MOCK } from '@/config/env'
import { ratings, restaurants, users } from '@/mocks/fixtures'
import type { ListParams, Paginated } from '@/types/common'
import type { Rating } from '@/types/entities'

export type { Rating }

export interface RatingRow extends Rating {
  subjectName: string
}

function subjectName(rating: Rating): string {
  if (rating.rateableType === 'restaurant') {
    return restaurants.find((r) => r.id === rating.rateableId)?.name ?? 'Unknown restaurant'
  }
  if (rating.rateableType === 'delivery-guy') {
    return users.find((u) => u.id === rating.rateableId)?.name ?? 'Unknown rider'
  }
  return 'Unknown item'
}

export const ratingService = {
  async list(params: ListParams = {}): Promise<Paginated<RatingRow>> {
    if (IS_MOCK) {
      await mockDelay()
      const rows: RatingRow[] = ratings.map((r) => ({ ...r, subjectName: subjectName(r) }))
      return paginate(rows, params, ['name', 'comment', 'subjectName'])
    }
    const { data } = await apiClient.get<Paginated<RatingRow>>('/ratings', { params })
    return data
  },

  async listForRestaurant(restaurantId: number, params: ListParams = {}): Promise<Paginated<RatingRow>> {
    if (IS_MOCK) {
      await mockDelay()
      const rows: RatingRow[] = ratings
        .filter((r) => r.rateableType === 'restaurant' && r.rateableId === restaurantId)
        .map((r) => ({ ...r, subjectName: subjectName(r) }))
      return paginate(rows, params, ['name', 'comment'])
    }
    const { data } = await apiClient.get<Paginated<RatingRow>>(`/restaurants/${restaurantId}/ratings`, { params })
    return data
  },

  async update(id: number, payload: Partial<Rating>): Promise<RatingRow> {
    if (IS_MOCK) {
      await mockDelay()
      const index = ratings.findIndex((r) => r.id === id)
      if (index === -1) throw { message: 'Rating not found' }
      ratings[index] = { ...ratings[index], ...payload, updatedAt: new Date().toISOString() }
      return { ...ratings[index], subjectName: subjectName(ratings[index]) }
    }
    const { data } = await apiClient.put<RatingRow>(`/ratings/${id}`, payload)
    return data
  },

  async remove(id: number): Promise<void> {
    if (IS_MOCK) {
      await mockDelay()
      const index = ratings.findIndex((r) => r.id === id)
      if (index !== -1) ratings.splice(index, 1)
      return
    }
    await apiClient.delete(`/ratings/${id}`)
  },
}
