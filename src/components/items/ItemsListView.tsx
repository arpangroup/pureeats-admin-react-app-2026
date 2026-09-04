import { useMemo, useState } from 'react'
import { Pencil, Plus, Trash2, UploadCloud, UtensilsCrossed } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { SearchInput } from '@/components/ui/FormControls'
import { ActiveBadge, Badge } from '@/components/ui/Feedback'
import { Modal, ConfirmDialog } from '@/components/ui/Modal'
import { DataTable, type Column } from '@/components/DataTable'
import { useAsync } from '@/hooks/useAsync'
import { useDebounce } from '@/hooks/useDebounce'
import { itemService } from '@/services/itemService'
import { itemCategories, restaurants } from '@/mocks/fixtures'
import { formatCurrency } from '@/lib/format'
import type { Item } from '@/types/entities'
import { ItemForm } from './ItemForm'
import { ItemBulkUploadForm } from './ItemBulkUploadForm'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { SlideOver } from '../ui/SlideOver'

const emptyItem = (restaurantId?: number): Partial<Item> => ({
  restaurantId,
  itemCategoryId: undefined,
  name: '',
  desc: '',
  price: 0,
  oldPrice: null,
  isActive: true,
  isVeg: true,
  isRecommended: false,
  isPopular: false,
  isNew: false,
  addonCategoryIds: [],
  image: '',
  placeholderImage: '',
})

export function ItemsListView({ restaurantId }: { restaurantId?: number }) {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const scopedRestaurant = restaurantId ? restaurants.find((r) => r.id === restaurantId) : undefined
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)  
  const [bulkUploadOpen, setBulkUploadOpen] = useState(searchParams.get('bulkUpload') === '1')

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Item | null>(null)
  const [values, setValues] = useState<Partial<Item>>(emptyItem(restaurantId))
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Item | null>(null)
  const [deleting, setDeleting] = useState(false)

  const params = useMemo(() => ({ page, perPage: 10, search: debouncedSearch, filters: restaurantId ? { restaurantId } : {} }), [page, debouncedSearch, restaurantId])
  const { data, isLoading, reload } = useAsync(() => itemService.list(params), [params])

  function openCreate() {
    setEditing(null)
    setValues(emptyItem(restaurantId))
    setSaveError(null)
    setFormOpen(true)
  }

  function openEdit(row: Item) {
    setEditing(row)
    setValues(row)
    setSaveError(null)
    setFormOpen(true)
  }

  function handleChange<K extends keyof Item>(key: K, value: Item[K]) {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSave() {
    setSaving(true)
    setSaveError(null)
    try {
      if (editing) {
        await itemService.update(editing.id, values)
      } else {
        await itemService.create(values)
      }
      setFormOpen(false)
      reload()
    } catch (err) {
      setSaveError((err as { message?: string })?.message ?? 'Unable to save item')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await itemService.remove(deleteTarget.id)
      setDeleteTarget(null)
      reload()
    } finally {
      setDeleting(false)
    }
  }

  function closeBulkUpload() {
    setBulkUploadOpen(false)
    if (searchParams.get('bulkUpload')) {
      const next = new URLSearchParams(searchParams)
      next.delete('bulkUpload')
      setSearchParams(next)
    }
  }

  const columns: Column<Item>[] = [
    {
      key: 'thumbnail',
      header: '',
      className: 'w-14 px-4 py-2',
      render: (row) =>
        row.image ? (
          <img src={row.image} alt="" className="h-10 w-10 rounded-lg object-cover" />
        ) : (
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-300 dark:bg-slate-800 dark:text-slate-600">
            <UtensilsCrossed size={16} />
          </span>
        ),
    },
    { key: 'name', header: 'Item', render: (row) => <span className="font-medium text-slate-800 dark:text-slate-100">{row.name}</span> },
    ...(restaurantId
      ? []
      : [{ key: 'restaurant', header: 'Restaurant', render: (row: Item) => restaurants.find((r) => r.id === row.restaurantId)?.name ?? '—' } as Column<Item>]),
    { key: 'category', header: 'Category', render: (row) => itemCategories.find((c) => c.id === row.itemCategoryId)?.name ?? '—' },
    {
      key: 'price',
      header: 'Price',
      render: (row) => (
        <span>
          {formatCurrency(row.price)}
          {row.oldPrice && <span className="ml-1.5 text-xs text-slate-400 line-through">{formatCurrency(row.oldPrice)}</span>}
        </span>
      ),
    },
    {
      key: 'tags',
      header: 'Tags',
      render: (row) => (
        <div className="flex flex-wrap gap-1">
          {row.isVeg ? <Badge tone="green">Veg</Badge> : <Badge tone="red">Non-veg</Badge>}
          {row.isPopular && <Badge tone="amber">Popular</Badge>}
          {row.isNew && <Badge tone="blue">New</Badge>}
        </div>
      ),
    },
    { key: 'status', header: 'Status', render: (row) => <ActiveBadge active={row.isActive} /> },
    {
      key: 'actions',
      header: '',
      className: 'px-4 py-3 text-right',
      render: (row) => (
        <div className="flex justify-end gap-1">
          <button className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300" onClick={(e) => { e.stopPropagation(); openEdit(row) }}>
            <Pencil size={15} />
          </button>
          <button className="rounded-md p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10 dark:hover:text-rose-400" onClick={(e) => { e.stopPropagation(); setDeleteTarget(row) }}>
            <Trash2 size={15} />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title={scopedRestaurant ? `Items — ${scopedRestaurant.name}` : 'Items'}
        description={scopedRestaurant ? `Menu items for ${scopedRestaurant.name}.` : 'Menu items available for ordering.'}
        actions={
          <>          
            <button
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-sky-200 bg-sky-50 px-3.5 py-2 text-sm font-medium text-sky-700 transition-colors hover:bg-sky-100 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-400 dark:hover:bg-sky-500/20"
              onClick={() => setBulkUploadOpen(true)}
            >
              <UploadCloud size={16} /> Bulk Upload
            </button>

            
            <button className="btn-primary" onClick={openCreate}>
              <Plus size={16} /> Add Item
            </button>
          </>
        }
      />

      <div className="mb-3">
        <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1) }} placeholder="Search items…" />
      </div>

      <DataTable
        columns={columns}
        rows={data?.data ?? []}
        rowKey={(row) => row.id}
        isLoading={isLoading}
        emptyTitle="No items found"
        pagination={data ?? undefined}
        onPageChange={setPage}
      />

      <Modal
        open={formOpen}
        onClose={() => { setFormOpen(false); setSaveError(null) }}
        title={editing ? 'Edit Item' : 'Add Item'}
        size="lg"
        footer={
          <>
            <button className="btn-secondary" onClick={() => { setFormOpen(false); setSaveError(null) }} disabled={saving}>Cancel</button>
            <button className="btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save item'}</button>
          </>
        }
      >
        {saveError && (
          <p className="mb-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">{saveError}</p>
        )}
        <ItemForm values={values} onChange={handleChange} showRestaurantPicker={!restaurantId} />
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete item"
        description="This action can't be undone."
        confirmLabel="Delete"
        danger
        isBusy={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />


      <SlideOver
        open={bulkUploadOpen}
        onClose={closeBulkUpload}
        title="Bulk CSV Upload"
        description={scopedRestaurant ? `Create multiple items for ${scopedRestaurant.name} from a CSV file.` : 'Create multiple items at once from a CSV file.'}
        width="lg"
      >
        <ItemBulkUploadForm restaurantId={restaurantId} onImported={reload} />
      </SlideOver>
    </div>
  )
}
