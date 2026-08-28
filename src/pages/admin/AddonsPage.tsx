import { ResourceListPage } from '@/components/resource/ResourceListPage'
import { ActiveBadge } from '@/components/ui/Feedback'
import { addonService } from '@/services/simpleServices'
import { addonCategories } from '@/mocks/fixtures'
import { formatCurrency } from '@/lib/format'
import type { Addon } from '@/types/entities'
import type { FormFieldConfig } from '@/components/resource/resourceTypes'

const fields: FormFieldConfig<Addon>[] = [
  { name: 'name', label: 'Addon name', type: 'text', required: true },
  { name: 'price', label: 'Price (₹)', type: 'number', required: true },
  {
    name: 'addonCategoryId',
    label: 'Addon category',
    type: 'select',
    required: true,
    options: addonCategories.map((c) => ({ label: c.name, value: c.id })),
  },
  { name: 'isActive', label: 'Active', type: 'switch' },
]

export default function AddonsPage() {
  return (
    <ResourceListPage<Addon>
      title="Addons"
      description="Individual add-on options customers can choose, like Extra Cheese or Mild."
      service={addonService}
      formFields={fields}
      defaultValues={{ price: 0, isActive: true, userId: 1 }}
      searchPlaceholder="Search addons…"
      columns={[
        { key: 'name', header: 'Name', render: (row) => <span className="font-medium text-slate-800 dark:text-slate-100">{row.name}</span> },
        { key: 'category', header: 'Category', render: (row) => addonCategories.find((c) => c.id === row.addonCategoryId)?.name ?? '—' },
        { key: 'price', header: 'Price', render: (row) => formatCurrency(row.price) },
        { key: 'status', header: 'Status', render: (row) => <ActiveBadge active={row.isActive} /> },
      ]}
    />
  )
}
