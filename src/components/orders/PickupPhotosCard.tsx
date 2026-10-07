import { Camera } from 'lucide-react'
import { useAsync } from '@/hooks/useAsync'
import { orderService, type OrderPhoto, type OrderRow } from '@/services/orderService'
import { formatDate } from '@/lib/format'

function PhotoGrid({ title, hint, photos }: { title: string; hint: string; photos: OrderPhoto[] }) {
  return (
    <div>
      <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">{title}</p>
      <p className="mb-2 text-[11px] text-slate-400 dark:text-slate-500">{hint}</p>
      {photos.length === 0 ? (
        <p className="text-sm text-slate-400">No photos yet.</p>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {photos.map((p) => (
            <a key={p.id} href={p.url} target="_blank" rel="noopener noreferrer" className="group block">
              <img src={p.url} alt={title} className="aspect-square w-full rounded-lg object-cover ring-1 ring-slate-200 group-hover:opacity-90 dark:ring-slate-700" />
              <span className="mt-1 block text-[10px] text-slate-400">{formatDate(p.takenAt)}</span>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}

/** Photos the delivery partner took (camera only, 1-3 each): the packed order at pickup, and the handover to the customer. */
export function PickupPhotosCard({ order }: { order: OrderRow }) {
  const { data, isLoading, error } = useAsync(
    () => Promise.all([orderService.pickupPhotos(order.id), orderService.deliveryPhotos(order.id)]),
    [order.id, order.statusName],
  )

  if (order.deliveryType === 'pickup') return null

  return (
    <div className="card p-4 print:hidden">
      <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
        <Camera size={16} /> Delivery partner photos
      </h2>
      {isLoading && <p className="text-sm text-slate-400">Loading photos…</p>}
      {error && <p className="text-sm text-rose-600">Couldn't load the photos.</p>}
      {data && (
        <div className="space-y-4">
          <PhotoGrid title="At pickup" hint="The packed order at the restaurant, before pickup." photos={data[0]} />
          <PhotoGrid title="At delivery" hint="Handing the order over to the customer." photos={data[1]} />
        </div>
      )}
    </div>
  )
}
