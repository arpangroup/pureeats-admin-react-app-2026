import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ExternalLink, Pencil, Star, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { SearchInput, Field, TextInput, Textarea } from '@/components/ui/FormControls'
import { Badge } from '@/components/ui/Feedback'
import { DataTable, type Column } from '@/components/DataTable'
import { SlideOver } from '@/components/ui/SlideOver'
import { ConfirmDialog } from '@/components/ui/Modal'
import { useAsync } from '@/hooks/useAsync'
import { useDebounce } from '@/hooks/useDebounce'
import { ratingService, type RatingRow } from '@/services/ratingService'
import { users } from '@/mocks/fixtures'
import { formatDate } from '@/lib/format'
import { deliveryGuyDetailPath, restaurantDetailPath, userDetailPath } from '@/lib/routes'

export default function RatingsPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)
  const params = useMemo(() => ({ page, perPage: 10, search: debouncedSearch }), [page, debouncedSearch])
  const { data, isLoading, reload } = useAsync(() => ratingService.list(params), [params])

  const [editing, setEditing] = useState<RatingRow | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<RatingRow | null>(null)
  const [deleting, setDeleting] = useState(false)

  function subjectPath(row: RatingRow): string | null {
    if (row.rateableType === 'restaurant') return restaurantDetailPath(row.rateableId)
    if (row.rateableType === 'delivery-guy') return deliveryGuyDetailPath(row.rateableId)
    return null
  }

  function reviewerPath(row: RatingRow): string | null {
    const reviewer = users.find((u) => u.id === row.userId)
    return reviewer ? userDetailPath(reviewer) : null
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await ratingService.remove(deleteTarget.id)
      setDeleteTarget(null)
      reload()
    } finally {
      setDeleting(false)
    }
  }

  const columns: Column<RatingRow>[] = [
    {
      key: 'rating',
      header: 'Rating',
      render: (row) => (
        <span className="inline-flex items-center gap-1 font-medium text-slate-700 dark:text-slate-200">
          <Star size={14} className="fill-amber-400 text-amber-400" /> {row.rating}
        </span>
      ),
    },
    {
      key: 'subject',
      header: 'For',
      render: (row) => {
        const path = subjectPath(row)
        return (
          <div>
            {path ? (
              <button
                className="font-medium text-brand-600 hover:underline dark:text-brand-400"
                onClick={(e) => { e.stopPropagation(); navigate(path) }}
              >
                {row.subjectName}
              </button>
            ) : (
              <p className="font-medium text-slate-800 dark:text-slate-100">{row.subjectName}</p>
            )}
            <p className="text-xs capitalize text-slate-400 dark:text-slate-500">{row.rateableType.replace('-', ' ')}</p>
          </div>
        )
      },
    },
    {
      key: 'by',
      header: 'By',
      render: (row) => {
        const path = reviewerPath(row)
        return path ? (
          <button
            className="text-brand-600 hover:underline dark:text-brand-400"
            onClick={(e) => { e.stopPropagation(); navigate(path) }}
          >
            {row.name}
          </button>
        ) : (
          <span className="text-slate-700 dark:text-slate-300">{row.name}</span>
        )
      },
    },
    {
      key: 'comment',
      header: 'Comment',
      render: (row) => (
        <div>
          <button
            className="flex items-start gap-1 text-left text-slate-600 hover:text-brand-600 dark:text-slate-300 dark:hover:text-brand-400"
            title="View order"
            onClick={(e) => { e.stopPropagation(); navigate(`/admin/orders/${row.orderId}`) }}
          >
            <span>{row.comment}</span>
            <ExternalLink size={12} className="mt-0.5 shrink-0" />
          </button>
          <div className="mt-1 flex flex-wrap gap-1">
            {row.tags.map((tag) => (
              <Badge key={tag} tone="slate">{tag}</Badge>
            ))}
          </div>
        </div>
      ),
    },
    { key: 'date', header: 'Date', render: (row) => formatDate(row.createdAt) },
    {
      key: 'actions',
      header: '',
      className: 'px-4 py-3 text-right',
      render: (row) => (
        <div className="flex justify-end gap-1">
          <button
            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
            onClick={(e) => { e.stopPropagation(); setEditing(row) }}
            aria-label="Edit review"
          >
            <Pencil size={15} />
          </button>
          <button
            className="rounded-md p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10 dark:hover:text-rose-400"
            onClick={(e) => { e.stopPropagation(); setDeleteTarget(row) }}
            aria-label="Delete review"
          >
            <Trash2 size={15} />
          </button>
        </div>
      ),
    },
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

      <EditRatingPanel rating={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); reload() }} />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete review"
        description="This action can't be undone."
        confirmLabel="Delete"
        danger
        isBusy={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  )
}

function EditRatingPanel({ rating, onClose, onSaved }: { rating: RatingRow | null; onClose: () => void; onSaved: () => void }) {
  const [score, setScore] = useState(rating?.rating ?? 5)
  const [comment, setComment] = useState(rating?.comment ?? '')
  const [tagsInput, setTagsInput] = useState(rating?.tags.join(', ') ?? '')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!rating) return
    setSaving(true)
    try {
      await ratingService.update(rating.id, {
        rating: score,
        comment,
        tags: tagsInput.split(',').map((t) => t.trim()).filter(Boolean),
      })
      onSaved()
    } finally {
      setSaving(false)
    }
  }

  return (
    <SlideOver
      key={rating?.id ?? 'closed'}
      open={!!rating}
      onClose={onClose}
      title="Edit review"
      description={rating ? `${rating.subjectName} · reviewed by ${rating.name}` : undefined}
      footer={
        <>
          <button className="btn-secondary" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button>
        </>
      }
    >
      {rating && (
        <div className="space-y-4">
          <Field label="Rating (1–5)" required>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setScore(n)}
                  className="rounded p-0.5"
                  aria-label={`${n} star${n !== 1 ? 's' : ''}`}
                >
                  <Star size={22} className={n <= score ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-600'} />
                </button>
              ))}
            </div>
          </Field>
          <Field label="Comment">
            <Textarea value={comment} onChange={(e) => setComment(e.target.value)} />
          </Field>
          <Field label="Tags" hint="Comma-separated, e.g. Tasty, On time">
            <TextInput value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} />
          </Field>
        </div>
      )}
    </SlideOver>
  )
}
