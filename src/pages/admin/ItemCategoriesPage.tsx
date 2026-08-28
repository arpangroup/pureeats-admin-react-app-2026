import { ResourceListPage } from '@/components/resource/ResourceListPage'
import { ActiveBadge } from '@/components/ui/Feedback'
import { itemCategoryService } from '@/services/simpleServices'
import type { ItemCategory } from '@/types/entities'
import type { FormFieldConfig } from '@/components/resource/resourceTypes'

const fields: FormFieldConfig<ItemCategory>[] = [
  { name: 'name', label: 'Category name', type: 'text', required: true, colSpan: 2 },
  { name: 'isEnabled', label: 'Enabled', type: 'switch' },
]

export default function ItemCategoriesPage() {
  return (
    <ResourceListPage<ItemCategory>
      title="Item Categories"
      description="Group menu items into categories like Starters, Mains and Beverages."
      service={itemCategoryService}
      formFields={fields}
      defaultValues={{ isEnabled: true, userId: 1 }}
      searchPlaceholder="Search categories…"
      columns={[
        { key: 'name', header: 'Name', render: (row) => <span className="font-medium text-slate-800">{row.name}</span> },
        { key: 'status', header: 'Status', render: (row) => <ActiveBadge active={row.isEnabled} activeLabel="Enabled" inactiveLabel="Disabled" /> },
      ]}
    />
  )
}
