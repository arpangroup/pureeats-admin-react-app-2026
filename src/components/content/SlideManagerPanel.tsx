import { useState } from 'react'
import { Image as ImageIcon, Link2, Pencil, Plus, Store, Tag, Trash2 } from 'lucide-react'
import { SlideOver } from '@/components/ui/SlideOver'
import { Modal, ConfirmDialog } from '@/components/ui/Modal'
import { Badge, EmptyState, LoadingBlock } from '@/components/ui/Feedback'
import { SlideForm } from './SlideForm'
import { useAsync } from '@/hooks/useAsync'
import { slideService } from '@/services/simpleServices'
import { restaurantCategories, restaurants } from '@/mocks/fixtures'
import { nextMockId } from '@/lib/mockUtils'
import type { Slide } from '@/types/entities'

const emptySlide = (sliderType: Slide['sliderType'], sliderId: number, nextPosition: number): Partial<Slide> => ({
  sliderType,
  sliderId,
  name: '',
  description: '',
  image: '',
  imagePlaceholder: '',
  linkType: 'none',
  categoryId: null,
  restaurantId: null,
  url: null,
  positionId: nextPosition,
  isActive: true,
})

function linkLabel(slide: Slide): string {
  if (slide.linkType === 'category') return restaurantCategories.find((c) => c.id === slide.categoryId)?.name ?? 'Category'
  if (slide.linkType === 'restaurant') return restaurants.find((r) => r.id === slide.restaurantId)?.name ?? 'Restaurant'
  if (slide.linkType === 'url') return slide.url ?? 'URL'
  return 'No link'
}

export function SlideManagerPanel({
  open,
  onClose,
  sliderType,
  sliderId,
  sliderName,
  onSlidesChanged,
}: {
  open: boolean
  onClose: () => void
  sliderType: Slide['sliderType']
  sliderId: number | null
  sliderName: string
  onSlidesChanged?: () => void
}) {
  const { data: slidesList, isLoading, reload } = useAsync(
    () => (sliderId ? slideService.forSlider(sliderType, sliderId) : Promise.resolve([])),
    [sliderType, sliderId],
  )

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Slide | null>(null)
  const [values, setValues] = useState<Partial<Slide>>({})
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Slide | null>(null)
  const [deleting, setDeleting] = useState(false)

  function openCreate() {
    if (!sliderId) return
    setEditing(null)
    setValues(emptySlide(sliderType, sliderId, (slidesList?.length ?? 0) + 1))
    setSaveError(null)
    setFormOpen(true)
  }

  function openEdit(slide: Slide) {
    setEditing(slide)
    setValues(slide)
    setSaveError(null)
    setFormOpen(true)
  }

  function handleChange<K extends keyof Slide>(key: K, value: Slide[K]) {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSave() {
    setSaving(true)
    setSaveError(null)
    try {
      if (editing) {
        await slideService.update(editing.id, values)
      } else {
        const now = new Date().toISOString()
        await slideService.create({
          ...values,
          uniqueId: `slide-${nextMockId()}`,
          createdAt: now,
          updatedAt: now,
        })
      }
      setFormOpen(false)
      reload()
      onSlidesChanged?.()
    } catch (err) {
      setSaveError((err as { message?: string })?.message ?? 'Unable to save slide')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await slideService.remove(deleteTarget.id)
      setDeleteTarget(null)
      reload()
      onSlidesChanged?.()
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <SlideOver
        open={open}
        onClose={onClose}
        title={sliderName}
        description="Manage the individual slides shown in this slider."
        width="lg"
        footer={
          <button className="btn-primary w-full" onClick={openCreate}>
            <Plus size={16} /> Add Slide
          </button>
        }
      >
        {isLoading ? (
          <LoadingBlock />
        ) : !slidesList || slidesList.length === 0 ? (
          <EmptyState icon={<ImageIcon size={22} />} title="No slides yet" description="Add the first slide for this slider." />
        ) : (
          <div className="space-y-2">
            {slidesList.map((slide) => (
              <div key={slide.id} className="flex items-center gap-3 rounded-lg border border-slate-100 p-2.5 dark:border-slate-800">
                {slide.image ? (
                  <img src={slide.image} alt="" className="h-14 w-20 shrink-0 rounded-md object-cover" />
                ) : (
                  <span className="flex h-14 w-20 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-300 dark:bg-slate-800 dark:text-slate-600">
                    <ImageIcon size={20} />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-slate-800 dark:text-slate-100">{slide.name}</p>
                  <p className="truncate text-xs text-slate-400 dark:text-slate-500">{slide.description || 'No description'}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    <Badge tone={slide.isActive ? 'green' : 'slate'}>{slide.isActive ? 'Active' : 'Inactive'}</Badge>
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 dark:text-slate-500">
                      {slide.linkType === 'category' && <Tag size={11} />}
                      {slide.linkType === 'restaurant' && <Store size={11} />}
                      {slide.linkType === 'url' && <Link2 size={11} />}
                      {linkLabel(slide)}
                    </span>
                  </div>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button
                    className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
                    onClick={() => openEdit(slide)}
                    aria-label="Edit slide"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    className="rounded-md p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10 dark:hover:text-rose-400"
                    onClick={() => setDeleteTarget(slide)}
                    aria-label="Delete slide"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </SlideOver>

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? 'Edit Slide' : 'Add Slide'}
        size="lg"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setFormOpen(false)} disabled={saving}>Cancel</button>
            <button className="btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save slide'}</button>
          </>
        }
      >
        {saveError && (
          <p className="mb-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">{saveError}</p>
        )}
        <SlideForm values={values} onChange={handleChange} />
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete slide"
        description="This action can't be undone."
        confirmLabel="Delete"
        danger
        isBusy={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </>
  )
}
