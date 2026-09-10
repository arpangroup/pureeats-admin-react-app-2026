import { useState } from 'react'
import { ShieldAlert } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Field, TextInput } from '@/components/ui/FormControls'

/**
 * The confirmation-password gate shown before any settings save, when AppConfig's
 * settingsConfirmationEnabled flag is on — see useSettingsConfirmation, which owns opening/closing
 * this and resolving the caller's promise with the entered password (or null on cancel). The actual
 * check happens server-side (AppConfigService#verifyConfirmationPassword) as part of the save that
 * follows confirm — a wrong entry surfaces through that panel's own existing save-error UI, the same
 * place any other save failure would.
 */
export function ConfirmPasswordDialog({ onConfirm, onCancel }: { onConfirm: (password: string) => void; onCancel: () => void }) {
  const [password, setPassword] = useState('')

  function handleConfirm() {
    if (!password) return
    onConfirm(password)
  }

  return (
    <Modal
      open
      onClose={onCancel}
      title="Confirm this change"
      size="sm"
      footer={
        <>
          <button className="btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn-primary" onClick={handleConfirm} disabled={!password}>
            Confirm & save
          </button>
        </>
      }
    >
      <div className="mb-3 flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
        <ShieldAlert size={16} className="mt-0.5 shrink-0" />
        <span>Enter the confirmation password to save this change.</span>
      </div>
      <Field label="Confirmation password">
        <TextInput
          type="password"
          autoComplete="off"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
        />
      </Field>
    </Modal>
  )
}
