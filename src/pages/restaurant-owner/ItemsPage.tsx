import { useEffect, useState } from 'react'
import { Pencil, Plus, UtensilsCrossed } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Badge, EmptyState, LoadingBlock } from '@/components/ui/Feedback'
import { Select, Switch } from '@/components/ui/FormControls'
import { Modal } from '@/components/ui/Modal'
import { DataTable, type Column } from '@/components/DataTable'
import { ItemForm } from '@/components/items/ItemForm'
import { useAsync } from '@/hooks/useAsync'
import { useAuth } from '@/hooks/useAuth'
import { restaurantService } from '@/services/restaurantService'
import { itemService } from '@/services/itemService'
import { ownerItemCategoryService, ownerAddonCategoryService } from '@/services/simpleServices'
import { formatCurrency } from '@/lib/format'
import type { Item } from '@/types/entities'

const emptyItem = (restaurantId: number): Partial<Item> => ({
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

export default function OwnerItemsPage() {
  const { user } = useAuth()
  const { data: restaurantPage, isLoading: loadingRestaurants } = useAsync(() => restaurantService.listByOwner(user!.id, { perPage: 50 }), [user?.id])
  const restaurants = restaurantPage?.data ?? []
  const [restaurantId, setRestaurantId] = useState<number | null>(null)

  useEffect(() => {
    if (!restaurantId && restaurants.length > 0) setRestaurantId(restaurants[0].id)
  }, [restaurants, restaurantId])

  const { data: itemCategories } = useAsync(() => ownerItemCategoryService.list(user!.id), [user?.id])
  const { data: addonCategories } = useAsync(() => ownerAddonCategoryService.list(user!.id), [user?.id])

  const { data: items, isLoading: loadingItems, reload } = useAsync(
    () => (restaurantId ? itemService.listByRestaurant(restaurantId) : Promise.resolve(null)),
    [restaurantId],
  )

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Item | null>(null)
  const [values, setValues] = useState<Partial<Item>>({})
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<number | null>(null)

  function openCreate() {
    if (!restaurantId) return
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
    if (!restaurantId) return
    setSaving(true)
    setSaveError(null)
    try {
      if (editing) {
        await itemService.updateAsOwner(editing.id, values)
      } else {
        await itemService.createForOwner(restaurantId, values)
      }
      setFormOpen(false)
      reload()
    } catch (err) {
      setSaveError((err as { message?: string })?.message ?? 'Unable to save item')
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(row: Item) {
    setTogglingId(row.id)
    try {
      await itemService.toggleActiveAsOwner(row.id, !row.isActive)
      reload()
    } finally {
      setTogglingId(null)
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
    { key: 'category', header: 'Category', render: (row) => (itemCategories ?? []).find((c) => c.id === row.itemCategoryId)?.name ?? '—' },
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
    {
      key: 'status',
      header: 'Active',
      render: (row) => <Switch checked={row.isActive} onChange={() => toggleActive(row)} disabled={togglingId === row.id} />,
    },
    {
      key: 'actions',
      header: '',
      className: 'px-4 py-3 text-right',
      render: (row) => (
        <button className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300" onClick={(e) => { e.stopPropagation(); openEdit(row) }}>
          <Pencil size={15} />
        </button>
      ),
    },
  ]

  if (loadingRestaurants) return <LoadingBlock />
  if (restaurants.length === 0) return <EmptyState title="No restaurant assigned" />
  if (!restaurantId) return null

  const scopedRestaurant = restaurants.find((r) => r.id === restaurantId)

  return (
    <div>
      <PageHeader
        title={scopedRestaurant ? `Items — ${scopedRestaurant.name}` : 'Items'}
        description="Menu items available for ordering. Only active items are shown here — this mirrors what customers see."
        actions={
          <>
            {restaurants.length > 1 && (
              <Select value={restaurantId} onChange={(e) => setRestaurantId(Number(e.target.value))} className="w-56">
                {restaurants.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </Select>
            )}
            <button className="btn-primary" onClick={openCreate}>
              <Plus size={16} /> Add Item
            </button>
          </>
        }
      />

      <DataTable columns={columns} rows={items?.data ?? []} rowKey={(row) => row.id} isLoading={loadingItems} emptyTitle="No items found" />

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
        <ItemForm
          values={values}
          onChange={handleChange}
          showRestaurantPicker={false}
          itemCategoryOptions={itemCategories ?? []}
          addonCategoryOptions={addonCategories ?? []}
        />
      </Modal>
    </div>
  )
}
