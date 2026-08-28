import { Field, Select, Switch, TextInput, Textarea } from '@/components/ui/FormControls'
import type { FormFieldConfig } from './resourceTypes'

interface ResourceFormProps<T> {
  fields: FormFieldConfig<T>[]
  values: Partial<T>
  onChange: (name: keyof T & string, value: unknown) => void
  errors?: Partial<Record<keyof T & string, string>>
}

export function ResourceForm<T>({ fields, values, onChange, errors }: ResourceFormProps<T>) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {fields.map((field) => {
        const value = values[field.name]
        const wrapperClass = field.colSpan === 2 ? 'sm:col-span-2' : undefined

        if (field.type === 'switch') {
          return (
            <div key={field.name} className={wrapperClass}>
              <span className="label">{field.label}</span>
              <Switch checked={Boolean(value)} onChange={(v) => onChange(field.name, v)} />
            </div>
          )
        }

        return (
          <div key={field.name} className={wrapperClass}>
            <Field label={field.label} required={field.required} hint={field.hint} error={errors?.[field.name]}>
              {field.type === 'textarea' && (
                <Textarea
                  value={(value as string) ?? ''}
                  placeholder={field.placeholder}
                  onChange={(e) => onChange(field.name, e.target.value)}
                />
              )}
              {field.type === 'select' && (
                <Select
                  value={(value as string | number) ?? ''}
                  onChange={(e) => {
                    const isNumeric = typeof field.options?.[0]?.value === 'number'
                    onChange(field.name, isNumeric ? Number(e.target.value) : e.target.value)
                  }}
                >
                  <option value="" disabled>
                    Select {field.label.toLowerCase()}
                  </option>
                  {field.options?.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </Select>
              )}
              {(field.type === 'text' || field.type === 'date') && (
                <TextInput
                  type={field.type === 'date' ? 'date' : 'text'}
                  value={(value as string) ?? ''}
                  placeholder={field.placeholder}
                  onChange={(e) => onChange(field.name, e.target.value)}
                />
              )}
              {field.type === 'number' && (
                <TextInput
                  type="number"
                  value={value === undefined || value === null ? '' : String(value)}
                  placeholder={field.placeholder}
                  onChange={(e) => onChange(field.name, e.target.value === '' ? '' : Number(e.target.value))}
                />
              )}
            </Field>
          </div>
        )
      })}
    </div>
  )
}
