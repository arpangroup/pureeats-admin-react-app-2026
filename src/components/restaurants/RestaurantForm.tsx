import { Field, Select, Switch, TextInput, Textarea } from '@/components/ui/FormControls'
import { locations, restaurantCategories } from '@/mocks/fixtures'
import type { Restaurant } from '@/types/entities'

interface RestaurantFormProps {
  values: Partial<Restaurant>
  onChange: <K extends keyof Restaurant>(key: K, value: Restaurant[K]) => void
  isAdmin?: boolean
}

export function RestaurantForm({ values, onChange, isAdmin = true }: RestaurantFormProps) {
  return (
    <div className="space-y-6">
      <section>
        <h3 className="mb-3 text-sm font-semibold text-slate-700">Basic information</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Restaurant name" required>
            <TextInput value={values.name ?? ''} onChange={(e) => onChange('name', e.target.value)} />
          </Field>
          <Field label="Contact number" required>
            <TextInput value={values.contactNumber ?? ''} onChange={(e) => onChange('contactNumber', e.target.value)} />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Description">
              <Textarea value={values.description ?? ''} onChange={(e) => onChange('description', e.target.value)} />
            </Field>
          </div>
          <Field label="Opening time" required>
            <TextInput type="time" value={values.openingTime ?? ''} onChange={(e) => onChange('openingTime', e.target.value)} />
          </Field>
          <Field label="Closing time" required>
            <TextInput type="time" value={values.closingTime ?? ''} onChange={(e) => onChange('closingTime', e.target.value)} />
          </Field>
          <Field label="Pure veg only">
            <Switch checked={!!values.isPureveg} onChange={(v) => onChange('isPureveg', v)} />
          </Field>
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold text-slate-700">Location</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Serviceable location" required>
            <Select value={values.locationId ?? ''} onChange={(e) => onChange('locationId', Number(e.target.value))}>
              <option value="" disabled>Select location</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>{loc.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="Pincode">
            <TextInput value={values.pincode ?? ''} onChange={(e) => onChange('pincode', e.target.value)} />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Address" required>
              <Textarea value={values.address ?? ''} onChange={(e) => onChange('address', e.target.value)} />
            </Field>
          </div>
          <Field label="Landmark">
            <TextInput value={values.landmark ?? ''} onChange={(e) => onChange('landmark', e.target.value)} />
          </Field>
          {isAdmin && (
            <Field label="Cuisine categories" hint="Hold Ctrl/Cmd to select multiple">
              <select
                multiple
                className="input h-24"
                value={(values.categoryIds ?? []).map(String)}
                onChange={(e) =>
                  onChange(
                    'categoryIds',
                    Array.from(e.target.selectedOptions).map((opt) => Number(opt.value)),
                  )
                }
              >
                {restaurantCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </Field>
          )}
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold text-slate-700">Delivery &amp; charges</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Restaurant charge (₹)">
            <TextInput type="number" value={values.restaurantCharges ?? 0} onChange={(e) => onChange('restaurantCharges', Number(e.target.value))} />
          </Field>
          <Field label="Base delivery charge (₹)">
            <TextInput type="number" value={values.baseDeliveryCharge ?? 0} onChange={(e) => onChange('baseDeliveryCharge', Number(e.target.value))} />
          </Field>
          <Field label="Min order value (₹)">
            <TextInput type="number" value={values.minOrderPrice ?? 0} onChange={(e) => onChange('minOrderPrice', Number(e.target.value))} />
          </Field>
          <Field label="Delivery radius (km)">
            <TextInput type="number" value={values.deliveryRadius ?? 0} onChange={(e) => onChange('deliveryRadius', Number(e.target.value))} />
          </Field>
          <Field label="Prep + delivery time (min)">
            <TextInput type="number" value={values.deliveryTime ?? 0} onChange={(e) => onChange('deliveryTime', Number(e.target.value))} />
          </Field>
          <Field label="Delivery type">
            <Select value={values.deliveryType ?? 'platform-rider'} onChange={(e) => onChange('deliveryType', e.target.value as Restaurant['deliveryType'])}>
              <option value="platform-rider">Platform riders</option>
              <option value="own-rider">Own riders</option>
              <option value="both">Both</option>
            </Select>
          </Field>
          <Field label="Accepts cash on delivery">
            <Switch checked={!!values.isAcceptCod} onChange={(v) => onChange('isAcceptCod', v)} />
          </Field>
          <Field label="Schedule orders in advance">
            <Switch checked={!!values.isSchedulable} onChange={(v) => onChange('isSchedulable', v)} />
          </Field>
          <Field label="Auto-accept new orders">
            <Switch checked={!!values.autoAcceptable} onChange={(v) => onChange('autoAcceptable', v)} />
          </Field>
        </div>
      </section>

      {isAdmin && (
        <section>
          <h3 className="mb-3 text-sm font-semibold text-slate-700">Admin controls</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="Commission rate (%)">
              <TextInput type="number" value={values.commissionRate ?? 0} onChange={(e) => onChange('commissionRate', Number(e.target.value))} />
            </Field>
            <Field label="Active on platform">
              <Switch checked={!!values.isActive} onChange={(v) => onChange('isActive', v)} />
            </Field>
            <Field label="Application accepted">
              <Switch checked={!!values.isAccepted} onChange={(v) => onChange('isAccepted', v)} />
            </Field>
            <Field label="Featured on homepage">
              <Switch checked={!!values.isFeatured} onChange={(v) => onChange('isFeatured', v)} />
            </Field>
            <Field label="Send push notifications">
              <Switch checked={!!values.isNotifiable} onChange={(v) => onChange('isNotifiable', v)} />
            </Field>
          </div>
        </section>
      )}
    </div>
  )
}
