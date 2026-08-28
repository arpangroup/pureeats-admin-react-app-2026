import { ResourceListPage } from '@/components/resource/ResourceListPage'
import { Badge } from '@/components/ui/Feedback'
import { addonCategoryService } from '@/services/simpleServices'
import { useAuth } from '@/hooks/useAuth'
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

export default function OwnerAddonCategoriesPage() {
  const { user } = useAuth()
  return (
    <ResourceListPage<AddonCategory>
      title="Addon Categories"
      description="Groups of add-ons for your menu items."
      service={addonCategoryService}
      formFields={fields}
      extraParams={{ filters: { userId: user!.id } }}
      defaultValues={{ type: 'single', userId: user!.id }}
      searchPlaceholder="Search addon categories…"
      columns={[
        { key: 'name', header: 'Name', render: (row) => <span className="font-medium text-slate-800">{row.name}</span> },
        { key: 'type', header: 'Type', render: (row) => <Badge tone={row.type === 'single' ? 'blue' : 'purple'}>{row.type}</Badge> },
      ]}
    />
  )
}
