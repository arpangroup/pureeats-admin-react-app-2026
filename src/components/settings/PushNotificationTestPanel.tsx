import { useState } from 'react'
import { BookOpen, Send, ExternalLink, CheckCircle2 } from 'lucide-react'
import { SectionCard } from '@/components/ui/SectionCard'
import { Field, TextInput } from '@/components/ui/FormControls'
import { notificationTestService } from '@/services/notificationTestService'

const SETUP_GUIDE_URL = '/guides/firebase-push-setup.html'

/**
 * Two self-contained admin actions for the Push Notifications tab, neither of which is a "setting"
 * (so neither goes through WiredSettingsForm/useSettingsConfirmation): a step-by-step Firebase setup
 * guide (a static page, opened in a new tab so it survives independently of this SPA) and a test
 * send that exercises the real NotificationService push path (see AdminNotificationTestController on
 * the backend) to confirm a device actually receives something before relying on it in production.
 */
export function PushNotificationTestPanel() {
  const [userId, setUserId] = useState('')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const [sentAt, setSentAt] = useState<Date | null>(null)

  async function handleSendTest() {
    const targetId = Number(userId)
    setSending(true)
    setSendError(null)
    setSentAt(null)
    try {
      await notificationTestService.sendTestPush(targetId, title.trim() || undefined, body.trim() || undefined)
      setSentAt(new Date())
    } catch (err) {
      setSendError((err as { message?: string })?.message ?? 'Could not send test notification')
    } finally {
      setSending(false)
    }
  }

  return (
    <SectionCard
      title="Setup & testing"
      icon={Send}
      description="Walk through Firebase setup, then confirm push notifications actually reach a device."
      actions={
        <button className="btn-secondary flex items-center gap-1.5" onClick={() => window.open(SETUP_GUIDE_URL, '_blank', 'noopener')}>
          <BookOpen size={14} /> Setup guide <ExternalLink size={12} />
        </button>
      }
    >
      <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
        Send a real push notification to every active device a user has registered, using the Firebase Admin SDK credentials configured on the backend — this doesn't touch the web config above, it's a server-side send.
      </p>
      {sendError && <p className="mb-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">{sendError}</p>}
      {sentAt && !sendError && (
        <p className="mb-3 flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
          <CheckCircle2 size={14} /> Test notification sent at {sentAt.toLocaleTimeString()}.
        </p>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field label="User ID" required hint="Target user — must have a registered, active device token.">
          <TextInput type="number" min={1} value={userId} placeholder="e.g. 1" onChange={(e) => setUserId(e.target.value)} />
        </Field>
        <Field label="Title" hint="Optional — defaults to a generic test title.">
          <TextInput value={title} placeholder="PureEats test notification" onChange={(e) => setTitle(e.target.value)} />
        </Field>
        <Field label="Body" hint="Optional — defaults to generic test copy.">
          <TextInput value={body} placeholder="This is a test notification" onChange={(e) => setBody(e.target.value)} />
        </Field>
      </div>
      <div className="mt-4">
        <button className="btn-primary flex items-center gap-1.5" onClick={handleSendTest} disabled={sending || !userId.trim()}>
          <Send size={14} /> {sending ? 'Sending…' : 'Send test notification'}
        </button>
      </div>
    </SectionCard>
  )
}
