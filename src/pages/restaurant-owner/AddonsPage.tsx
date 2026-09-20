import { useState } from 'react'
import { Plus } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { LoadingBlock } from '@/components/ui/Feedback'
import { Field, Select, Switch, TextInput } from '@/components/ui/FormControls'
import { Modal } from '@/components/ui/Modal'
import { DataTable, type Column } from '@/components/DataTable'
import { useAsync } from '@/hooks/useAsync'
import { useAuth } from '@/hooks/useAuth'
import { ownerAddonCategoryService, ownerAddonService, type OwnerAddon } from '@/services/simpleServices'
import { formatCurrency } from '@/lib/format'

interface AddonRow extends OwnerAddon {
  categoryName: string
}

export default function OwnerAddonsPage() {
  const { user } = useAuth()
  const { data: categories, isLoading: loadingCategories } = useAsync(() => ownerAddonCategoryService.list(user!.id), [user?.id])

  const { data: addonRows, isLoading: loadingAddons, reload } = useAsync(async () => {
    if (!categories) return []
    const perCategory = await Promise.all(
      categories.map((c) => ownerAddonService.listForCategory(c.id).then((rows) => rows.map((r) => ({ ...r, categoryName: c.name })))),
    )
    return perCategory.flat()
  }, [categories])

  const [formOpen, setFormOpen] = useState(false)
  const [name, setName] = useState('')
  const [price, setPrice] = useState(0)
  const [addonCategoryId, setAddonCategoryId] = useState<number | ''>('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<number | null>(null)

  function openCreate() {
    setName('')
    setPrice(0)
    setAddonCategoryId(categories?.[0]?.id ?? '')
    setSaveError(null)
    setFormOpen(true)
  }

  async function handleSave() {
    if (!addonCategoryId) {
      setSaveError('Choose an addon category')
      return
    }
    setSaving(true)
    setSaveError(null)
    try {
      await ownerAddonService.create(user!.id, { addonCategoryId, name, price })
      setFormOpen(false)
      reload()
    } catch (err) {
      setSaveError((err as { message?: string })?.message ?? 'Unable to save addon')
    } finally {
      setSaving(false)
    }
  }

  async function toggle(row: OwnerAddon) {
    setTogglingId(row.id)
    try {
      await ownerAddonService.setEnabled(row.id, !row.isActive)
      reload()
    } finally {
      setTogglingId(null)
    }
  }

  const columns: Column<AddonRow>[] = [
    { key: 'name', header: 'Name', render: (row) => <span className="font-medium text-slate-800 dark:text-slate-100">{row.name}</span> },
    { key: 'category', header: 'Category', render: (row) => row.categoryName },
    { key: 'price', header: 'Price', render: (row) => formatCurrency(row.price) },
    {
      key: 'status',
      header: 'Active',
      className: 'px-4 py-3 text-right',
      render: (row) => <Switch checked={row.isActive} onChange={() => toggle(row)} disabled={togglingId === row.id} />,
    },
  ]

  if (loadingCategories) return <LoadingBlock />

  return (
    <div>
      <PageHeader
        title="Addons"
        description="Individual add-on options for your menu items."
        actions={
          <button className="btn-primary" onClick={openCreate} disabled={!categories || categories.length === 0}>
            <Plus size={16} /> Add Addon
          </button>
        }
      />

      {categories && categories.length === 0 ? (
        <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
          Add an addon category first, then come back here to add addons to it.
        </p>
      ) : (
        <DataTable columns={columns} rows={addonRows ?? []} rowKey={(row) => row.id} isLoading={loadingAddons} emptyTitle="No addons yet" />
      )}

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title="Add Addon"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setFormOpen(false)} disabled={saving}>Cancel</button>
            <button className="btn-primary" onClick={handleSave} disabled={saving || !name.trim()}>{saving ? 'Saving…' : 'Save'}</button>
          </>
        }
      >
        {saveError && <p className="mb-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">{saveError}</p>}
        <div className="space-y-4">
          <Field label="Addon name" required>
            <TextInput value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="Price (₹)" required>
            <TextInput type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} />
          </Field>
          <Field label="Addon category" required>
            <Select value={addonCategoryId} onChange={(e) => setAddonCategoryId(Number(e.target.value))}>
              <option value="" disabled>Select category</option>
              {(categories ?? []).map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
          </Field>
        </div>
      </Modal>
    </div>
  )
}
