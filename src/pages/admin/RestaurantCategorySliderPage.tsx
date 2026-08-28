import { useMemo, useState } from 'react'
import { Images, Pencil, Plus, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { SearchInput, Field, TextInput, Switch } from '@/components/ui/FormControls'
import { ActiveBadge } from '@/components/ui/Feedback'
import { Modal, ConfirmDialog } from '@/components/ui/Modal'
import { DataTable, type Column } from '@/components/DataTable'
import { SlideManagerPanel } from '@/components/content/SlideManagerPanel'
import { useAsync } from '@/hooks/useAsync'
import { useDebounce } from '@/hooks/useDebounce'
import { restaurantCategorySliderService, slideService } from '@/services/simpleServices'
import type { RestaurantCategorySlider } from '@/types/entities'

const emptySlider: Partial<RestaurantCategorySlider> = { isActive: true }

export default function RestaurantCategorySliderPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)
  const params = useMemo(() => ({ page, perPage: 10, search: debouncedSearch }), [page, debouncedSearch])
  const { data, isLoading, reload } = useAsync(() => restaurantCategorySliderService.list(params), [params])
  const { data: slideCounts, reload: reloadCounts } = useAsync(() => slideService.countsBySlider('category'), [])

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<RestaurantCategorySlider | null>(null)
  const [values, setValues] = useState<Partial<RestaurantCategorySlider>>(emptySlider)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<RestaurantCategorySlider | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [managing, setManaging] = useState<RestaurantCategorySlider | null>(null)

  function openCreate() {
    setEditing(null)
    setValues(emptySlider)
    setFormOpen(true)
  }

  function openEdit(row: RestaurantCategorySlider) {
    setEditing(row)
    setValues(row)
    setFormOpen(true)
  }

  async function handleSave() {
    setSaving(true)
    try {
      const now = new Date().toISOString()
      if (editing) {
        await restaurantCategorySliderService.update(editing.id, values)
      } else {
        await restaurantCategorySliderService.create({ ...values, createdAt: now, updatedAt: now })
      }
      setFormOpen(false)
      reload()
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const orphaned = await slideService.forSlider('category', deleteTarget.id)
      await Promise.all(orphaned.map((s) => slideService.remove(s.id)))
      await restaurantCategorySliderService.remove(deleteTarget.id)
      setDeleteTarget(null)
      reload()
      reloadCounts()
    } finally {
      setDeleting(false)
    }
  }

  const columns: Column<RestaurantCategorySlider>[] = [
    { key: 'name', header: 'Name', render: (row) => <span className="font-medium text-slate-800 dark:text-slate-100">{row.name}</span> },
    {
      key: 'slides',
      header: 'Slides',
      render: (row) => (
        <span className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-300">
          <Images size={13} /> {slideCounts?.[row.id] ?? 0}
        </span>
      ),
    },
    { key: 'status', header: 'Status', render: (row) => <ActiveBadge active={row.isActive} /> },
    {
      key: 'actions',
      header: '',
      className: 'px-4 py-3 text-right',
      render: (row) => (
        <div className="flex justify-end gap-1">
          <button className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300" onClick={(e) => { e.stopPropagation(); openEdit(row) }} aria-label="Edit slider">
            <Pencil size={15} />
          </button>
          <button className="rounded-md p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10 dark:hover:text-rose-400" onClick={(e) => { e.stopPropagation(); setDeleteTarget(row) }} aria-label="Delete slider">
            <Trash2 size={15} />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Store Category Sliders"
        description="Curated groups of store categories shown on the homepage — click a slider to manage its slides."
        actions={
          <button className="btn-primary" onClick={openCreate}>
            <Plus size={16} /> Add Slider
          </button>
        }
      />

      <div className="mb-3">
        <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1) }} placeholder="Search sliders…" />
      </div>

      <DataTable
        columns={columns}
        rows={data?.data ?? []}
        rowKey={(row) => row.id}
        isLoading={isLoading}
        emptyTitle="No sliders found"
        pagination={data ?? undefined}
        onPageChange={setPage}
        onRowClick={setManaging}
      />

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? 'Edit Slider' : 'Add Slider'}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setFormOpen(false)} disabled={saving}>Cancel</button>
            <button className="btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Slider name" required>
            <TextInput value={values.name ?? ''} onChange={(e) => setValues((p) => ({ ...p, name: e.target.value }))} />
          </Field>
          <div>
            <span className="label">Active</span>
            <Switch checked={!!values.isActive} onChange={(v) => setValues((p) => ({ ...p, isActive: v }))} />
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete slider"
        description="This action can't be undone. Its slides will also be removed."
        confirmLabel="Delete"
        danger
        isBusy={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />

      <SlideManagerPanel
        open={!!managing}
        onClose={() => setManaging(null)}
        sliderType="category"
        sliderId={managing?.id ?? null}
        sliderName={managing?.name ?? ''}
        onSlidesChanged={reloadCounts}
      />
    </div>
  )
}
