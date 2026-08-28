import { ResourceListPage } from '@/components/resource/ResourceListPage'
import { pageService } from '@/services/simpleServices'
import { formatDate } from '@/lib/format'
import type { Page } from '@/types/entities'
import type { FormFieldConfig } from '@/components/resource/resourceTypes'

const fields: FormFieldConfig<Page>[] = [
  { name: 'name', label: 'Page title', type: 'text', required: true },
  { name: 'slug', label: 'URL slug', type: 'text', required: true, placeholder: 'e.g. about-us' },
  { name: 'body', label: 'Content (HTML)', type: 'textarea', required: true, colSpan: 2 },
]

export default function PagesPage() {
  return (
    <ResourceListPage<Page>
      title="Pages"
      description="Static content pages like About Us, Terms and Privacy Policy."
      service={pageService}
      formFields={fields}
      defaultValues={{ body: '' }}
      searchPlaceholder="Search pages…"
      columns={[
        { key: 'name', header: 'Title', render: (row) => <span className="font-medium text-slate-800">{row.name}</span> },
        { key: 'slug', header: 'Slug', render: (row) => <span className="text-slate-500">/{row.slug}</span> },
        { key: 'updated', header: 'Last updated', render: (row) => formatDate(row.updatedAt) },
      ]}
    />
  )
}
