import { useState } from 'react'
import { Send, CheckCircle2, Mail } from 'lucide-react'
import { SectionCard } from '@/components/ui/SectionCard'
import { Field, TextInput } from '@/components/ui/FormControls'
import { notificationTestService } from '@/services/notificationTestService'

/**
 * Sends a real test email through the configured provider (see AdminNotificationTestController on
 * the backend, which calls EmailProvider directly rather than the templated notification path) — a
 * quick way to confirm SMTP/SendGrid credentials actually work before relying on them for OTPs and
 * order emails. Not a "setting" itself, so it doesn't go through WiredSettingsForm/useSettingsConfirmation.
 */
export function EmailTestPanel() {
  const [to, setTo] = useState('')
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const [sentAt, setSentAt] = useState<Date | null>(null)

  async function handleSendTest() {
    setSending(true)
    setSendError(null)
    setSentAt(null)
    try {
      await notificationTestService.sendTestEmail(to.trim())
      setSentAt(new Date())
    } catch (err) {
      setSendError((err as { message?: string })?.message ?? 'Could not send test email')
    } finally {
      setSending(false)
    }
  }

  return (
    <SectionCard title="Send a test email" icon={Mail} description="Confirm your email provider is configured correctly before relying on it for OTPs and order emails.">
      {sendError && <p className="mb-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">{sendError}</p>}
      {sentAt && !sendError && (
        <p className="mb-3 flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
          <CheckCircle2 size={14} /> Test email sent at {sentAt.toLocaleTimeString()}.
        </p>
      )}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="flex-1">
          <Field label="Receiver email address">
            <TextInput type="email" value={to} placeholder="you@example.com" onChange={(e) => setTo(e.target.value)} />
          </Field>
        </div>
        <button className="btn-primary flex shrink-0 items-center gap-1.5" onClick={handleSendTest} disabled={sending || !to.trim()}>
          <Send size={14} /> {sending ? 'Sending…' : 'Send test email'}
        </button>
      </div>
    </SectionCard>
  )
}
