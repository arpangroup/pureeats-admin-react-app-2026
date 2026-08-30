import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, BadgePercent, CalendarClock, FileBadge, Receipt, Tag } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { LoadingBlock, EmptyState } from '@/components/ui/Feedback'
import { Field, Select, Switch, TextInput, Textarea } from '@/components/ui/FormControls'
import { SectionCard } from '@/components/ui/SectionCard'
import { AuditInfo } from '@/components/ui/AuditInfo'
import { DataTable, type Column } from '@/components/DataTable'
import { useAsync } from '@/hooks/useAsync'
import { couponService, couponUsageService, type CouponUsageRow } from '@/services/simpleServices'
import { restaurantService } from '@/services/restaurantService'
import { formatDate } from '@/lib/format'
import type { Coupon } from '@/types/entities'

const emptyCoupon: Partial<Coupon> = {
  name: '',
  code: '',
  description: '',
  discountType: 'flat',
  discount: 0,
  minOrderAmount: 0,
  uptoAmount: 0,
  totalCoupon: 100,
  count: 0,
  maxCount: 1,
  expiryDate: '',
  isActive: true,
  restaurantId: null,
  firstOrderOnly: false,
}

export default function CouponFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isNew = !id || id === 'new'

  const { data: existing, isLoading } = useAsync(
    () => (isNew ? Promise.resolve(undefined) : couponService.get(Number(id))),
    [id],
  )
  const { data: usages } = useAsync(
    () => (isNew ? Promise.resolve([]) : couponUsageService.forCoupon(Number(id))),
    [id],
  )
  const { data: restaurantsData } = useAsync(() => restaurantService.list({ perPage: 100 }), [])
  const restaurants = restaurantsData?.data ?? []

  const [values, setValues] = useState<Partial<Coupon>>(emptyCoupon)
  const [initialized, setInitialized] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!initialized && (isNew || existing)) {
    setValues(isNew ? emptyCoupon : (existing as Coupon))
    setInitialized(true)
  }

  function handleChange<K extends keyof Coupon>(key: K, value: Coupon[K]) {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      if (isNew) {
        await couponService.create(values)
      } else {
        await couponService.update(Number(id), values)
      }
      navigate('/admin/coupons')
    } catch (err) {
      setError((err as { message?: string })?.message ?? 'Unable to save coupon')
    } finally {
      setSaving(false)
    }
  }

  if (!isNew && isLoading) return <LoadingBlock />
  if (!isNew && initialized && !existing) return <EmptyState title="Coupon not found" />

  const usageColumns: Column<CouponUsageRow>[] = [
    { key: 'user', header: 'Customer', render: (row) => row.userName },
    { key: 'restaurant', header: 'Restaurant', render: (row) => row.restaurantName },
    { key: 'used', header: 'Times used', render: (row) => row.couponUsed },
    { key: 'date', header: 'Date', render: (row) => formatDate(row.createdAt) },
  ]

  return (
    <div>
      <button onClick={() => navigate('/admin/coupons')} className="btn-ghost mb-3 px-2">
        <ArrowLeft size={15} /> Back to coupons
      </button>
      <PageHeader
        title={isNew ? 'Add Coupon' : `Edit ${existing?.name ?? ''}`}
        actions={
          <>
            <button className="btn-secondary" onClick={() => navigate('/admin/coupons')}>Cancel</button>
            <button className="btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : 'Save coupon'}
            </button>
          </>
        }
      />
      {error && <p className="mb-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</p>}

      <div className="space-y-5">
        <SectionCard title="Basic information" description="Name and code shown to customers." icon={Tag}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Coupon name" required>
              <TextInput value={values.name ?? ''} onChange={(e) => handleChange('name', e.target.value)} />
            </Field>
            <Field label="Coupon code" required hint="Shown to customers, e.g. WELCOME50">
              <TextInput value={values.code ?? ''} onChange={(e) => handleChange('code', e.target.value.toUpperCase())} />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Description">
                <Textarea value={values.description ?? ''} onChange={(e) => handleChange('description', e.target.value)} />
              </Field>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Discount" description="How much customers save and where it applies." icon={BadgePercent}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="Discount type" required>
              <Select value={values.discountType ?? 'flat'} onChange={(e) => handleChange('discountType', e.target.value as Coupon['discountType'])}>
                <option value="flat">Flat amount</option>
                <option value="percentage">Percentage</option>
                <option value="free_delivery">Free delivery</option>
              </Select>
            </Field>
            {values.discountType === 'free_delivery' ? (
              <div className="flex items-end sm:col-span-2">
                <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
                  Waives the delivery charge entirely — no discount amount or cap to set.
                </p>
              </div>
            ) : (
              <>
                <Field label={values.discountType === 'percentage' ? 'Discount (%)' : 'Discount (₹)'} required>
                  <TextInput type="number" value={values.discount ?? 0} onChange={(e) => handleChange('discount', Number(e.target.value))} />
                </Field>
                <Field label="Max discount (₹)" hint="Caps the discount on percentage coupons">
                  <TextInput type="number" value={values.uptoAmount ?? 0} onChange={(e) => handleChange('uptoAmount', Number(e.target.value))} />
                </Field>
              </>
            )}
            <Field label="Minimum order value (₹)">
              <TextInput type="number" value={values.minOrderAmount ?? 0} onChange={(e) => handleChange('minOrderAmount', Number(e.target.value))} />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Applies to" hint='Leave as "All restaurants" for a platform-wide coupon'>
                <Select
                  value={values.restaurantId ?? 0}
                  onChange={(e) => handleChange('restaurantId', Number(e.target.value) || null)}
                >
                  <option value={0}>All restaurants</option>
                  {restaurants.map((r) => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </Select>
              </Field>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Limits &amp; validity" icon={CalendarClock}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="Total coupons available">
              <TextInput type="number" value={values.totalCoupon ?? 0} onChange={(e) => handleChange('totalCoupon', Number(e.target.value))} />
            </Field>
            <Field label="Uses per customer">
              <TextInput type="number" value={values.maxCount ?? 1} onChange={(e) => handleChange('maxCount', Number(e.target.value))} />
            </Field>
            <Field label="Times redeemed" hint="Read-only — tracked automatically">
              <TextInput value={values.count ?? 0} disabled />
            </Field>
            <Field label="Expiry date" required>
              <TextInput type="date" value={values.expiryDate ?? ''} onChange={(e) => handleChange('expiryDate', e.target.value)} />
            </Field>
            <Field label="Active">
              <Switch checked={!!values.isActive} onChange={(v) => handleChange('isActive', v)} />
            </Field>
            <Field label="First order only" hint="Usable only on a customer's very first order">
              <Switch checked={!!values.firstOrderOnly} onChange={(v) => handleChange('firstOrderOnly', v)} />
            </Field>
          </div>
        </SectionCard>

        {!isNew && (
          <SectionCard title="Redemption history" icon={Receipt} description="Customers who have used this coupon.">
            <DataTable columns={usageColumns} rows={usages ?? []} rowKey={(r) => r.id} emptyTitle="Not used yet" />
          </SectionCard>
        )}

        {!isNew && values.createdAt && values.updatedAt && (
          <SectionCard title="Record info" icon={FileBadge}>
            <AuditInfo createdAt={values.createdAt} updatedAt={values.updatedAt} />
          </SectionCard>
        )}
      </div>
    </div>
  )
}
