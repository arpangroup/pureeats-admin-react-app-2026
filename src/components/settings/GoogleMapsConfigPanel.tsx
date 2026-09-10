import { Check, MapPin } from 'lucide-react'
import { SectionCard } from '@/components/ui/SectionCard'
import { Field, TextInput } from '@/components/ui/FormControls'
import { LoadingBlock } from '@/components/ui/Feedback'
import { useAppConfigAdminForm } from '@/hooks/useAppConfigAdminForm'
import { useSettingsConfirmation } from '@/hooks/useSettingsConfirmation'
import { ConfirmPasswordDialog } from './ConfirmPasswordDialog'
import { SettingsLoadError } from './SettingsLoadError'

/** The real, backend-wired Google Maps key field — lives here (rather than the generic settings schema) because it's a typed AppConfig field the customer app reads directly. See useAppConfigAdminForm. */
export function GoogleMapsConfigPanel() {
  const { draft, isLoading, loadError, reload, set, save, saving, saveError, savedAt, isDirty } = useAppConfigAdminForm()
  const { requestConfirmation, open: confirmOpen, handleConfirm, handleCancel } = useSettingsConfirmation()

  if (isLoading) return <LoadingBlock />
  if (loadError || !draft) return <SettingsLoadError title="Google Maps" icon={MapPin} error={loadError} onRetry={reload} />

  async function handleSave() {
    const confirmPassword = await requestConfirmation()
    if (confirmPassword === null) return
    await save(undefined, confirmPassword)
  }

  return (
    <SectionCard
      title="Google Maps"
      icon={MapPin}
      description="Powers the address picker and order-tracking map in the customer app."
      actions={
        <div className="flex items-center gap-3">
          {savedAt && !saveError && !isDirty && (
            <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              <Check size={13} /> Saved
            </span>
          )}
          <button className="btn-primary shrink-0" onClick={handleSave} disabled={saving || !isDirty}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      }
    >
      {confirmOpen && <ConfirmPasswordDialog onConfirm={handleConfirm} onCancel={handleCancel} />}
      {saveError && <p className="mb-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">{saveError}</p>}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="API key" hint="Restrict this key to your app's domains in the Google Cloud console.">
          <TextInput
            type="password"
            autoComplete="off"
            value={draft.googleMapsApiKey ?? ''}
            placeholder="AIza…"
            onChange={(e) => set('googleMapsApiKey', e.target.value || null)}
          />
        </Field>
      </div>
    </SectionCard>
  )
}
