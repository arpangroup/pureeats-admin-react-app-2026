import { Camera } from 'lucide-react'
import { useAsync } from '@/hooks/useAsync'
import { orderService, type OrderRow } from '@/services/orderService'
import { formatDate } from '@/lib/format'

/** Photos of the packed order the delivery partner took (camera only, 1-3) before marking it picked up. */
export function PickupPhotosCard({ order }: { order: OrderRow }) {
  const { data: photos, isLoading, error } = useAsync(() => orderService.pickupPhotos(order.id), [order.id, order.statusName])

  if (order.deliveryType === 'pickup') return null

  return (
    <div className="card p-4 print:hidden">
      <h2 className="mb-1 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
        <Camera size={16} /> Pickup photos
      </h2>
      <p className="mb-3 text-xs text-slate-400 dark:text-slate-500">Taken by the delivery partner at the restaurant before pickup.</p>
      {isLoading && <p className="text-sm text-slate-400">Loading photos…</p>}
      {error && <p className="text-sm text-rose-600">Couldn't load the pickup photos.</p>}
      {photos && photos.length === 0 && <p className="text-sm text-slate-400">No pickup photos yet.</p>}
      {photos && photos.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {photos.map((p) => (
            <a key={p.id} href={p.url} target="_blank" rel="noopener noreferrer" className="group block">
              <img src={p.url} alt="Pickup" className="aspect-square w-full rounded-lg object-cover ring-1 ring-slate-200 group-hover:opacity-90 dark:ring-slate-700" />
              <span className="mt-1 block text-[10px] text-slate-400">{formatDate(p.takenAt)}</span>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
