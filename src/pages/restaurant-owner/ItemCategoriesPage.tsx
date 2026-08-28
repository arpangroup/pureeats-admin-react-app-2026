import { ResourceListPage } from '@/components/resource/ResourceListPage'
import { ActiveBadge } from '@/components/ui/Feedback'
import { itemCategoryService } from '@/services/simpleServices'
import { useAuth } from '@/hooks/useAuth'
import type { ItemCategory } from '@/types/entities'
import type { FormFieldConfig } from '@/components/resource/resourceTypes'

const fields: FormFieldConfig<ItemCategory>[] = [
  { name: 'name', label: 'Category name', type: 'text', required: true, colSpan: 2 },
  { name: 'isEnabled', label: 'Enabled', type: 'switch' },
]

export default function OwnerItemCategoriesPage() {
  const { user } = useAuth()
  return (
    <ResourceListPage<ItemCategory>
      title="Item Categories"
      description="Group your menu items into categories."
      service={itemCategoryService}
      formFields={fields}
      extraParams={{ filters: { userId: user!.id } }}
      defaultValues={{ isEnabled: true, userId: user!.id }}
      searchPlaceholder="Search categories…"
      columns={[
        { key: 'name', header: 'Name', render: (row) => <span className="font-medium text-slate-800">{row.name}</span> },
        { key: 'status', header: 'Status', render: (row) => <ActiveBadge active={row.isEnabled} activeLabel="Enabled" inactiveLabel="Disabled" /> },
      ]}
    />
  )
}
