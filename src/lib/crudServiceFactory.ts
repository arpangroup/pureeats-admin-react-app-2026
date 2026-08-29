import { apiClient } from './apiClient'
import { mockDelay, nextMockId, paginate } from './mockUtils'
import { toPaginated, type PageResponse } from './pageResponse'
import { IS_MOCK } from '@/config/env'
import type { ListParams, Paginated } from '@/types/common'

/** Translates the frontend's 1-indexed ListParams into the query params every /admin/* list endpoint expects. */
function toListQuery(params: ListParams): Record<string, unknown> {
  const { page, perPage, filters, ...rest } = params
  return {
    ...rest,
    ...filters,
    page: (page ?? 1) - 1,
    size: perPage ?? 10,
  }
}

/**
 * Builds a standard list/get/create/update/remove service for one entity.
 *
 * In mock mode it operates on the in-memory fixture array (imported by
 * reference, mutated in place so creates/edits/deletes are visible
 * immediately across the app for the rest of the session).
 *
 * In live mode every method calls the matching REST endpoint under
 * `apiPath` on the future Spring Boot API. Pages that use this factory's
 * output never need to change when DATA_SOURCE flips from mock to live —
 * only this file's `if (IS_MOCK)` branches run differently.
 */
export function createCrudService<T extends { id: number }>(
  mockStore: T[],
  apiPath: string,
  searchableFields: (keyof T)[] = [],
) {
  return {
    async list(params: ListParams = {}): Promise<Paginated<T>> {
      if (IS_MOCK) {
        await mockDelay()
        return paginate(mockStore, params, searchableFields)
      }
      const { data } = await apiClient.get<{ data: PageResponse<T> }>(apiPath, { params: toListQuery(params) })
      return toPaginated(data.data)
    },

    async listAll(): Promise<T[]> {
      if (IS_MOCK) {
        await mockDelay()
        return [...mockStore]
      }
      const { data } = await apiClient.get<{ data: T[] }>(`${apiPath}/all`)
      return data.data
    },

    async get(id: number): Promise<T | undefined> {
      if (IS_MOCK) {
        await mockDelay()
        return mockStore.find((row) => row.id === id)
      }
      const { data } = await apiClient.get<{ data: T }>(`${apiPath}/${id}`)
      return data.data
    },

    async create(payload: Partial<T>): Promise<T> {
      if (IS_MOCK) {
        await mockDelay()
        const record = { ...payload, id: nextMockId() } as T
        mockStore.unshift(record)
        return record
      }
      const { data } = await apiClient.post<{ data: T }>(apiPath, payload)
      return data.data
    },

    async update(id: number, payload: Partial<T>): Promise<T> {
      if (IS_MOCK) {
        await mockDelay()
        const index = mockStore.findIndex((row) => row.id === id)
        if (index === -1) throw { message: 'Record not found' }
        mockStore[index] = { ...mockStore[index], ...payload }
        return mockStore[index]
      }
      const { data } = await apiClient.put<{ data: T }>(`${apiPath}/${id}`, payload)
      return data.data
    },

    async remove(id: number): Promise<void> {
      if (IS_MOCK) {
        await mockDelay()
        const index = mockStore.findIndex((row) => row.id === id)
        if (index !== -1) mockStore.splice(index, 1)
        return
      }
      await apiClient.delete(`${apiPath}/${id}`)
    },
  }
}
