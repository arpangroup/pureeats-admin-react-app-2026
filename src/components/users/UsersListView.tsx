import { useMemo, useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { SearchInput, Field, TextInput } from '@/components/ui/FormControls'
import { ActiveBadge } from '@/components/ui/Feedback'
import { Modal, ConfirmDialog } from '@/components/ui/Modal'
import { DataTable, type Column } from '@/components/DataTable'
import { useAsync } from '@/hooks/useAsync'
import { useDebounce } from '@/hooks/useDebounce'
import { userService } from '@/services/userService'
import { initials } from '@/lib/format'
import type { User } from '@/types/entities'
import type { UserRole } from '@/types/common'

const roleLabels: Record<UserRole, string> = {
  admin: 'Admin',
  employee: 'Employee',
  'restaurant-owner': 'Restaurant Owner',
  'delivery-guy': 'Delivery Partner',
  customer: 'Customer',
}

export function UsersListView({
  role,
  title,
  description,
  createLabel,
}: {
  role: UserRole
  title: string
  description: string
  createLabel: string
}) {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<User | null>(null)
  const [values, setValues] = useState<Partial<User>>({ role, isActive: true })
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null)
  const [deleting, setDeleting] = useState(false)

  const params = useMemo(() => ({ page, perPage: 10, search: debouncedSearch }), [page, debouncedSearch])
  const { data, isLoading, reload } = useAsync(() => userService.listByRole(role, params), [role, params])

  function openCreate() {
    setEditing(null)
    setValues({ role, isActive: true, name: '', email: '', phone: '' })
    setFormOpen(true)
  }

  function openEdit(row: User) {
    setEditing(row)
    setValues(row)
    setFormOpen(true)
  }

  async function handleSave() {
    setSaving(true)
    try {
      if (editing) {
        await userService.update(editing.id, values)
      } else {
        await userService.create(values)
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
      await userService.remove(deleteTarget.id)
      setDeleteTarget(null)
      reload()
    } finally {
      setDeleting(false)
    }
  }

  const columns: Column<User>[] = [
    {
      key: 'name',
      header: roleLabels[role],
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
            {initials(row.name)}
          </span>
          <div>
            <p className="font-medium text-slate-800">{row.name}</p>
            <p className="text-xs text-slate-400">{row.email}</p>
          </div>
        </div>
      ),
    },
    { key: 'phone', header: 'Phone', render: (row) => row.phone || '—' },
    { key: 'status', header: 'Status', render: (row) => <ActiveBadge active={row.isActive} /> },
    {
      key: 'actions',
      header: '',
      className: 'px-4 py-3 text-right',
      render: (row) => (
        <div className="flex justify-end gap-1">
          <button className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600" onClick={(e) => { e.stopPropagation(); openEdit(row) }}>
            <Pencil size={15} />
          </button>
          <button className="rounded-md p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600" onClick={(e) => { e.stopPropagation(); setDeleteTarget(row) }}>
            <Trash2 size={15} />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title={title}
        description={description}
        actions={
          <button className="btn-primary" onClick={openCreate}>
            <Plus size={16} /> {createLabel}
          </button>
        }
      />

      <div className="mb-3">
        <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1) }} placeholder="Search by name, email or phone…" />
      </div>

      <DataTable
        columns={columns}
        rows={data?.data ?? []}
        rowKey={(row) => row.id}
        isLoading={isLoading}
        emptyTitle="No records found"
        pagination={data ?? undefined}
        onPageChange={setPage}
      />

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? `Edit ${roleLabels[role]}` : createLabel}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setFormOpen(false)} disabled={saving}>Cancel</button>
            <button className="btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Full name" required>
            <TextInput value={values.name ?? ''} onChange={(e) => setValues((p) => ({ ...p, name: e.target.value }))} />
          </Field>
          <Field label="Email" required>
            <TextInput type="email" value={values.email ?? ''} onChange={(e) => setValues((p) => ({ ...p, email: e.target.value }))} />
          </Field>
          <Field label="Phone">
            <TextInput value={values.phone ?? ''} onChange={(e) => setValues((p) => ({ ...p, phone: e.target.value }))} />
          </Field>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title={`Remove ${roleLabels[role].toLowerCase()}`}
        description="This action can't be undone."
        confirmLabel="Remove"
        danger
        isBusy={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  )
}
