import { Field, Select, Switch, TextInput, Textarea } from '@/components/ui/FormControls'
import { ImageUpload } from '@/components/ui/ImageUpload'
import { itemCategories, restaurants } from '@/mocks/fixtures'
import { itemService } from '@/services/itemService'
import { addonCategoryService } from '@/services/simpleServices'
import { useAsync } from '@/hooks/useAsync'
import { IS_MOCK } from '@/config/env'
import { classNames } from '@/lib/format'
import type { Item } from '@/types/entities'

interface ItemFormProps {
  values: Partial<Item>
  onChange: <K extends keyof Item>(key: K, value: Item[K]) => void
  showRestaurantPicker?: boolean
}

export function ItemForm({ values, onChange, showRestaurantPicker = true }: ItemFormProps) {
  const { data: addonCategoryPage } = useAsync(() => addonCategoryService.list({ perPage: 100 }), [])
  const addonCategoriesAvailable = addonCategoryPage?.data ?? []
  const addonCategoryIds = values.addonCategoryIds ?? []

  function toggleAddonCategory(id: number) {
    onChange('addonCategoryIds', addonCategoryIds.includes(id) ? addonCategoryIds.filter((c) => c !== id) : [...addonCategoryIds, id])
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        {!IS_MOCK && !values.id ? (
          <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
            Save the item first, then edit it to add a photo.
          </p>
        ) : (
          <ImageUpload
            value={values.image}
            onChange={(v) => onChange('image', v ?? '')}
            hint="Shown in the menu and item cards."
            onFileSelected={!IS_MOCK && values.id ? (file) => itemService.uploadImage(values.id as number, file) : undefined}
          />
        )}
      </div>
      {showRestaurantPicker && (
        <Field label="Restaurant" required>
          <Select value={values.restaurantId ?? ''} onChange={(e) => onChange('restaurantId', Number(e.target.value))}>
            <option value="" disabled>Select restaurant</option>
            {restaurants.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </Select>
        </Field>
      )}
      <Field label="Item name" required>
        <TextInput value={values.name ?? ''} onChange={(e) => onChange('name', e.target.value)} />
      </Field>
      <div className="sm:col-span-2">
        <Field label="Description">
          <Textarea value={values.desc ?? ''} onChange={(e) => onChange('desc', e.target.value)} />
        </Field>
      </div>
      <Field label="Category" required>
        <Select value={values.itemCategoryId ?? ''} onChange={(e) => onChange('itemCategoryId', Number(e.target.value))}>
          <option value="" disabled>Select category</option>
          {itemCategories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </Select>
      </Field>
      <Field label="Veg / Non-veg">
        <Select value={values.isVeg ? 'veg' : 'non-veg'} onChange={(e) => onChange('isVeg', e.target.value === 'veg')}>
          <option value="veg">Vegetarian</option>
          <option value="non-veg">Non-vegetarian</option>
        </Select>
      </Field>
      <Field label="Price (₹)" required>
        <TextInput type="number" value={values.price ?? 0} onChange={(e) => onChange('price', Number(e.target.value))} />
      </Field>
      <Field label="Old / strike-through price (₹)">
        <TextInput
          type="number"
          value={values.oldPrice ?? ''}
          onChange={(e) => onChange('oldPrice', e.target.value === '' ? null : Number(e.target.value))}
        />
      </Field>
      <div className="sm:col-span-2">
        <Field
          label="Addon categories"
          hint={addonCategoryIds.length ? `${addonCategoryIds.length} selected — click again to remove` : 'Click every addon group this item offers, e.g. Toppings, Spice level'}
        >
          <div className="flex flex-wrap gap-2">
            {addonCategoriesAvailable.map((ac) => {
              const selected = addonCategoryIds.includes(ac.id)
              return (
                <button
                  key={ac.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => toggleAddonCategory(ac.id)}
                  className={classNames(
                    'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                    selected
                      ? 'border-brand-500 bg-brand-50 text-brand-700 dark:border-brand-500 dark:bg-brand-500/10 dark:text-brand-400'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:border-slate-600 dark:hover:bg-slate-800',
                  )}
                >
                  {ac.name}
                </button>
              )
            })}
            {addonCategoriesAvailable.length === 0 && (
              <p className="text-xs text-slate-400 dark:text-slate-500">No addon categories yet — add some under Addon Categories first.</p>
            )}
          </div>
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:col-span-2 sm:grid-cols-4">
        <Field label="Active">
          <Switch checked={!!values.isActive} onChange={(v) => onChange('isActive', v)} />
        </Field>
        <Field label="Recommended">
          <Switch checked={!!values.isRecommended} onChange={(v) => onChange('isRecommended', v)} />
        </Field>
        <Field label="Popular">
          <Switch checked={!!values.isPopular} onChange={(v) => onChange('isPopular', v)} />
        </Field>
        <Field label="New">
          <Switch checked={!!values.isNew} onChange={(v) => onChange('isNew', v)} />
        </Field>
      </div>
    </div>
  )
}
