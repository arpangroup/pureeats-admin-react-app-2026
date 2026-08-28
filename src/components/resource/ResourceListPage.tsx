import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import type { Column } from '@/components/DataTable'
import { DataTable } from '@/components/DataTable'
import { PageHeader } from '@/components/ui/PageHeader'
import { SearchInput } from '@/components/ui/FormControls'
import { Modal, ConfirmDialog } from '@/components/ui/Modal'
import { useAsync } from '@/hooks/useAsync'
import { useDebounce } from '@/hooks/useDebounce'
import type { ListParams } from '@/types/common'
import { ResourceForm } from './ResourceForm'
import type { FormFieldConfig, ResourceService } from './resourceTypes'

interface ResourceListPageProps<T extends { id: number }> {
  title: string
  description?: string
  service: ResourceService<T>
  columns: Column<T>[]
  formFields?: FormFieldConfig<T>[]
  defaultValues?: Partial<T>
  extraParams?: Partial<ListParams>
  searchable?: boolean
  searchPlaceholder?: string
  perPage?: number
  createLabel?: string
  emptyTitle?: string
  emptyDescription?: string
  renderExtraActions?: (row: T) => ReactNode
}

export function ResourceListPage<T extends { id: number }>({
  title,
  description,
  service,
  columns,
  formFields,
  defaultValues = {},
  extraParams,
  searchable = true,
  searchPlaceholder = 'Search…',
  perPage = 10,
  createLabel = 'Add New',
  emptyTitle,
  emptyDescription,
  renderExtraActions,
}: ResourceListPageProps<T>) {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<T | null>(null)
  const [values, setValues] = useState<Partial<T>>(defaultValues)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<T | null>(null)
  const [deleting, setDeleting] = useState(false)

  const params = useMemo<ListParams>(
    () => ({ page, perPage, search: debouncedSearch, ...extraParams }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [page, perPage, debouncedSearch, JSON.stringify(extraParams)],
  )

  const { data, isLoading, reload } = useAsync(() => service.list(params), [params])

  function openCreate() {
    setEditing(null)
    setValues(defaultValues)
    setFormError(null)
    setFormOpen(true)
  }

  function openEdit(row: T) {
    setEditing(row)
    setValues(row)
    setFormError(null)
    setFormOpen(true)
  }

  function handleFieldChange(name: keyof T & string, value: unknown) {
    setValues((prev) => ({ ...prev, [name]: value }))
  }

  async function handleSubmit() {
    setSaving(true)
    setFormError(null)
    try {
      if (editing && service.update) {
        await service.update(editing.id, values)
      } else if (service.create) {
        await service.create(values)
      }
      setFormOpen(false)
      reload()
    } catch (err) {
      setFormError((err as { message?: string })?.message ?? 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget || !service.remove) return
    setDeleting(true)
    try {
      await service.remove(deleteTarget.id)
      setDeleteTarget(null)
      reload()
    } finally {
      setDeleting(false)
    }
  }

  const actionColumn: Column<T> | null =
    formFields && (service.update || service.remove)
      ? {
          key: '__actions',
          header: '',
          className: 'px-4 py-3 text-right',
          render: (row) => (
            <div className="flex items-center justify-end gap-1">
              {renderExtraActions?.(row)}
              {service.update && (
                <button
                  className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
                  onClick={(e) => {
                    e.stopPropagation()
                    openEdit(row)
                  }}
                  aria-label="Edit"
                >
                  <Pencil size={15} />
                </button>
              )}
              {service.remove && (
                <button
                  className="rounded-md p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10 dark:hover:text-rose-400"
                  onClick={(e) => {
                    e.stopPropagation()
                    setDeleteTarget(row)
                  }}
                  aria-label="Delete"
                >
                  <Trash2 size={15} />
                </button>
              )}
            </div>
          ),
        }
      : null

  const allColumns = actionColumn ? [...columns, actionColumn] : columns

  return (
    <div>
      <PageHeader
        title={title}
        description={description}
        actions={
          formFields && service.create ? (
            <button className="btn-primary" onClick={openCreate}>
              <Plus size={16} /> {createLabel}
            </button>
          ) : undefined
        }
      />

      {searchable && (
        <div className="mb-3">
          <SearchInput
            value={search}
            onChange={(v) => {
              setSearch(v)
              setPage(1)
            }}
            placeholder={searchPlaceholder}
          />
        </div>
      )}

      <DataTable
        columns={allColumns}
        rows={data?.data ?? []}
        rowKey={(row) => row.id}
        isLoading={isLoading}
        emptyTitle={emptyTitle}
        emptyDescription={emptyDescription}
        pagination={data ?? undefined}
        onPageChange={setPage}
      />

      {formFields && (
        <Modal
          open={formOpen}
          onClose={() => setFormOpen(false)}
          title={editing ? `Edit ${title}` : `${createLabel}`}
          footer={
            <>
              <button className="btn-secondary" onClick={() => setFormOpen(false)} disabled={saving}>
                Cancel
              </button>
              <button className="btn-primary" onClick={handleSubmit} disabled={saving}>
                {saving ? 'Saving…' : 'Save'}
              </button>
            </>
          }
        >
          {formError && (
            <p className="mb-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{formError}</p>
          )}
          <ResourceForm fields={formFields} values={values} onChange={handleFieldChange} />
        </Modal>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title={`Delete ${title.replace(/s$/, '')}`}
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
