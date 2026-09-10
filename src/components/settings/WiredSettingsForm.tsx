import { useState } from 'react'
import { AlertTriangle, Check } from 'lucide-react'
import { SectionCard } from '@/components/ui/SectionCard'
import { LoadingBlock, EmptyState } from '@/components/ui/Feedback'
import { useAsync } from '@/hooks/useAsync'
import { useSettingsConfirmation } from '@/hooks/useSettingsConfirmation'
import { settingsService, type SettingKeyValue } from '@/services/settingsService'
import { ConfirmPasswordDialog } from './ConfirmPasswordDialog'
import { DynamicField } from './DynamicSettingsForm'
import type { SettingGroupDef } from '@/config/settingsFieldsConfig'

/**
 * The real, backend-wired renderer for SettingGroupDef[] — same field types/labels/help copy as
 * DynamicSettingsForm, but loads actual values from GET /settings and saves changes via
 * PUT /admin/settings (upserts each key — see ContentService#updateSettings on the backend) instead
 * of keeping everything in local-only React state for the browser session.
 *
 * One GET /settings fetch is shared across every group in `groups` (fetching once per tab rather
 * than once per gateway/card), but each group below gets its *own* independent draft/dirty-tracking
 * and its own Save button — editing Stripe's fields doesn't put a save button next to PayPal's, and
 * saving Stripe only ever PUTs Stripe's own changed key(s), never anything from a sibling card.
 */
export function WiredSettingsForm({ groups }: { groups: SettingGroupDef[] }) {
  const { data: settings, isLoading, error: loadError, reload } = useAsync(() => settingsService.getAll(), [])

  if (isLoading) return <LoadingBlock />

  if (loadError || !settings) {
    return (
      <SectionCard title="Settings" icon={AlertTriangle}>
        <EmptyState
          icon={<AlertTriangle size={22} />}
          title="Couldn't load these settings"
          description={loadError ?? 'Something went wrong loading the current configuration.'}
          action={
            <button className="btn-secondary" onClick={reload}>
              Try again
            </button>
          }
        />
      </SectionCard>
    )
  }

  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <WiredSettingsGroupCard key={group.title} group={group} settings={settings} reload={reload} />
      ))}
    </div>
  )
}

function WiredSettingsGroupCard({ group, settings, reload }: { group: SettingGroupDef; settings: SettingKeyValue[]; reload: () => void }) {
  const savedByKey: Record<string, string> = {}
  for (const field of group.fields) savedByKey[field.key] = settings.find((s) => s.key === field.key)?.value ?? field.defaultValue

  const [draft, setDraft] = useState<Record<string, string>>(savedByKey)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [savedAt, setSavedAt] = useState<Date | null>(null)
  const { requestConfirmation, open: confirmOpen, handleConfirm, handleCancel } = useSettingsConfirmation()

  function handleChange(key: string, value: string) {
    setDraft((prev) => ({ ...prev, [key]: value }))
    setSavedAt(null)
  }

  const dirtyKeys = group.fields.map((f) => f.key).filter((key) => draft[key] !== savedByKey[key])

  async function handleSave() {
    if (dirtyKeys.length === 0) return
    const confirmPassword = await requestConfirmation()
    if (confirmPassword === null) return
    setSaving(true)
    setSaveError(null)
    try {
      // Only this card's changed key(s) go over the wire — a sibling card's untouched fields, or
      // even this card's own not-dirty fields, are never part of the PUT body.
      await settingsService.updateMany(Object.fromEntries(dirtyKeys.map((key) => [key, draft[key]])), confirmPassword)
      setSavedAt(new Date())
      reload()
    } catch (err) {
      setSaveError((err as { message?: string })?.message ?? 'Could not save these settings')
    } finally {
      setSaving(false)
    }
  }

  return (
    <SectionCard
      title={group.title}
      description={group.description}
      icon={group.icon}
      actions={
        <div className="flex items-center gap-3">
          {savedAt && !saveError && dirtyKeys.length === 0 && (
            <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              <Check size={13} /> Saved
            </span>
          )}
          <button className="btn-primary shrink-0" onClick={handleSave} disabled={saving || dirtyKeys.length === 0}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      }
    >
      {confirmOpen && <ConfirmPasswordDialog onConfirm={handleConfirm} onCancel={handleCancel} />}
      {saveError && <p className="mb-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">{saveError}</p>}
      <div className="grid grid-cols-1 gap-x-4 gap-y-5 sm:grid-cols-2">
        {group.fields.map((field) => (
          <div key={field.key} className={field.fieldType === 'textarea' ? 'sm:col-span-2' : undefined}>
            <DynamicField field={field} value={draft[field.key] ?? field.defaultValue} onChange={(v) => handleChange(field.key, v)} />
          </div>
        ))}
      </div>
    </SectionCard>
  )
}
