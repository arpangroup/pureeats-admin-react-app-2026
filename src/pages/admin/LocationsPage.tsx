import { ResourceListPage } from '@/components/resource/ResourceListPage'
import { ActiveBadge, Badge } from '@/components/ui/Feedback'
import { locationService } from '@/services/simpleServices'
import type { Location } from '@/types/entities'
import type { FormFieldConfig } from '@/components/resource/resourceTypes'

const fields: FormFieldConfig<Location>[] = [
  { name: 'name', label: 'Location name', type: 'text', required: true },
  { name: 'description', label: 'Description', type: 'textarea', colSpan: 2 },
  { name: 'isPopular', label: 'Popular', type: 'switch' },
  { name: 'isActive', label: 'Active', type: 'switch' },
]

export default function LocationsPage() {
  return (
    <ResourceListPage<Location>
      title="Locations"
      description="Serviceable areas customers can browse restaurants in."
      service={locationService}
      formFields={fields}
      defaultValues={{ isPopular: false, isActive: true }}
      searchPlaceholder="Search locations…"
      columns={[
        { key: 'name', header: 'Name', render: (row) => <span className="font-medium text-slate-800">{row.name}</span> },
        { key: 'description', header: 'Description', render: (row) => <span className="text-slate-500">{row.description}</span> },
        { key: 'popular', header: 'Popular', render: (row) => (row.isPopular ? <Badge tone="amber">Popular</Badge> : '—') },
        { key: 'status', header: 'Status', render: (row) => <ActiveBadge active={row.isActive} /> },
      ]}
    />
  )
}
