import { ResourceListPage } from '@/components/resource/ResourceListPage'
import { ActiveBadge } from '@/components/ui/Feedback'
import { restaurantCategoryService } from '@/services/simpleServices'
import type { RestaurantCategory } from '@/types/entities'
import type { FormFieldConfig } from '@/components/resource/resourceTypes'

const fields: FormFieldConfig<RestaurantCategory>[] = [
  { name: 'name', label: 'Category name', type: 'text', required: true, colSpan: 2 },
  { name: 'isActive', label: 'Active', type: 'switch' },
]

export default function RestaurantCategoriesPage() {
  return (
    <ResourceListPage<RestaurantCategory>
      title="Store Category"
      description="Cuisine/category tags used to organize and filter restaurants."
      service={restaurantCategoryService}
      formFields={fields}
      defaultValues={{ isActive: true }}
      searchPlaceholder="Search categories…"
      createLabel="Add Category"
      columns={[
        { key: 'name', header: 'Name', render: (row) => <span className="font-medium text-slate-800 dark:text-slate-100">{row.name}</span> },
        { key: 'status', header: 'Status', render: (row) => <ActiveBadge active={row.isActive} /> },
      ]}
    />
  )
}
