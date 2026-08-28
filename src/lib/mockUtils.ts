import { MOCK_DELAY_MS } from '@/config/env'
import type { ListParams, Paginated } from '@/types/common'

/** Simulated network latency so loading states are visible in mock mode. */
export function mockDelay(ms: number = MOCK_DELAY_MS): Promise<void> {
  if (!ms) return Promise.resolve()
  return new Promise((resolve) => setTimeout(resolve, ms))
}

let nextId = 100000
/** Generates ids for records created in mock mode (session-scoped). */
export function nextMockId(): number {
  nextId += 1
  return nextId
}

/**
 * Applies search/sort/pagination to an in-memory array the same way a
 * real paginated list endpoint would, so ResourceListPage and friends
 * work identically against mock arrays and live API pages.
 */
export function paginate<T extends { id: number }>(
  records: T[],
  params: ListParams,
  searchableFields: (keyof T)[] = [],
): Paginated<T> {
  let rows = [...records]

  if (params.search) {
    const q = params.search.trim().toLowerCase()
    if (q) {
      rows = rows.filter((row) =>
        searchableFields.some((field) => String(row[field] ?? '').toLowerCase().includes(q)),
      )
    }
  }

  if (params.filters) {
    for (const [key, value] of Object.entries(params.filters)) {
      if (value === undefined || value === '' || value === 'all') continue
      rows = rows.filter((row) => String((row as Record<string, unknown>)[key]) === String(value))
    }
  }

  if (params.sortBy) {
    const { sortBy, sortDir = 'asc' } = params
    rows.sort((a, b) => {
      const av = (a as Record<string, unknown>)[sortBy] as string | number
      const bv = (b as Record<string, unknown>)[sortBy] as string | number
      if (av === bv) return 0
      const result = av > bv ? 1 : -1
      return sortDir === 'asc' ? result : -result
    })
  }

  const page = params.page ?? 1
  const perPage = params.perPage ?? 10
  const total = rows.length
  const totalPages = Math.max(1, Math.ceil(total / perPage))
  const start = (page - 1) * perPage

  return {
    data: rows.slice(start, start + perPage),
    page,
    perPage,
    total,
    totalPages,
  }
}
