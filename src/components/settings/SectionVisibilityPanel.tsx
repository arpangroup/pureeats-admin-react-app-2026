import { Check, LayoutGrid } from 'lucide-react'
import { SectionCard } from '@/components/ui/SectionCard'
import { Field, Switch, TextInput } from '@/components/ui/FormControls'
import { LoadingBlock } from '@/components/ui/Feedback'
import { useAppConfigAdminForm } from '@/hooks/useAppConfigAdminForm'
import { useSettingsConfirmation } from '@/hooks/useSettingsConfirmation'
import { ConfirmPasswordDialog } from './ConfirmPasswordDialog'
import { SettingsLoadError } from './SettingsLoadError'

/**
 * Home page section visibility — real typed AppConfig fields (promoSliderEnabled/topPicksEnabled/
 * recommendedItemsEnabled/cuisineCategorySectionEnabled), not the generic settings schema. These
 * used to be duplicated as generic key/value fields ("Promo slider" under Customer Application →
 * Browsing & merchandising) that the customer app never actually read — see
 * SettingSchemaService#customerAppSection's comment on the backend. This panel is the fix: it edits
 * the actual fields HomePage.tsx checks.
 *
 * Also carries "Order status updates" — how the customer app's tracking page learns about a status
 * change (PUSH live, falling back to polling; or POLL only) — another typed AppConfig field
 * (orderStatusUpdateMode) with no prior admin-panel UI at all.
 */
export function SectionVisibilityPanel() {
  const { draft, isLoading, loadError, reload, set, save, saving, saveError, savedAt, isDirty } = useAppConfigAdminForm()
  const { requestConfirmation, open: confirmOpen, handleConfirm, handleCancel } = useSettingsConfirmation()

  if (isLoading) return <LoadingBlock />
  if (loadError || !draft) return <SettingsLoadError title="Section Visibility" icon={LayoutGrid} error={loadError} onRetry={reload} />

  async function handleSave() {
    const confirmPassword = await requestConfirmation()
    if (confirmPassword === null) return
    await save(undefined, confirmPassword)
  }

  return (
    <SectionCard
      title="Home page sections"
      icon={LayoutGrid}
      description="Show or hide each section on the customer app's home page, and how order status updates reach the tracking page."
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

      <div className="space-y-4">
        <ToggleRow
          label="Promo slider"
          hint="Rotating promotional banner carousel at the top of the home page."
          checked={draft.promoSliderEnabled}
          onChange={(v) => set('promoSliderEnabled', v)}
        />
        <ToggleRow
          label="Cuisine category section"
          hint="Horizontal row of cuisine/category icons below the promo slider."
          checked={draft.cuisineCategorySectionEnabled}
          onChange={(v) => set('cuisineCategorySectionEnabled', v)}
        />
        <ToggleRow
          label="Top picks"
          hint="Curated horizontal strip of top-rated restaurants."
          checked={draft.topPicksEnabled}
          onChange={(v) => set('topPicksEnabled', v)}
        />
        <ToggleRow
          label="Recommended for you"
          hint="Personalized grid of recommended menu items."
          checked={draft.recommendedItemsEnabled}
          onChange={(v) => set('recommendedItemsEnabled', v)}
        />
      </div>

      <div className="mt-6 border-t border-slate-100 pt-4 dark:border-slate-800">
        <ToggleRow
          label="Live order status updates"
          hint="On: the tracking page updates instantly via push, falling back to polling if push is unavailable. Off: polling only."
          checked={draft.orderStatusUpdateMode !== 'POLL'}
          onChange={(v) => set('orderStatusUpdateMode', v ? 'PUSH' : 'POLL')}
        />
      </div>

      <div className="mt-6 border-t border-slate-100 pt-4 dark:border-slate-800">
        <Field label="Platform fee (₹)" hint="Flat fee added to every order's total, alongside tax/restaurant/delivery charges. 0 = no fee charged.">
          <TextInput
            type="number"
            min={0}
            step="0.01"
            className="max-w-[160px]"
            value={draft.platformFee}
            onChange={(e) => set('platformFee', Number(e.target.value))}
          />
        </Field>
      </div>
    </SectionCard>
  )
}

function ToggleRow({ label, hint, checked, onChange }: { label: string; hint: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="font-medium text-slate-800 dark:text-slate-100">{label}</p>
        <p className="text-sm text-slate-500 dark:text-slate-400">{hint}</p>
      </div>
      <Switch checked={checked} onChange={onChange} />
    </div>
  )
}
