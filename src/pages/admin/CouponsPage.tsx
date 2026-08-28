import { ResourceListPage } from '@/components/resource/ResourceListPage'
import { ActiveBadge, Badge } from '@/components/ui/Feedback'
import { couponService } from '@/services/simpleServices'
import { restaurants } from '@/mocks/fixtures'
import { formatCurrency, formatDate } from '@/lib/format'
import type { Coupon } from '@/types/entities'
import type { FormFieldConfig } from '@/components/resource/resourceTypes'

const fields: FormFieldConfig<Coupon>[] = [
  { name: 'name', label: 'Coupon name', type: 'text', required: true },
  { name: 'code', label: 'Coupon code', type: 'text', required: true, hint: 'Shown to customers, e.g. WELCOME50' },
  { name: 'description', label: 'Description', type: 'textarea', colSpan: 2 },
  {
    name: 'restaurantId',
    label: 'Applies to',
    type: 'select',
    options: [{ label: 'All restaurants', value: 0 }, ...restaurants.map((r) => ({ label: r.name, value: r.id }))],
    hint: '"All restaurants" makes this a platform-wide coupon',
  },
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
  { name: 'uptoAmount', label: 'Max discount (₹)', type: 'number' },
  { name: 'minOrderAmount', label: 'Minimum order value (₹)', type: 'number' },
  { name: 'maxCount', label: 'Uses per customer', type: 'number' },
  { name: 'expiryDate', label: 'Expiry date', type: 'date', required: true },
  { name: 'isActive', label: 'Active', type: 'switch' },
]

export default function CouponsPage() {
  return (
    <ResourceListPage<Coupon>
      title="Coupons"
      description="Discount codes customers can apply at checkout."
      service={couponService}
      formFields={fields}
      defaultValues={{ discountType: 'flat', discount: 0, minOrderAmount: 0, uptoAmount: 0, maxCount: 1, isActive: true, count: 0, totalCoupon: 0, restaurantId: 0 }}
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
        {
          key: 'discount',
          header: 'Discount',
          render: (row) => (row.discountType === 'flat' ? formatCurrency(row.discount) : `${row.discount}%`),
        },
        { key: 'scope', header: 'Applies to', render: (row) => (row.restaurantId ? restaurants.find((r) => r.id === row.restaurantId)?.name ?? '—' : <Badge tone="blue">All restaurants</Badge>) },
        { key: 'expiry', header: 'Expires', render: (row) => formatDate(row.expiryDate, false) },
        { key: 'status', header: 'Status', render: (row) => <ActiveBadge active={row.isActive} /> },
      ]}
    />
  )
}
