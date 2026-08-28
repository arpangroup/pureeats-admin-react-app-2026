import { useMemo, useState } from 'react'
import { Star } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { SearchInput } from '@/components/ui/FormControls'
import { Badge } from '@/components/ui/Feedback'
import { DataTable, type Column } from '@/components/DataTable'
import { useAsync } from '@/hooks/useAsync'
import { useDebounce } from '@/hooks/useDebounce'
import { ratingService, type RatingRow } from '@/services/ratingService'
import { formatDate } from '@/lib/format'

export default function RatingsPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)
  const params = useMemo(() => ({ page, perPage: 10, search: debouncedSearch }), [page, debouncedSearch])
  const { data, isLoading } = useAsync(() => ratingService.list(params), [params])

  const columns: Column<RatingRow>[] = [
    {
      key: 'rating',
      header: 'Rating',
      render: (row) => (
        <span className="inline-flex items-center gap-1 font-medium text-slate-700">
          <Star size={14} className="fill-amber-400 text-amber-400" /> {row.rating}
        </span>
      ),
    },
    {
      key: 'subject',
      header: 'For',
      render: (row) => (
        <div>
          <p className="font-medium text-slate-800">{row.subjectName}</p>
          <p className="text-xs capitalize text-slate-400">{row.rateableType.replace('-', ' ')}</p>
        </div>
      ),
    },
    { key: 'by', header: 'By', render: (row) => row.name },
    {
      key: 'comment',
      header: 'Comment',
      render: (row) => (
        <div>
          <p className="text-slate-600">{row.comment}</p>
          <div className="mt-1 flex flex-wrap gap-1">
            {row.tags.map((tag) => (
              <Badge key={tag} tone="slate">{tag}</Badge>
            ))}
          </div>
        </div>
      ),
    },
    { key: 'date', header: 'Date', render: (row) => formatDate(row.createdAt) },
  ]

  return (
    <div>
      <PageHeader title="Ratings" description="Reviews left by customers for restaurants and delivery partners." />
      <div className="mb-3">
        <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1) }} placeholder="Search ratings…" />
      </div>
      <DataTable
        columns={columns}
        rows={data?.data ?? []}
        rowKey={(row) => row.id}
        isLoading={isLoading}
        emptyTitle="No ratings found"
        pagination={data ?? undefined}
        onPageChange={setPage}
      />
    </div>
  )
}
