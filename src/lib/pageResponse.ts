import type { Paginated } from '@/types/common'

/** Raw shape returned by Spring Data's Page<T> (0-indexed page), wrapped in every admin list response. */
export interface PageResponse<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

/** Adapts the backend's 0-indexed PageResponse into the frontend's 1-indexed Paginated shape. */
export function toPaginated<T>(response: PageResponse<T>): Paginated<T> {
  return {
    data: response.content,
    page: response.page + 1,
    perPage: response.size,
    total: response.totalElements,
    totalPages: response.totalPages,
  }
}
