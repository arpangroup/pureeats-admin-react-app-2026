import { apiClient } from '@/lib/apiClient'
import { mockDelay, nextMockId, paginate } from '@/lib/mockUtils'
import { IS_MOCK } from '@/config/env'
import { deliveryGuyDetails, users, deliveryGuyRestaurantAssignments } from '@/mocks/fixtures'
import type { ListParams, Paginated } from '@/types/common'
import type { DeliveryGuyDetail, User } from '@/types/entities'

export interface DeliveryGuyRow extends DeliveryGuyDetail {
  email: string
  phone: string
  isUserActive: boolean
}

function toRow(detail: DeliveryGuyDetail): DeliveryGuyRow {
  const user = users.find((u) => u.id === detail.userId)
  return {
    ...detail,
    email: user?.email ?? '',
    phone: user?.phone ?? '',
    isUserActive: user?.isActive ?? false,
  }
}

export const deliveryGuyService = {
  async list(params: ListParams = {}): Promise<Paginated<DeliveryGuyRow>> {
    if (IS_MOCK) {
      await mockDelay()
      return paginate(deliveryGuyDetails.map(toRow), params, ['name', 'vehicleNumber', 'phone'])
    }
    const { data } = await apiClient.get<Paginated<DeliveryGuyRow>>('/delivery-guys', { params })
    return data
  },

  async get(id: number): Promise<DeliveryGuyRow | undefined> {
    if (IS_MOCK) {
      await mockDelay()
      const found = deliveryGuyDetails.find((d) => d.id === id)
      return found ? toRow(found) : undefined
    }
    const { data } = await apiClient.get<DeliveryGuyRow>(`/delivery-guys/${id}`)
    return data
  },

  async create(payload: Partial<DeliveryGuyDetail> & { name: string; email: string }): Promise<DeliveryGuyRow> {
    if (IS_MOCK) {
      await mockDelay()
      const userId = nextMockId()
      const now = new Date().toISOString()
      const newUser: User = {
        id: userId,
        name: payload.name,
        email: payload.email,
        phone: '',
        photo: null,
        isActive: true,
        role: 'delivery-guy',
        createdAt: now,
        updatedAt: now,
      }
      users.unshift(newUser)
      const detail: DeliveryGuyDetail = {
        id: nextMockId(),
        userId,
        name: payload.name,
        age: payload.age ?? 18,
        gender: payload.gender ?? 'male',
        photo: payload.photo ?? null,
        description: payload.description ?? '',
        vehicleNumber: payload.vehicleNumber ?? '',
        commissionRate: payload.commissionRate ?? 0,
        isNotifiable: payload.isNotifiable ?? true,
        maxAcceptDeliveryLimit: payload.maxAcceptDeliveryLimit ?? 1,
        rating: payload.rating ?? 0,
        isActive: payload.isActive ?? true,
        isOnline: payload.isOnline ?? false,
        createdAt: now,
        updatedAt: now,
      }
      deliveryGuyDetails.unshift(detail)
      newUser.deliveryGuyDetailId = detail.id
      return toRow(detail)
    }
    const { data } = await apiClient.post<DeliveryGuyRow>('/delivery-guys', payload)
    return data
  },

  async update(id: number, payload: Partial<DeliveryGuyDetail>): Promise<DeliveryGuyRow> {
    if (IS_MOCK) {
      await mockDelay()
      const index = deliveryGuyDetails.findIndex((d) => d.id === id)
      if (index === -1) throw { message: 'Delivery partner not found' }
      deliveryGuyDetails[index] = { ...deliveryGuyDetails[index], ...payload }
      return toRow(deliveryGuyDetails[index])
    }
    const { data } = await apiClient.put<DeliveryGuyRow>(`/delivery-guys/${id}`, payload)
    return data
  },

  async remove(id: number): Promise<void> {
    if (IS_MOCK) {
      await mockDelay()
      const index = deliveryGuyDetails.findIndex((d) => d.id === id)
      if (index !== -1) deliveryGuyDetails.splice(index, 1)
      return
    }
    await apiClient.delete(`/delivery-guys/${id}`)
  },

  async toggleActive(id: number, isActive: boolean) {
    return deliveryGuyService.update(id, { isActive })
  },

  async assignedRestaurantIds(deliveryGuyId: number): Promise<number[]> {
    if (IS_MOCK) {
      await mockDelay(150)
      return deliveryGuyRestaurantAssignments[deliveryGuyId] ?? []
    }
    const { data } = await apiClient.get<number[]>(`/delivery-guys/${deliveryGuyId}/restaurants`)
    return data
  },

  async updateAssignedRestaurants(deliveryGuyId: number, restaurantIds: number[]): Promise<number[]> {
    if (IS_MOCK) {
      await mockDelay(150)
      deliveryGuyRestaurantAssignments[deliveryGuyId] = restaurantIds
      return restaurantIds
    }
    const { data } = await apiClient.put<number[]>(`/delivery-guys/${deliveryGuyId}/restaurants`, { restaurantIds })
    return data
  },
}
