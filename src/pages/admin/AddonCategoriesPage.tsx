import { ResourceListPage } from '@/components/resource/ResourceListPage'
import { Badge } from '@/components/ui/Feedback'
import { addonCategoryService } from '@/services/simpleServices'
import type { AddonCategory } from '@/types/entities'
import type { FormFieldConfig } from '@/components/resource/resourceTypes'

const fields: FormFieldConfig<AddonCategory>[] = [
  { name: 'name', label: 'Category name', type: 'text', required: true, colSpan: 2 },
  {
    name: 'type',
    label: 'Selection type',
    type: 'select',
    required: true,
    options: [
      { label: 'Single choice', value: 'single' },
      { label: 'Multiple choice', value: 'multiple' },
    ],
  },
]

export default function AddonCategoriesPage() {
  return (
    <ResourceListPage<AddonCategory>
      title="Addon Categories"
      description="Groups of add-ons, like Spice Level or Extra Toppings."
      service={addonCategoryService}
      formFields={fields}
      defaultValues={{ type: 'single', userId: 1 }}
      searchPlaceholder="Search addon categories…"
      columns={[
        { key: 'name', header: 'Name', render: (row) => <span className="font-medium text-slate-800 dark:text-slate-100">{row.name}</span> },
        { key: 'type', header: 'Type', render: (row) => <Badge tone={row.type === 'single' ? 'blue' : 'purple'}>{row.type}</Badge> },
      ]}
    />
  )
}
