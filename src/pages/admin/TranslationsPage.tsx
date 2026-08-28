import { ResourceListPage } from '@/components/resource/ResourceListPage'
import { ActiveBadge, Badge } from '@/components/ui/Feedback'
import { translationService } from '@/services/simpleServices'
import type { Translation } from '@/types/entities'
import type { FormFieldConfig } from '@/components/resource/resourceTypes'

const fields: FormFieldConfig<Translation>[] = [
  { name: 'languageName', label: 'Language name', type: 'text', required: true },
  { name: 'languageCode', label: 'Language code', type: 'text', required: true, placeholder: 'e.g. en, hi, kn' },
  { name: 'isDefault', label: 'Default language', type: 'switch' },
  { name: 'isActive', label: 'Active', type: 'switch' },
]

export default function TranslationsPage() {
  return (
    <ResourceListPage<Translation>
      title="Translations"
      description="Languages available across the customer app."
      service={translationService}
      formFields={fields}
      defaultValues={{ isDefault: false, isActive: true, data: {} }}
      searchPlaceholder="Search languages…"
      columns={[
        {
          key: 'name',
          header: 'Language',
          render: (row) => (
            <div className="flex items-center gap-2">
              <span className="font-medium text-slate-800 dark:text-slate-100">{row.languageName}</span>
              <Badge tone="slate">{row.languageCode}</Badge>
              {row.isDefault && <Badge tone="blue">Default</Badge>}
            </div>
          ),
        },
        { key: 'keys', header: 'Translated keys', render: (row) => Object.keys(row.data).length },
        { key: 'status', header: 'Status', render: (row) => <ActiveBadge active={row.isActive} /> },
      ]}
    />
  )
}
