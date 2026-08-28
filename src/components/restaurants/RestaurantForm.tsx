import { Bike, Clock, FileBadge, Image as ImageIcon, MapPin, Settings2, ShieldCheck } from 'lucide-react'
import { Field, Select, Switch, TextInput, Textarea } from '@/components/ui/FormControls'
import { ImageUpload } from '@/components/ui/ImageUpload'
import { ImageGalleryUpload } from '@/components/ui/ImageGalleryUpload'
import { MapEmbed } from '@/components/ui/MapEmbed'
import { SectionCard } from '@/components/ui/SectionCard'
import { AuditInfo } from '@/components/ui/AuditInfo'
import { locations, restaurantCategories } from '@/mocks/fixtures'
import type { Restaurant } from '@/types/entities'

interface RestaurantFormProps {
  values: Partial<Restaurant>
  onChange: <K extends keyof Restaurant>(key: K, value: Restaurant[K]) => void
  isAdmin?: boolean
  isNew?: boolean
}

export function RestaurantForm({ values, onChange, isAdmin = true, isNew = false }: RestaurantFormProps) {
  return (
    <div className="space-y-5">
      <SectionCard title="Basic information" description="Basic details about the restaurant" icon={Settings2}>
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
          <Field label="Certificate / Licence number" hint="e.g. FSSAI registration number">
            <TextInput value={values.certificate ?? ''} onChange={(e) => onChange('certificate', e.target.value)} />
          </Field>
          <Field label="Pure veg only">
            <Switch checked={!!values.isPureveg} onChange={(v) => onChange('isPureveg', v)} />
          </Field>
        </div>
      </SectionCard>
      
      <SectionCard title="Restaurant images" description="One main image, plus additional gallery photos." icon={ImageIcon}>
        <ImageUpload
          value={values.image}
          onChange={(v) => onChange('image', v ?? '')}
          fullWidth
          hint="Main image shown across the app — recommended 1200×675px."
        />
        <div className="mt-4">
          <ImageGalleryUpload
            label="Additional photos"
            values={values.images ?? []}
            onChange={(v) => onChange('images', v)}
            hint="Interior, food and ambience shots shown on the restaurant's page."
          />
        </div>
      </SectionCard>

      <SectionCard title="Hours" description="Set the restaurant's operating hours" icon={Clock}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Opening time" required>
            <TextInput type="time" value={values.openingTime ?? ''} onChange={(e) => onChange('openingTime', e.target.value)} />
          </Field>
          <Field label="Closing time" required>
            <TextInput type="time" value={values.closingTime ?? ''} onChange={(e) => onChange('closingTime', e.target.value)} />
          </Field>
        </div>
      </SectionCard>

      <SectionCard title="Location" description="Enter the restaurant's location details" icon={MapPin}>
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

          <div className="sm:col-span-2 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Latitude">
              <TextInput
                type="number"
                step="any"
                value={values.latitude ?? 0}
                onChange={(e) => onChange('latitude', Number(e.target.value))}
              />
            </Field>
            <Field label="Longitude">
              <TextInput
                type="number"
                step="any"
                value={values.longitude ?? 0}
                onChange={(e) => onChange('longitude', Number(e.target.value))}
              />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <MapEmbed lat={values.latitude} lng={values.longitude} showCoordinatesNote />
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Delivery &amp; charges" description="Manage delivery options and pricing" icon={Bike}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Restaurant charge [Packing/Extra] (₹) ">
            <TextInput type="number" value={values.restaurantCharges ?? 0} onChange={(e) => onChange('restaurantCharges', Number(e.target.value))} />
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
            <Select value={values.deliveryType ?? 'delivery'} onChange={(e) => onChange('deliveryType', e.target.value as Restaurant['deliveryType'])}>
              <option value="self-pickup">Self Pickup</option>
              <option value="delivery">Delivery</option>
              <option value="both">Both</option>
            </Select>
          </Field>
          <Field label="Delivery charge type">
            <Select value={values.deliveryChargeType ?? 'fixed'} onChange={(e) => onChange('deliveryChargeType', e.target.value as Restaurant['deliveryChargeType'])}>
              <option value="fixed">Fixed</option>
              <option value="dynamic">Dynamic</option>
            </Select>
          </Field>

          {values.deliveryChargeType === 'dynamic' ? (
            <>
              <Field label="Base delivery charge (₹)">
                <TextInput type="number" value={values.baseDeliveryCharge ?? 0} onChange={(e) => onChange('baseDeliveryCharge', Number(e.target.value))} />
              </Field>
              <Field label="Base delivery distance (km)">
                <TextInput type="number" value={values.baseDeliveryDistance ?? 0} onChange={(e) => onChange('baseDeliveryDistance', Number(e.target.value))} />
              </Field>
              <Field label="Extra delivery charge (₹)">
                <TextInput type="number" value={values.extraDeliveryCharge ?? 0} onChange={(e) => onChange('extraDeliveryCharge', Number(e.target.value))} />
              </Field>
              <Field label="Extra delivery distance (km)">
                <TextInput type="number" value={values.extraDeliveryDistance ?? 0} onChange={(e) => onChange('extraDeliveryDistance', Number(e.target.value))} />
              </Field>
              <div className="sm:col-span-3">
                <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
                  Base delivery charges will be applied to the base delivery distance. And for every extra delivery
                  distance, extra delivery charge will be applied.
                </p>
              </div>
            </>
          ) : (
            <Field label="Delivery charge (₹)">
              <TextInput type="number" value={values.baseDeliveryCharge ?? 0} onChange={(e) => onChange('baseDeliveryCharge', Number(e.target.value))} />
            </Field>
          )}

          <Field label="Accept Cash on Delivery">
            <Switch checked={!!values.isAcceptCod} onChange={(v) => onChange('isAcceptCod', v)} />
          </Field>
          <Field label="Automatic Scheduling">
            <Switch checked={!!values.isSchedulable} onChange={(v) => onChange('isSchedulable', v)} />
          </Field>
          <Field label="SMS Notification for New Orders">
            <Switch checked={!!values.isNotifiable} onChange={(v) => onChange('isNotifiable', v)} />
          </Field>
        </div>
      </SectionCard>

      {isAdmin && (
        <SectionCard title="Admin controls" icon={ShieldCheck}>
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
            <Field label="Auto-accept new orders">
              <Switch checked={!!values.autoAcceptable} onChange={(v) => onChange('autoAcceptable', v)} />
            </Field>
          </div>
        </SectionCard>
      )}

      {!isNew && values.createdAt && values.updatedAt && (
        <SectionCard title="Record info" icon={FileBadge}>
          <AuditInfo
            createdAt={values.createdAt}
            updatedAt={values.updatedAt}
            createdBy={values.createdBy}
            updatedBy={values.updatedBy}
          />
        </SectionCard>
      )}
    </div>
  )
}
