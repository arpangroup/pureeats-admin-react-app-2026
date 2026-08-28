import type { ReactNode } from 'react'
import { EmptyState, LoadingBlock } from '@/components/ui/Feedback'
import { Pagination } from '@/components/ui/Pagination'
import type { Paginated } from '@/types/common'

export interface Column<T> {
  key: string
  header: string
  render: (row: T) => ReactNode
  className?: string
}

interface DataTableProps<T> {
  columns: Column<T>[]
  rows: T[]
  rowKey: (row: T) => string | number
  isLoading?: boolean
  emptyTitle?: string
  emptyDescription?: string
  pagination?: Pick<Paginated<T>, 'page' | 'perPage' | 'total' | 'totalPages'>
  onPageChange?: (page: number) => void
  onRowClick?: (row: T) => void
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  isLoading,
  emptyTitle,
  emptyDescription,
  pagination,
  onPageChange,
  onRowClick,
}: DataTableProps<T>) {
  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
            <tr>
              {columns.map((col) => (
                <th key={col.key} className={col.className ?? 'px-4 py-3 font-medium'}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {!isLoading &&
              rows.map((row) => (
                <tr
                  key={rowKey(row)}
                  onClick={() => onRowClick?.(row)}
                  className={onRowClick ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60' : undefined}
                >
                  {columns.map((col) => (
                    <td key={col.key} className={col.className ?? 'px-4 py-3 text-slate-700 dark:text-slate-300'}>
                      {col.render(row)}
                    </td>
                  ))}
                </tr>
              ))}
          </tbody>
        </table>
        {isLoading && <LoadingBlock />}
        {!isLoading && rows.length === 0 && (
          <EmptyState title={emptyTitle ?? 'No records found'} description={emptyDescription} />
        )}
      </div>
      {pagination && onPageChange && !isLoading && rows.length > 0 && (
        <Pagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          total={pagination.total}
          perPage={pagination.perPage}
          onPageChange={onPageChange}
        />
      )}
    </div>
  )
}
