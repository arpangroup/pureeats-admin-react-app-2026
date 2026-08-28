import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { LoadingBlock } from '@/components/ui/Feedback'
import { RestaurantForm } from '@/components/restaurants/RestaurantForm'
import { useAsync } from '@/hooks/useAsync'
import { restaurantService } from '@/services/restaurantService'
import type { Restaurant } from '@/types/entities'

export default function OwnerRestaurantFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: existing, isLoading } = useAsync(() => restaurantService.get(Number(id)), [id])

  const [values, setValues] = useState<Partial<Restaurant>>({})
  const [initialized, setInitialized] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!initialized && existing) {
    setValues(existing)
    setInitialized(true)
  }

  function handleChange<K extends keyof Restaurant>(key: K, value: Restaurant[K]) {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      await restaurantService.update(Number(id), values)
      navigate('/restaurant-owner/restaurants')
    } catch (err) {
      setError((err as { message?: string })?.message ?? 'Unable to save changes')
    } finally {
      setSaving(false)
    }
  }

  if (isLoading) return <LoadingBlock />

  return (
    <div>
      <button onClick={() => navigate('/restaurant-owner/restaurants')} className="btn-ghost mb-3 px-2">
        <ArrowLeft size={15} /> Back to restaurants
      </button>
      <PageHeader
        title={`Edit ${existing?.name ?? ''}`}
        description="Admin-only fields like commission and approval status aren't editable here."
        actions={
          <>
            <button className="btn-secondary" onClick={() => navigate('/restaurant-owner/restaurants')}>Cancel</button>
            <button className="btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </>
        }
      />
      {error && <p className="mb-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</p>}
      <div className="card p-5">
        <RestaurantForm values={values} onChange={handleChange} isAdmin={false} />
      </div>
    </div>
  )
}
