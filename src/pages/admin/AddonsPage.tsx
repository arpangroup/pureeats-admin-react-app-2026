import { ResourceListPage } from '@/components/resource/ResourceListPage'
import { ActiveBadge } from '@/components/ui/Feedback'
import { addonService, addonCategoryService } from '@/services/simpleServices'
import { useAsync } from '@/hooks/useAsync'
import { formatCurrency } from '@/lib/format'
import type { Addon, AddonCategory } from '@/types/entities'
import type { FormFieldConfig } from '@/components/resource/resourceTypes'

export default function AddonsPage() {
  const { data: categoryPage } = useAsync(() => addonCategoryService.list({ perPage: 100 }), [])
  const categories = categoryPage?.data ?? []

  const fields: FormFieldConfig<Addon>[] = [
    { name: 'name', label: 'Addon name', type: 'text', required: true },
    { name: 'price', label: 'Price (₹)', type: 'number', required: true },
    {
      name: 'addonCategoryId',
      label: 'Addon category',
      type: 'select',
      required: true,
      options: categories.map((c: AddonCategory) => ({ label: c.name, value: c.id })),
    },
    { name: 'isActive', label: 'Active', type: 'switch' },
  ]

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
        { key: 'category', header: 'Category', render: (row) => categories.find((c) => c.id === row.addonCategoryId)?.name ?? '—' },
        { key: 'price', header: 'Price', render: (row) => formatCurrency(row.price) },
        { key: 'status', header: 'Status', render: (row) => <ActiveBadge active={row.isActive} /> },
      ]}
    />
  )
}
