import { ResourceListPage } from '@/components/resource/ResourceListPage'
import { ActiveBadge, Badge } from '@/components/ui/Feedback'
import { promoSliderService } from '@/services/simpleServices'
import { locations } from '@/mocks/fixtures'
import type { PromoSlider } from '@/types/entities'
import type { FormFieldConfig } from '@/components/resource/resourceTypes'

const fields: FormFieldConfig<PromoSlider>[] = [
  { name: 'name', label: 'Slider name', type: 'text', required: true, colSpan: 2 },
  {
    name: 'locationId',
    label: 'Location',
    type: 'select',
    options: [{ label: 'All locations', value: 0 }, ...locations.map((l) => ({ label: l.name, value: l.id }))],
  },
  {
    name: 'size',
    label: 'Banner size',
    type: 'select',
    required: true,
    options: [
      { label: 'Small', value: 'small' },
      { label: 'Medium', value: 'medium' },
      { label: 'Large', value: 'large' },
    ],
  },
  { name: 'positionId', label: 'Display order', type: 'number' },
  { name: 'isActive', label: 'Active', type: 'switch' },
]

export default function SlidersPage() {
  return (
    <ResourceListPage<PromoSlider>
      title="Promo Sliders"
      description="Banner slots shown on the customer app home screen."
      service={promoSliderService}
      formFields={fields}
      defaultValues={{ isActive: true, positionId: 1, size: 'medium', locationId: 0 }}
      searchPlaceholder="Search sliders…"
      columns={[
        { key: 'name', header: 'Name', render: (row) => <span className="font-medium text-slate-800">{row.name}</span> },
        { key: 'location', header: 'Location', render: (row) => (row.locationId ? locations.find((l) => l.id === row.locationId)?.name ?? '—' : <Badge tone="blue">All locations</Badge>) },
        { key: 'size', header: 'Size', render: (row) => <span className="capitalize">{row.size}</span> },
        { key: 'status', header: 'Status', render: (row) => <ActiveBadge active={row.isActive} /> },
      ]}
    />
  )
}
