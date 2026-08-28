import { ChevronLeft, ChevronRight } from 'lucide-react'

export function Pagination({
  page,
  totalPages,
  total,
  perPage,
  onPageChange,
}: {
  page: number
  totalPages: number
  total: number
  perPage: number
  onPageChange: (page: number) => void
}) {
  if (total === 0) return null
  const start = (page - 1) * perPage + 1
  const end = Math.min(page * perPage, total)

  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 sm:flex-row">
      <p className="text-sm text-slate-500">
        Showing <span className="font-medium text-slate-700">{start}</span>–
        <span className="font-medium text-slate-700">{end}</span> of{' '}
        <span className="font-medium text-slate-700">{total}</span>
      </p>
      <div className="flex items-center gap-1">
        <button
          className="btn-ghost px-2"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="Previous page"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="px-2 text-sm text-slate-600">
          Page {page} of {totalPages}
        </span>
        <button
          className="btn-ghost px-2"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          aria-label="Next page"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}
