// Shared shapes used across every service response, mock or live.
// Keeping list endpoints paginated from day one means swapping the mock
// implementation for a real paged Spring Boot endpoint needs no UI change.

export interface Paginated<T> {
  data: T[]
  page: number
  perPage: number
  total: number
  totalPages: number
}

export interface ListParams {
  page?: number
  perPage?: number
  search?: string
  sortBy?: string
  sortDir?: 'asc' | 'desc'
  filters?: Record<string, string | number | boolean | undefined>
}

export type Id = number

export type UserRole = 'admin' | 'employee' | 'restaurant-owner' | 'delivery-guy' | 'customer'

export interface ApiError {
  message: string
  status?: number
  fieldErrors?: Record<string, string>
}
