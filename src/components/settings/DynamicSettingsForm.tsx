import type { ReactNode } from 'react'
import { AlertTriangle, ExternalLink, Info } from 'lucide-react'
import { SectionCard } from '@/components/ui/SectionCard'
import { Field, RadioGroup, Select, Switch, Textarea, TextInput } from '@/components/ui/FormControls'
import type { SettingFieldDef, SettingGroupDef } from '@/config/settingsFieldsConfig'

function FieldNotes({ field }: { field: SettingFieldDef }) {
  if (!field.info && !field.warning && !field.link) return null
  return (
    <div className="mt-1.5 space-y-1">
      {field.info && (
        <p className="flex items-start gap-1.5 text-xs text-slate-400 dark:text-slate-500">
          <Info size={12} className="mt-0.5 shrink-0" />
          <span>{field.info}</span>
        </p>
      )}
      {field.warning && (
        <p className="flex items-start gap-1.5 text-xs text-amber-600 dark:text-amber-400">
          <AlertTriangle size={12} className="mt-0.5 shrink-0" />
          <span>{field.warning}</span>
        </p>
      )}
      {field.link && (
        <a
          href={field.link.href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline dark:text-brand-400"
        >
          <ExternalLink size={12} />
          {field.link.label}
        </a>
      )}
    </div>
  )
}

function DynamicField({
  field,
  value,
  onChange,
}: {
  field: SettingFieldDef
  value: string
  onChange: (value: string) => void
}) {
  let control: ReactNode
  switch (field.fieldType) {
    case 'boolean':
      control = <Switch checked={value === 'true'} onChange={(v) => onChange(String(v))} />
      break
    case 'dropdown':
      control = (
        <Select value={value} onChange={(e) => onChange(e.target.value)}>
          {field.options?.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </Select>
      )
      break
    case 'radio':
      control = <RadioGroup name={field.key} value={value} options={field.options ?? []} onChange={onChange} />
      break
    case 'textarea':
      control = <Textarea value={value} placeholder={field.placeholder} onChange={(e) => onChange(e.target.value)} />
      break
    case 'password':
      control = (
        <TextInput type="password" value={value} placeholder={field.placeholder} autoComplete="off" onChange={(e) => onChange(e.target.value)} />
      )
      break
    case 'number':
      control = <TextInput type="number" value={value} placeholder={field.placeholder} onChange={(e) => onChange(e.target.value)} />
      break
    case 'email':
      control = <TextInput type="email" value={value} placeholder={field.placeholder} onChange={(e) => onChange(e.target.value)} />
      break
    case 'url':
      control = <TextInput type="url" value={value} placeholder={field.placeholder} onChange={(e) => onChange(e.target.value)} />
      break
    default:
      control = <TextInput type="text" value={value} placeholder={field.placeholder} onChange={(e) => onChange(e.target.value)} />
  }

  return (
    <Field label={field.label} required={field.required}>
      {control}
      <FieldNotes field={field} />
    </Field>
  )
}

/** Renders a set of setting groups as SectionCards. Purely presentational — values/onChange are owned by the caller. */
export function DynamicSettingsForm({
  groups,
  values,
  onChange,
}: {
  groups: SettingGroupDef[]
  values: Record<string, string>
  onChange: (key: string, value: string) => void
}) {
  return (
    <>
      {groups.map((group) => (
        <SectionCard key={group.title} title={group.title} description={group.description} icon={group.icon}>
          <div className="grid grid-cols-1 gap-x-4 gap-y-5 sm:grid-cols-2">
            {group.fields.map((field) => (
              <div key={field.key} className={field.fieldType === 'textarea' ? 'sm:col-span-2' : undefined}>
                <DynamicField field={field} value={values[field.key] ?? field.defaultValue} onChange={(v) => onChange(field.key, v)} />
              </div>
            ))}
          </div>
        </SectionCard>
      ))}
    </>
  )
}
