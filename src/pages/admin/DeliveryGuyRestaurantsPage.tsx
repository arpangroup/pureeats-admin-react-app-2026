import { useState } from 'react'
import { Pencil, Store } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Badge, EmptyState, LoadingBlock } from '@/components/ui/Feedback'
import { Modal } from '@/components/ui/Modal'
import { useAsync } from '@/hooks/useAsync'
import { deliveryGuyService } from '@/services/deliveryGuyService'
import { restaurants } from '@/mocks/fixtures'

export default function DeliveryGuyRestaurantsPage() {
  const { data, isLoading, reload } = useAsync(() => deliveryGuyService.list({ perPage: 50 }), [])
  const [editingId, setEditingId] = useState<number | null>(null)
  const [selected, setSelected] = useState<number[]>([])
  const [saving, setSaving] = useState(false)

  async function openEdit(deliveryGuyId: number) {
    setEditingId(deliveryGuyId)
    setSelected(await deliveryGuyService.assignedRestaurantIds(deliveryGuyId))
  }

  function toggle(restaurantId: number) {
    setSelected((prev) => (prev.includes(restaurantId) ? prev.filter((id) => id !== restaurantId) : [...prev, restaurantId]))
  }

  async function handleSave() {
    if (editingId === null) return
    setSaving(true)
    try {
      await deliveryGuyService.updateAssignedRestaurants(editingId, selected)
      setEditingId(null)
      reload()
    } finally {
      setSaving(false)
    }
  }

  const riders = data?.data ?? []

  return (
    <div>
      <PageHeader title="Delivery Partner Restaurants" description="Restrict which restaurants each delivery partner can pick up orders from." />

      {isLoading ? (
        <LoadingBlock />
      ) : riders.length === 0 ? (
        <EmptyState title="No delivery partners yet" />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {riders.map((rider) => (
            <RiderCard key={rider.id} riderId={rider.id} name={rider.name} onEdit={() => openEdit(rider.id)} />
          ))}
        </div>
      )}

      <Modal
        open={editingId !== null}
        onClose={() => setEditingId(null)}
        title="Assign Restaurants"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setEditingId(null)} disabled={saving}>Cancel</button>
            <button className="btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
          </>
        }
      >
        <div className="space-y-2">
          {restaurants.map((r) => (
            <label key={r.id} className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-slate-100 px-3 py-2 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/60">
              <input type="checkbox" checked={selected.includes(r.id)} onChange={() => toggle(r.id)} className="h-4 w-4 rounded border-slate-300 text-brand-600" />
              <span className="text-sm text-slate-700 dark:text-slate-300">{r.name}</span>
            </label>
          ))}
        </div>
      </Modal>
    </div>
  )
}

function RiderCard({ riderId, name, onEdit }: { riderId: number; name: string; onEdit: () => void }) {
  const { data } = useAsync(() => deliveryGuyService.assignedRestaurantIds(riderId), [riderId])
  const assigned = (data ?? []).map((id) => restaurants.find((r) => r.id === id)).filter(Boolean)

  return (
    <div className="card p-4">
      <div className="mb-2 flex items-center justify-between">
        <p className="font-medium text-slate-800 dark:text-slate-100">{name}</p>
        <button className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300" onClick={onEdit} aria-label="Edit assignments">
          <Pencil size={15} />
        </button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {assigned.length === 0 && <span className="text-sm text-slate-400 dark:text-slate-500">No restaurants assigned</span>}
        {assigned.map((r) => (
          <Badge key={r!.id} tone="slate">
            <Store size={11} className="mr-1 inline" /> {r!.name}
          </Badge>
        ))}
      </div>
    </div>
  )
}
