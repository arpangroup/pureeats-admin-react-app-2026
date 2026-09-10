import { useEffect, useState } from 'react'
import { Bell, Check, KeyRound, MapPin } from 'lucide-react'
import { SectionCard } from '@/components/ui/SectionCard'
import { Field, TextInput } from '@/components/ui/FormControls'
import { LoadingBlock } from '@/components/ui/Feedback'
import { useAsync } from '@/hooks/useAsync'
import { appConfigService, type AppConfigAdmin } from '@/services/appConfigService'

/**
 * The real, backend-wired counterpart to the preview-only DynamicSettingsForm fields already sitting
 * under the "Google Map" and "Push Notifications" tabs, and the Razorpay group under "Payment
 * Gateways" — those still exist and are untouched, but nothing persists them (see PreviewOnlyNote
 * on this same page). This panel is the one place these three integrations actually save, and it's
 * what the customer app's AppConfigContext reads: GET/PUT /admin/app-config, the same endpoint every
 * other real admin-editable feature flag will eventually move onto.
 */
export function CustomerAppConfigPanel() {
  const { data: config, isLoading, reload } = useAsync(() => appConfigService.getAdmin(), [])
  const [draft, setDraft] = useState<AppConfigAdmin | null>(null)
  const [razorpaySecretInput, setRazorpaySecretInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [savedAt, setSavedAt] = useState<Date | null>(null)

  useEffect(() => {
    if (config && !draft) setDraft(config)
  }, [config, draft])

  function set<K extends keyof AppConfigAdmin>(key: K, value: AppConfigAdmin[K]) {
    setDraft((prev) => (prev ? { ...prev, [key]: value } : prev))
    setSavedAt(null)
  }

  async function handleSave() {
    if (!draft) return
    setSaving(true)
    setSaveError(null)
    try {
      const { razorpayKeySecretSet: _razorpayKeySecretSet, ...rest } = draft
      const updated = await appConfigService.updateAdmin({
        ...rest,
        razorpayKeySecret: razorpaySecretInput.trim() || undefined,
      })
      setDraft(updated)
      setRazorpaySecretInput('')
      setSavedAt(new Date())
      reload()
    } catch (err) {
      setSaveError((err as { message?: string })?.message ?? 'Could not save these settings')
    } finally {
      setSaving(false)
    }
  }

  if (isLoading || !draft) return <LoadingBlock />

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/50">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          These three sections are live — saved here, the customer app picks them up the next time it fetches its config.
        </p>
        <div className="flex items-center gap-3">
          {savedAt && !saveError && <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400"><Check size={13} /> Saved</span>}
          <button className="btn-primary shrink-0" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>

      {saveError && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">{saveError}</p>}

      <SectionCard title="Google Maps" icon={MapPin} description="Powers the address picker and order-tracking map in the customer app.">
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

      <SectionCard title="Razorpay" icon={KeyRound} description="Payment gateway behind the customer app's UPI checkout option.">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Key ID">
            <TextInput value={draft.razorpayKeyId ?? ''} placeholder="rzp_live_…" onChange={(e) => set('razorpayKeyId', e.target.value || null)} />
          </Field>
          <Field
            label="Secret key"
            hint={draft.razorpayKeySecretSet ? 'A secret is already saved — leave this blank to keep it, or enter a new one to replace it.' : 'Not set yet — checkout falls back to a plain UPI link until this is configured.'}
          >
            <TextInput
              type="password"
              autoComplete="off"
              value={razorpaySecretInput}
              placeholder={draft.razorpayKeySecretSet ? '•••••••• (unchanged)' : 'Enter a secret key'}
              onChange={(e) => setRazorpaySecretInput(e.target.value)}
            />
          </Field>
        </div>
      </SectionCard>

      <SectionCard title="Firebase Cloud Messaging" icon={Bell} description="Web app config for push notifications — from Firebase console → Project settings → General → Your apps.">
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
    </div>
  )
}
