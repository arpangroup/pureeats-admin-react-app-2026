import { useState } from 'react'
import { Plus } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Field, Switch, TextInput } from '@/components/ui/FormControls'
import { Modal } from '@/components/ui/Modal'
import { DataTable, type Column } from '@/components/DataTable'
import { useAsync } from '@/hooks/useAsync'
import { useAuth } from '@/hooks/useAuth'
import { ownerItemCategoryService, type OwnerItemCategory } from '@/services/simpleServices'

export default function OwnerItemCategoriesPage() {
  const { user } = useAuth()
  const { data, isLoading, reload } = useAsync(() => ownerItemCategoryService.list(user!.id), [user?.id])
  const [formOpen, setFormOpen] = useState(false)
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<number | null>(null)

  function openCreate() {
    setName('')
    setSaveError(null)
    setFormOpen(true)
  }

  async function handleSave() {
    setSaving(true)
    setSaveError(null)
    try {
      await ownerItemCategoryService.create(user!.id, name)
      setFormOpen(false)
      reload()
    } catch (err) {
      setSaveError((err as { message?: string })?.message ?? 'Unable to save category')
    } finally {
      setSaving(false)
    }
  }

  async function toggle(row: OwnerItemCategory) {
    setTogglingId(row.id)
    try {
      await ownerItemCategoryService.setEnabled(row.id, !row.isEnabled)
      reload()
    } finally {
      setTogglingId(null)
    }
  }

  const columns: Column<OwnerItemCategory>[] = [
    { key: 'name', header: 'Name', render: (row) => <span className="font-medium text-slate-800 dark:text-slate-100">{row.name}</span> },
    {
      key: 'status',
      header: 'Enabled',
      className: 'px-4 py-3 text-right',
      render: (row) => <Switch checked={row.isEnabled} onChange={() => toggle(row)} disabled={togglingId === row.id} />,
    },
  ]

  return (
    <div>
      <PageHeader
        title="Item Categories"
        description="Group your menu items into categories."
        actions={
          <button className="btn-primary" onClick={openCreate}>
            <Plus size={16} /> Add Category
          </button>
        }
      />

      <DataTable columns={columns} rows={data ?? []} rowKey={(row) => row.id} isLoading={isLoading} emptyTitle="No item categories yet" />

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title="Add Category"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setFormOpen(false)} disabled={saving}>Cancel</button>
            <button className="btn-primary" onClick={handleSave} disabled={saving || !name.trim()}>{saving ? 'Saving…' : 'Save'}</button>
          </>
        }
      >
        {saveError && <p className="mb-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">{saveError}</p>}
        <Field label="Category name" required>
          <TextInput value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
      </Modal>
    </div>
  )
}
