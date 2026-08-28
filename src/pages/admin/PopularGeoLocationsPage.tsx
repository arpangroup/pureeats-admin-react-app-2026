import { ResourceListPage } from '@/components/resource/ResourceListPage'
import { ActiveBadge } from '@/components/ui/Feedback'
import { popularGeoPlaceService } from '@/services/simpleServices'
import type { PopularGeoPlace } from '@/types/entities'
import type { FormFieldConfig } from '@/components/resource/resourceTypes'

const fields: FormFieldConfig<PopularGeoPlace>[] = [
  { name: 'name', label: 'Place name', type: 'text', required: true, colSpan: 2 },
  { name: 'latitude', label: 'Latitude', type: 'number', required: true },
  { name: 'longitude', label: 'Longitude', type: 'number', required: true },
  { name: 'isActive', label: 'Active', type: 'switch' },
]

export default function PopularGeoLocationsPage() {
  return (
    <ResourceListPage<PopularGeoPlace>
      title="Popular Geo Places"
      description="Well-known landmarks shown as quick address suggestions."
      service={popularGeoPlaceService}
      formFields={fields}
      defaultValues={{ latitude: 12.9716, longitude: 77.5946, isActive: true }}
      searchPlaceholder="Search places…"
      columns={[
        { key: 'name', header: 'Name', render: (row) => <span className="font-medium text-slate-800 dark:text-slate-100">{row.name}</span> },
        { key: 'coords', header: 'Coordinates', render: (row) => `${row.latitude.toFixed(4)}, ${row.longitude.toFixed(4)}` },
        { key: 'status', header: 'Status', render: (row) => <ActiveBadge active={row.isActive} /> },
      ]}
    />
  )
}
