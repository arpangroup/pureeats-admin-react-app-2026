import { useEffect, useState } from 'react'
import { useAsync } from '@/hooks/useAsync'
import { appConfigService, type AppConfigAdmin } from '@/services/appConfigService'

/**
 * Shared load/edit/save cycle for the small AppConfig-backed panels scattered across different
 * Settings tabs (Google Map, Payment Gateways' Razorpay group, Push Notifications' Firebase group —
 * see GoogleMapsConfigPanel/RazorpayConfigPanel/FirebaseConfigPanel). Each panel mounts its own
 * instance of this hook rather than sharing one: they're never visible at the same time (only one
 * settings tab is active at once).
 *
 * save() only ever PUTs the field(s) that actually changed since the fetch — `set()` always
 * replaces `draft` with a fresh object that keeps every *other* field's exact same reference, so a
 * plain `!==` against the original `config` reliably tells "edited" from "untouched" without a deep
 * diff. The backend fills in everything else from what's already stored (see
 * AppConfigService#mergeOntoExisting), so there's nothing to reconcile between panels editing
 * different fields concurrently.
 */
export function useAppConfigAdminForm() {
  const { data: config, isLoading, error: loadError, reload } = useAsync(() => appConfigService.getAdmin(), [])
  const [draft, setDraft] = useState<AppConfigAdmin | null>(null)
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

  function changedFields(): Partial<AppConfigAdmin> {
    if (!draft || !config) return {}
    const changed: Partial<AppConfigAdmin> = {}
    for (const key of Object.keys(draft) as (keyof AppConfigAdmin)[]) {
      if (key === 'razorpayKeySecretSet') continue
      if (draft[key] !== config[key]) {
        ;(changed as Record<string, unknown>)[key] = draft[key]
      }
    }
    return changed
  }

  const isDirty = Object.keys(changedFields()).length > 0

  /**
   * `extraWrite` carries razorpayKeySecret, which the admin GET never returns (write-only), so
   * there's no draft value to diff against — the panel keeps its own separate input state for it
   * instead. `confirmPassword` is the confirmation-dialog password proving *this* save is
   * authorized (see useSettingsConfirmation) — only checked when settingsConfirmationEnabled is on.
   */
  async function save(extraWrite?: { razorpayKeySecret?: string }, confirmPassword?: string) {
    const changed = changedFields()
    if (Object.keys(changed).length === 0 && !extraWrite?.razorpayKeySecret) return true
    setSaving(true)
    setSaveError(null)
    try {
      const updated = await appConfigService.updateAdmin({ ...changed, ...extraWrite }, confirmPassword)
      setDraft(updated)
      setSavedAt(new Date())
      reload()
      return true
    } catch (err) {
      setSaveError((err as { message?: string })?.message ?? 'Could not save these settings')
      return false
    } finally {
      setSaving(false)
    }
  }

  return { draft, isLoading, loadError, reload, set, save, saving, saveError, savedAt, isDirty }
}
