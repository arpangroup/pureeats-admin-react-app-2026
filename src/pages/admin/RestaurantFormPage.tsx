import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { LoadingBlock } from '@/components/ui/Feedback'
import { RestaurantForm } from '@/components/restaurants/RestaurantForm'
import { useAsync } from '@/hooks/useAsync'
import { restaurantService } from '@/services/restaurantService'
import type { Restaurant } from '@/types/entities'

const emptyRestaurant: Partial<Restaurant> = {
  name: '',
  contactNumber: '',
  description: '',
  openingTime: '09:00',
  closingTime: '22:00',
  isPureveg: false,
  restaurantCharges: 0,
  baseDeliveryCharge: 20,
  minOrderPrice: 99,
  deliveryRadius: 6,
  deliveryTime: 30,
  deliveryType: 'platform-rider',
  isAcceptCod: true,
  isSchedulable: false,
  autoAcceptable: false,
  commissionRate: 15,
  isActive: true,
  isAccepted: true,
  isFeatured: false,
  isNotifiable: true,
  categoryIds: [],
}

export default function AdminRestaurantFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isNew = !id || id === 'new'

  const { data: existing, isLoading } = useAsync(
    () => (isNew ? Promise.resolve(undefined) : restaurantService.get(Number(id))),
    [id],
  )

  const [values, setValues] = useState<Partial<Restaurant>>(emptyRestaurant)
  const [initialized, setInitialized] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!initialized && (isNew || existing)) {
    setValues(isNew ? emptyRestaurant : (existing as Restaurant))
    setInitialized(true)
  }

  function handleChange<K extends keyof Restaurant>(key: K, value: Restaurant[K]) {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      if (isNew) {
        await restaurantService.create(values)
      } else {
        await restaurantService.update(Number(id), values)
      }
      navigate('/admin/restaurants')
    } catch (err) {
      setError((err as { message?: string })?.message ?? 'Unable to save restaurant')
    } finally {
      setSaving(false)
    }
  }

  if (!isNew && isLoading) return <LoadingBlock />

  return (
    <div>
      <button onClick={() => navigate('/admin/restaurants')} className="btn-ghost mb-3 px-2">
        <ArrowLeft size={15} /> Back to restaurants
      </button>
      <PageHeader
        title={isNew ? 'Add Restaurant' : `Edit ${existing?.name ?? ''}`}
        actions={
          <>
            <button className="btn-secondary" onClick={() => navigate('/admin/restaurants')}>Cancel</button>
            <button className="btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : 'Save restaurant'}
            </button>
          </>
        }
      />
      {error && <p className="mb-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</p>}
      <div className="card p-5">
        <RestaurantForm values={values} onChange={handleChange} isAdmin />
      </div>
    </div>
  )
}
