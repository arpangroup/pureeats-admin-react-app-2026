import { Bell, Check } from 'lucide-react'
import { SectionCard } from '@/components/ui/SectionCard'
import { Field, TextInput } from '@/components/ui/FormControls'
import { LoadingBlock } from '@/components/ui/Feedback'
import { useAppConfigAdminForm } from '@/hooks/useAppConfigAdminForm'
import { useSettingsConfirmation } from '@/hooks/useSettingsConfirmation'
import { ConfirmPasswordDialog } from './ConfirmPasswordDialog'
import { SettingsLoadError } from './SettingsLoadError'

/** The real, backend-wired Firebase web config — lives here under Push Notifications (not the generic settings schema) because it's a typed AppConfig record the customer app's firebaseMessaging.ts reads directly, falling back to a build-time env var per field until these are set. See useAppConfigAdminForm. */
export function FirebaseConfigPanel() {
  const { draft, isLoading, loadError, reload, set, save, saving, saveError, savedAt, isDirty } = useAppConfigAdminForm()
  const { requestConfirmation, open: confirmOpen, handleConfirm, handleCancel } = useSettingsConfirmation()

  if (isLoading) return <LoadingBlock />
  if (loadError || !draft) return <SettingsLoadError title="Firebase Cloud Messaging" icon={Bell} error={loadError} onRetry={reload} />

  async function handleSave() {
    const confirmPassword = await requestConfirmation()
    if (confirmPassword === null) return
    await save(undefined, confirmPassword)
  }

  return (
    <SectionCard
      title="Firebase Cloud Messaging"
      icon={Bell}
      description="Web app config for push notifications — from Firebase console → Project settings → General → Your apps."
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
        <Field label="API key">
          <TextInput type="password" autoComplete="off" value={draft.firebaseApiKey ?? ''} onChange={(e) => set('firebaseApiKey', e.target.value || null)} />
        </Field>
        <Field label="Auth domain">
          <TextInput value={draft.firebaseAuthDomain ?? ''} placeholder="your-app.firebaseapp.com" onChange={(e) => set('firebaseAuthDomain', e.target.value || null)} />
        </Field>
        <Field label="Project ID">
          <TextInput value={draft.firebaseProjectId ?? ''} onChange={(e) => set('firebaseProjectId', e.target.value || null)} />
        </Field>
        <Field label="Storage bucket">
          <TextInput value={draft.firebaseStorageBucket ?? ''} placeholder="your-app.appspot.com" onChange={(e) => set('firebaseStorageBucket', e.target.value || null)} />
        </Field>
        <Field label="Messaging sender ID">
          <TextInput value={draft.firebaseMessagingSenderId ?? ''} onChange={(e) => set('firebaseMessagingSenderId', e.target.value || null)} />
        </Field>
        <Field label="App ID">
          <TextInput value={draft.firebaseAppId ?? ''} onChange={(e) => set('firebaseAppId', e.target.value || null)} />
        </Field>
        <Field label="VAPID key" hint="Project settings → Cloud Messaging → Web configuration.">
          <TextInput type="password" autoComplete="off" value={draft.firebaseVapidKey ?? ''} onChange={(e) => set('firebaseVapidKey', e.target.value || null)} />
        </Field>
      </div>
    </SectionCard>
  )
}
