import { ResourceListPage } from '@/components/resource/ResourceListPage'
import { ActiveBadge } from '@/components/ui/Feedback'
import { restaurantCategorySliderService } from '@/services/simpleServices'
import { restaurantCategories } from '@/mocks/fixtures'
import type { RestaurantCategorySlider } from '@/types/entities'
import type { FormFieldConfig } from '@/components/resource/resourceTypes'

const fields: FormFieldConfig<RestaurantCategorySlider>[] = [
  { name: 'name', label: 'Slider name', type: 'text', required: true, colSpan: 2 },
  { name: 'isActive', label: 'Active', type: 'switch' },
]

export default function RestaurantCategorySliderPage() {
  return (
    <ResourceListPage<RestaurantCategorySlider>
      title="Category Sliders"
      description="Curated groups of restaurant categories shown on the homepage."
      service={restaurantCategorySliderService}
      formFields={fields}
      defaultValues={{ isActive: true, categoriesIds: [], image: '', imagePlaceholder: '' }}
      searchPlaceholder="Search sliders…"
      columns={[
        { key: 'name', header: 'Name', render: (row) => <span className="font-medium text-slate-800">{row.name}</span> },
        {
          key: 'categories',
          header: 'Categories',
          render: (row) => (
            <span className="text-slate-500">
              {row.categoriesIds.map((id) => restaurantCategories.find((c) => c.id === id)?.name).filter(Boolean).join(', ') || '—'}
            </span>
          ),
        },
        { key: 'status', header: 'Status', render: (row) => <ActiveBadge active={row.isActive} /> },
      ]}
    />
  )
}
