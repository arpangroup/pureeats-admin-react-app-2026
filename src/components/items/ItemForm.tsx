import { Field, Select, Switch, TextInput, Textarea } from '@/components/ui/FormControls'
import { itemCategories, addonCategories, restaurants } from '@/mocks/fixtures'
import type { Item } from '@/types/entities'

interface ItemFormProps {
  values: Partial<Item>
  onChange: <K extends keyof Item>(key: K, value: Item[K]) => void
  showRestaurantPicker?: boolean
}

export function ItemForm({ values, onChange, showRestaurantPicker = true }: ItemFormProps) {
  const addonCategoriesAvailable = addonCategories

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
      <Field label="Addon categories" hint="Hold Ctrl/Cmd to select multiple">
        <select
          multiple
          className="input h-24"
          value={(values.addonCategoryIds ?? []).map(String)}
          onChange={(e) =>
            onChange('addonCategoryIds', Array.from(e.target.selectedOptions).map((o) => Number(o.value)))
          }
        >
          {addonCategoriesAvailable.map((ac) => (
            <option key={ac.id} value={ac.id}>{ac.name}</option>
          ))}
        </select>
      </Field>
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
