import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bike, Pencil, Plus, Star, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { SearchInput, Field, TextInput, Select } from '@/components/ui/FormControls'
import { ActiveBadge, Badge } from '@/components/ui/Feedback'
import { Modal, ConfirmDialog } from '@/components/ui/Modal'
import { DataTable, type Column } from '@/components/DataTable'
import { useAsync } from '@/hooks/useAsync'
import { useDebounce } from '@/hooks/useDebounce'
import { deliveryGuyService, type DeliveryGuyRow } from '@/services/deliveryGuyService'
import type { DeliveryGuyDetail } from '@/types/entities'

interface DeliveryGuyFormValues {
  name: string
  email: string
  age: number
  gender: DeliveryGuyDetail['gender']
  vehicleNumber: string
  description: string
  commissionRate: number
  maxAcceptDeliveryLimit: number
  isNotifiable: boolean
  isActive: boolean
  isOnline: boolean
  rating: number
  photo: string | null
}

const emptyForm: DeliveryGuyFormValues = {
  name: '',
  email: '',
  age: 25,
  gender: 'male',
  vehicleNumber: '',
  description: '',
  commissionRate: 12,
  maxAcceptDeliveryLimit: 3,
  isNotifiable: true,
  isActive: true,
  isOnline: false,
  rating: 0,
  photo: null,
}

export default function DeliveryGuysPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)
  const params = useMemo(() => ({ page, perPage: 10, search: debouncedSearch }), [page, debouncedSearch])
  const { data, isLoading, reload } = useAsync(() => deliveryGuyService.list(params), [params])

  const [formOpen, setFormOpen] = useState(false)
  const [values, setValues] = useState<DeliveryGuyFormValues>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<DeliveryGuyRow | null>(null)
  const [deleting, setDeleting] = useState(false)

  function openCreate() {
    setValues(emptyForm)
    setFormOpen(true)
  }

  async function handleSave() {
    setSaving(true)
    try {
      const created = await deliveryGuyService.create({ ...values, createdBy: 1, updatedBy: 1 })
      setFormOpen(false)
      reload()
      navigate(`/admin/delivery-guys/${created.userId}`)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deliveryGuyService.remove(deleteTarget.id)
      setDeleteTarget(null)
      reload()
    } finally {
      setDeleting(false)
    }
  }

  const columns: Column<DeliveryGuyRow>[] = [
    {
      key: 'name',
      header: 'Delivery Partner',
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-400">
            <Bike size={15} />
          </span>
          <div>
            <p className="font-medium text-slate-800 dark:text-slate-100">{row.name}</p>
            <p className="text-xs text-slate-400 dark:text-slate-500">{row.phone || row.email}</p>
          </div>
        </div>
      ),
    },
    { key: 'vehicle', header: 'Vehicle', render: (row) => row.vehicleNumber },
    { key: 'rating', header: 'Rating', render: (row) => (
      <span className="inline-flex items-center gap-1"><Star size={13} className="fill-amber-400 text-amber-400" /> {row.rating.toFixed(1)}</span>
    ) },
    { key: 'limit', header: 'Max deliveries', render: (row) => row.maxAcceptDeliveryLimit },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <div className="flex flex-wrap gap-1">
          <ActiveBadge active={row.isActive} />
          {row.isOnline && <Badge tone="green">Online</Badge>}
        </div>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'px-4 py-3 text-right',
      render: (row) => (
        <div className="flex justify-end gap-1">
          <button className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300" onClick={(e) => { e.stopPropagation(); navigate(`/admin/delivery-guys/${row.userId}`) }}>
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
        title="Delivery Partners"
        description="Riders who deliver orders for PureEats."
        actions={<button className="btn-primary" onClick={openCreate}><Plus size={16} /> Add Delivery Partner</button>}
      />
      <div className="mb-3">
        <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1) }} placeholder="Search by name or vehicle number…" />
      </div>
      <DataTable
        columns={columns}
        rows={data?.data ?? []}
        rowKey={(row) => row.id}
        isLoading={isLoading}
        emptyTitle="No delivery partners found"
        pagination={data ?? undefined}
        onPageChange={setPage}
        onRowClick={(row) => navigate(`/admin/delivery-guys/${row.userId}`)}
      />

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title="Add Delivery Partner"
        size="lg"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setFormOpen(false)} disabled={saving}>Cancel</button>
            <button className="btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Full name" required>
            <TextInput value={values.name} onChange={(e) => setValues((p) => ({ ...p, name: e.target.value }))} />
          </Field>
          <Field label="Email" required>
            <TextInput type="email" value={values.email} onChange={(e) => setValues((p) => ({ ...p, email: e.target.value }))} />
          </Field>
          <Field label="Vehicle number" required>
            <TextInput value={values.vehicleNumber} onChange={(e) => setValues((p) => ({ ...p, vehicleNumber: e.target.value }))} />
          </Field>
          <Field label="Age">
            <TextInput type="number" value={values.age} onChange={(e) => setValues((p) => ({ ...p, age: Number(e.target.value) }))} />
          </Field>
          <Field label="Commission rate (%)">
            <TextInput type="number" value={values.commissionRate} onChange={(e) => setValues((p) => ({ ...p, commissionRate: Number(e.target.value) }))} />
          </Field>
          <Field label="Max simultaneous deliveries">
            <TextInput type="number" value={values.maxAcceptDeliveryLimit} onChange={(e) => setValues((p) => ({ ...p, maxAcceptDeliveryLimit: Number(e.target.value) }))} />
          </Field>
          <Field label="Gender">
            <Select value={values.gender} onChange={(e) => setValues((p) => ({ ...p, gender: e.target.value as typeof p.gender }))}>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </Select>
          </Field>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Remove delivery partner"
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
