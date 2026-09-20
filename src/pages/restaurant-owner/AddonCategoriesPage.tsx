import { useState } from 'react'
import { Plus } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Badge } from '@/components/ui/Feedback'
import { Field, Select, TextInput } from '@/components/ui/FormControls'
import { Modal } from '@/components/ui/Modal'
import { DataTable, type Column } from '@/components/DataTable'
import { useAsync } from '@/hooks/useAsync'
import { useAuth } from '@/hooks/useAuth'
import { ownerAddonCategoryService, type OwnerAddonCategory } from '@/services/simpleServices'

export default function OwnerAddonCategoriesPage() {
  const { user } = useAuth()
  const { data, isLoading, reload } = useAsync(() => ownerAddonCategoryService.list(user!.id), [user?.id])
  const [formOpen, setFormOpen] = useState(false)
  const [name, setName] = useState('')
  const [type, setType] = useState<'single' | 'multiple'>('single')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  function openCreate() {
    setName('')
    setType('single')
    setSaveError(null)
    setFormOpen(true)
  }

  async function handleSave() {
    setSaving(true)
    setSaveError(null)
    try {
      await ownerAddonCategoryService.create(user!.id, name, type)
      setFormOpen(false)
      reload()
    } catch (err) {
      setSaveError((err as { message?: string })?.message ?? 'Unable to save addon category')
    } finally {
      setSaving(false)
    }
  }

  const columns: Column<OwnerAddonCategory>[] = [
    { key: 'name', header: 'Name', render: (row) => <span className="font-medium text-slate-800 dark:text-slate-100">{row.name}</span> },
    { key: 'type', header: 'Type', render: (row) => <Badge tone={row.type === 'single' ? 'blue' : 'purple'}>{row.type}</Badge> },
  ]

  return (
    <div>
      <PageHeader
        title="Addon Categories"
        description="Groups of add-ons for your menu items."
        actions={
          <button className="btn-primary" onClick={openCreate}>
            <Plus size={16} /> Add Category
          </button>
        }
      />

      <DataTable columns={columns} rows={data ?? []} rowKey={(row) => row.id} isLoading={isLoading} emptyTitle="No addon categories yet" />

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
        <div className="space-y-4">
          <Field label="Category name" required>
            <TextInput value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="Selection type" required>
            <Select value={type} onChange={(e) => setType(e.target.value as 'single' | 'multiple')}>
              <option value="single">Single choice</option>
              <option value="multiple">Multiple choice</option>
            </Select>
          </Field>
        </div>
      </Modal>
    </div>
  )
}
