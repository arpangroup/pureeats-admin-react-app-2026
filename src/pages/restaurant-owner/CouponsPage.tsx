import { useEffect, useState } from 'react'
import { ResourceListPage } from '@/components/resource/ResourceListPage'
import { ActiveBadge } from '@/components/ui/Feedback'
import { LoadingBlock, EmptyState } from '@/components/ui/Feedback'
import { useAsync } from '@/hooks/useAsync'
import { useAuth } from '@/hooks/useAuth'
import { restaurantService } from '@/services/restaurantService'
import { couponService } from '@/services/simpleServices'
import { formatCurrency, formatDate } from '@/lib/format'
import type { Coupon } from '@/types/entities'
import type { FormFieldConfig } from '@/components/resource/resourceTypes'

const fields: FormFieldConfig<Coupon>[] = [
  { name: 'name', label: 'Coupon name', type: 'text', required: true },
  { name: 'code', label: 'Coupon code', type: 'text', required: true },
  { name: 'description', label: 'Description', type: 'textarea', colSpan: 2 },
  {
    name: 'discountType',
    label: 'Discount type',
    type: 'select',
    required: true,
    options: [
      { label: 'Flat amount', value: 'flat' },
      { label: 'Percentage', value: 'percentage' },
    ],
  },
  { name: 'discount', label: 'Discount value', type: 'number', required: true },
  { name: 'minOrderAmount', label: 'Minimum order value (₹)', type: 'number' },
  { name: 'expiryDate', label: 'Expiry date', type: 'date', required: true },
  { name: 'isActive', label: 'Active', type: 'switch' },
]

export default function OwnerCouponsPage() {
  const { user } = useAuth()
  const { data: restaurantPage, isLoading } = useAsync(() => restaurantService.listByOwner(user!.id, { perPage: 50 }), [user?.id])
  const restaurants = restaurantPage?.data ?? []
  const [restaurantId, setRestaurantId] = useState<number | null>(null)

  useEffect(() => {
    if (!restaurantId && restaurants.length > 0) setRestaurantId(restaurants[0].id)
  }, [restaurants, restaurantId])

  if (isLoading) return <LoadingBlock />
  if (restaurants.length === 0) return <EmptyState title="No restaurant assigned" />
  if (!restaurantId) return null

  return (
    <ResourceListPage<Coupon>
      title="Coupons"
      description="Discount codes available at your restaurant."
      service={couponService}
      formFields={fields}
      extraParams={{ filters: { restaurantId } }}
      defaultValues={{ discountType: 'flat', discount: 0, minOrderAmount: 0, isActive: true, restaurantId, count: 0, totalCoupon: 100, maxCount: 1, uptoAmount: 0 }}
      searchPlaceholder="Search by name or code…"
      columns={[
        {
          key: 'name',
          header: 'Coupon',
          render: (row) => (
            <div>
              <p className="font-medium text-slate-800">{row.name}</p>
              <p className="text-xs text-slate-400">{row.code}</p>
            </div>
          ),
        },
        { key: 'discount', header: 'Discount', render: (row) => (row.discountType === 'flat' ? formatCurrency(row.discount) : `${row.discount}%`) },
        { key: 'expiry', header: 'Expires', render: (row) => formatDate(row.expiryDate, false) },
        { key: 'status', header: 'Status', render: (row) => <ActiveBadge active={row.isActive} /> },
      ]}
    />
  )
}
