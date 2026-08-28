import type { ListParams, Paginated } from '@/types/common'

export interface ResourceService<T> {
  list: (params: ListParams) => Promise<Paginated<T>>
  create?: (payload: Partial<T>) => Promise<T>
  update?: (id: number, payload: Partial<T>) => Promise<T>
  remove?: (id: number) => Promise<void>
}

export type FieldType = 'text' | 'number' | 'textarea' | 'select' | 'switch' | 'date'

export interface FormFieldConfig<T> {
  name: keyof T & string
  label: string
  type: FieldType
  required?: boolean
  options?: { label: string; value: string | number }[]
  placeholder?: string
  hint?: string
  colSpan?: 1 | 2
}
