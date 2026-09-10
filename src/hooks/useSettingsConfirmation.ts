import { useRef, useState } from 'react'
import { useSettingsConfirmationFlag } from '@/context/SettingsConfirmationContext'

/**
 * Gates a save behind the confirmation-password dialog when AppConfig's settingsConfirmationEnabled
 * flag is on (deploy-time only — see pureeats.settings.confirmation-password in application.yml,
 * there's no admin-panel UI to change it) — every save call site (WiredSettingsGroupCard,
 * GoogleMapsConfigPanel, RazorpayConfigPanel, FirebaseConfigPanel) uses this the same way:
 *
 *   const { requestConfirmation, open, handleConfirm, handleCancel } = useSettingsConfirmation()
 *   async function handleSave() {
 *     const confirmPassword = await requestConfirmation()
 *     if (confirmPassword === null) return // admin cancelled
 *     await save(extraWrite, confirmPassword)
 *   }
 *   return <>{open && <ConfirmPasswordDialog onConfirm={handleConfirm} onCancel={handleCancel} />}...</>
 *
 * When the flag is off, requestConfirmation() resolves immediately to '' so callers never need their
 * own enabled/disabled branch. The actual password check happens server-side on the save that
 * follows — a wrong entry surfaces through the panel's own existing save-error UI like any other
 * save failure, rather than a bespoke retry loop living in the dialog itself.
 */
export function useSettingsConfirmation() {
  const { enabled } = useSettingsConfirmationFlag()
  const [open, setOpen] = useState(false)
  const resolveRef = useRef<((password: string | null) => void) | null>(null)

  function requestConfirmation(): Promise<string | null> {
    if (!enabled) return Promise.resolve('')
    setOpen(true)
    return new Promise((resolve) => {
      resolveRef.current = resolve
    })
  }

  function handleConfirm(password: string) {
    setOpen(false)
    resolveRef.current?.(password)
  }

  function handleCancel() {
    setOpen(false)
    resolveRef.current?.(null)
  }

  return { requestConfirmation, open, handleConfirm, handleCancel }
}
