import { useState } from 'react'
import { Check, KeyRound } from 'lucide-react'
import { SectionCard } from '@/components/ui/SectionCard'
import { Field, TextInput } from '@/components/ui/FormControls'
import { LoadingBlock } from '@/components/ui/Feedback'
import { useAppConfigAdminForm } from '@/hooks/useAppConfigAdminForm'
import { useSettingsConfirmation } from '@/hooks/useSettingsConfirmation'
import { ConfirmPasswordDialog } from './ConfirmPasswordDialog'
import { SettingsLoadError } from './SettingsLoadError'

/** The real, backend-wired Razorpay Key ID + secret — lives here under Payment Gateways (not the generic settings schema, which the other gateway credentials below use) because the secret needs write-only handling: it's never returned by any GET, and leaving it blank on save preserves whatever's already stored rather than erasing it. See useAppConfigAdminForm and AppConfigService#preserveSecretIfBlank on the backend. */
export function RazorpayConfigPanel() {
  const { draft, isLoading, loadError, reload, set, save, saving, saveError, savedAt, isDirty } = useAppConfigAdminForm()
  const { requestConfirmation, open: confirmOpen, handleConfirm, handleCancel } = useSettingsConfirmation()
  const [secretInput, setSecretInput] = useState('')
  const hasChanges = isDirty || secretInput.trim().length > 0

  if (isLoading) return <LoadingBlock />
  if (loadError || !draft) return <SettingsLoadError title="Razorpay" icon={KeyRound} error={loadError} onRetry={reload} />

  async function handleSave() {
    const confirmPassword = await requestConfirmation()
    if (confirmPassword === null) return
    const ok = await save({ razorpayKeySecret: secretInput.trim() || undefined }, confirmPassword)
    if (ok) setSecretInput('')
  }

  return (
    <SectionCard
      title="Razorpay"
      icon={KeyRound}
      description="Payment gateway behind the customer app's UPI checkout option."
      actions={
        <div className="flex items-center gap-3">
          {savedAt && !saveError && !hasChanges && (
            <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              <Check size={13} /> Saved
            </span>
          )}
          <button className="btn-primary shrink-0" onClick={handleSave} disabled={saving || !hasChanges}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      }
    >
      {confirmOpen && <ConfirmPasswordDialog onConfirm={handleConfirm} onCancel={handleCancel} />}
      {saveError && <p className="mb-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">{saveError}</p>}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Key ID">
          <TextInput value={draft.razorpayKeyId ?? ''} placeholder="rzp_live_…" onChange={(e) => set('razorpayKeyId', e.target.value || null)} />
        </Field>
        <Field
          label="Secret key"
          hint={
            draft.razorpayKeySecretSet
              ? 'A secret is already saved — leave this blank to keep it, or enter a new one to replace it.'
              : 'Not set yet — checkout falls back to a plain UPI link until this is configured.'
          }
        >
          <TextInput
            type="password"
            autoComplete="off"
            value={secretInput}
            placeholder={draft.razorpayKeySecretSet ? '•••••••• (unchanged)' : 'Enter a secret key'}
            onChange={(e) => setSecretInput(e.target.value)}
          />
        </Field>
      </div>
    </SectionCard>
  )
}
