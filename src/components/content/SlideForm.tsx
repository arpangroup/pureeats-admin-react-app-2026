import { Field, Select, Switch, TextInput, Textarea } from '@/components/ui/FormControls'
import { ImageUpload } from '@/components/ui/ImageUpload'
import { slideService, listActiveRestaurantCategories, listActiveRestaurants } from '@/services/simpleServices'
import { useAsync } from '@/hooks/useAsync'
import { IS_MOCK } from '@/config/env'
import type { Slide } from '@/types/entities'

interface SlideFormProps {
  values: Partial<Slide>
  onChange: <K extends keyof Slide>(key: K, value: Slide[K]) => void
}

export function SlideForm({ values, onChange }: SlideFormProps) {
  // The picker options must be the real live restaurant/category list, not mock fixtures - a slide
  // saved with a mock-fixture id would silently link to nothing (or the wrong restaurant/category)
  // once the customer app resolves it against the real backend.
  const { data: categoryOptions } = useAsync(listActiveRestaurantCategories, [])
  const { data: restaurantOptions } = useAsync(listActiveRestaurants, [])

  return (
    <div className="space-y-4">
      {!IS_MOCK && !values.id ? (
        <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
          Save the slide first, then edit it to add a photo.
        </p>
      ) : (
        <ImageUpload
          value={values.image}
          onChange={(v) => onChange('image', v ?? '')}
          fullWidth
          hint="Recommended 1200×500px."
          onFileSelected={!IS_MOCK && values.id ? (file) => slideService.uploadImage(values.id as number, file) : undefined}
        />
      )}
      <Field label="Slide name" required>
        <TextInput value={values.name ?? ''} onChange={(e) => onChange('name', e.target.value)} />
      </Field>
      <Field label="Description">
        <Textarea value={values.description ?? ''} onChange={(e) => onChange('description', e.target.value)} />
      </Field>

      <Field label="Links to" hint="Where tapping this slide takes the customer">
        <Select
          value={values.linkType ?? 'none'}
          onChange={(e) => {
            const linkType = e.target.value as Slide['linkType']
            onChange('linkType', linkType)
            if (linkType !== 'category') onChange('categoryId', null)
            if (linkType !== 'restaurant') onChange('restaurantId', null)
            if (linkType !== 'url') onChange('url', null)
          }}
        >
          <option value="none">No link</option>
          <option value="category">Store category</option>
          <option value="restaurant">Specific restaurant</option>
          <option value="url">Custom URL</option>
        </Select>
      </Field>

      {values.linkType === 'category' && (
        <Field label="Store category" required>
          <Select value={values.categoryId ?? ''} onChange={(e) => onChange('categoryId', Number(e.target.value))}>
            <option value="" disabled>Select category</option>
            {(categoryOptions ?? []).map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
        </Field>
      )}

      {values.linkType === 'restaurant' && (
        <Field label="Restaurant" required>
          <Select value={values.restaurantId ?? ''} onChange={(e) => onChange('restaurantId', Number(e.target.value))}>
            <option value="" disabled>Select restaurant</option>
            {(restaurantOptions ?? []).map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </Select>
        </Field>
      )}

      {values.linkType === 'url' && (
        <Field label="URL" required hint="Deep link or web URL, e.g. /coupons/WELCOME50">
          <TextInput value={values.url ?? ''} onChange={(e) => onChange('url', e.target.value)} placeholder="https:// or /path" />
        </Field>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Field label="Display order">
          <TextInput type="number" value={values.positionId ?? 1} onChange={(e) => onChange('positionId', Number(e.target.value))} />
        </Field>
        <Field label="Active">
          <Switch checked={!!values.isActive} onChange={(v) => onChange('isActive', v)} />
        </Field>
      </div>
    </div>
  )
}
