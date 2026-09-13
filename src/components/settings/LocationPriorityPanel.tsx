import { Check, ChevronDown, ChevronUp, MapPinned, Plus, X } from 'lucide-react'
import { SectionCard } from '@/components/ui/SectionCard'
import { Field, TextInput } from '@/components/ui/FormControls'
import { LoadingBlock } from '@/components/ui/Feedback'
import { useAppConfigAdminForm } from '@/hooks/useAppConfigAdminForm'
import { useSettingsConfirmation } from '@/hooks/useSettingsConfirmation'
import { ConfirmPasswordDialog } from './ConfirmPasswordDialog'
import { SettingsLoadError } from './SettingsLoadError'
import { classNames } from '@/lib/format'

/** Mirrors the customer app's `LocationSource` (src/types/entities.ts) — kept as a local string
 * union here rather than a shared package, same as every other AppConfig field this admin app
 * edits without importing the customer app's types. */
type LocationSource = 'gps' | 'ip' | 'saved' | 'picked'

const ALL_SOURCES: LocationSource[] = ['gps', 'ip', 'saved', 'picked']

const SOURCE_INFO: Record<LocationSource, { label: string; hint: string }> = {
  gps: { label: 'Live GPS', hint: 'Real device location, reverse-geocoded. Needs the customer to grant browser permission.' },
  ip: { label: 'IP-based', hint: "Coarse, city-level guess from the customer's IP. No permission needed." },
  saved: { label: 'Saved address', hint: "The customer's saved default delivery address. Only applies once signed in." },
  picked: { label: 'Manually picked', hint: 'A location explicitly confirmed on the location picker (search, map pin, or recent search). Persists across visits until they pick again.' },
}

/** A stored priority array may contain values this admin build doesn't recognize (a newer
 * customer-app release added a source before this dropdown knew about it) — keep them, just don't
 * offer UI for reordering/removing something we can't label. */
function asSources(value: string[]): LocationSource[] {
  return value.filter((v): v is LocationSource => (ALL_SOURCES as string[]).includes(v))
}

/**
 * Which source wins the customer app's "active address" pill, and in what order — the same
 * mechanism a support/eng conversation used to require a code change + redeploy for (see
 * docs/location-resolution/README.md in the customer app repo). Two independent priority lists
 * since 'saved' only ever applies to a signed-in customer; the first source in each list that has
 * a resolved value wins, everything after it is never even checked.
 */
export function LocationPriorityPanel() {
  const { draft, isLoading, loadError, reload, set, save, saving, saveError, savedAt, isDirty } = useAppConfigAdminForm()
  const { requestConfirmation, open: confirmOpen, handleConfirm, handleCancel } = useSettingsConfirmation()

  if (isLoading) return <LoadingBlock />
  if (loadError || !draft) return <SettingsLoadError title="Active-location priority" icon={MapPinned} error={loadError} onRetry={reload} />

  async function handleSave() {
    const confirmPassword = await requestConfirmation()
    if (confirmPassword === null) return
    await save(undefined, confirmPassword)
  }

  return (
    <SectionCard
      title="Active-location priority"
      icon={MapPinned}
      description="Which source wins the customer app's home-page location pill, and in what order. The first source below that actually has a value is shown — reorder to change precedence, or drop one to stop it being tried at all."
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

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <PriorityList
          title="Signed-in customers"
          value={asSources(draft.locationResolutionAuthenticatedPriority)}
          onChange={(next) => set('locationResolutionAuthenticatedPriority', next)}
        />
        <PriorityList
          title="Guests"
          value={asSources(draft.locationResolutionGuestPriority)}
          onChange={(next) => set('locationResolutionGuestPriority', next)}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 border-t border-slate-100 pt-4 dark:border-slate-800 md:grid-cols-2">
        <Field label="Fallback label (signed-in)" hint="Shown once every source above has been tried and none resolved a value.">
          <TextInput value={draft.locationResolutionAuthenticatedFallbackLabel} onChange={(e) => set('locationResolutionAuthenticatedFallbackLabel', e.target.value)} />
        </Field>
        <Field label="Fallback label (guest)" hint="Shown once every source above has been tried and none resolved a value.">
          <TextInput value={draft.locationResolutionGuestFallbackLabel} onChange={(e) => set('locationResolutionGuestFallbackLabel', e.target.value)} />
        </Field>
      </div>
    </SectionCard>
  )
}

function PriorityList({ title, value, onChange }: { title: string; value: LocationSource[]; onChange: (next: LocationSource[]) => void }) {
  const excluded = ALL_SOURCES.filter((s) => !value.includes(s))

  function move(index: number, direction: -1 | 1) {
    const next = [...value]
    const target = index + direction
    if (target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target], next[index]]
    onChange(next)
  }

  function remove(source: LocationSource) {
    onChange(value.filter((s) => s !== source))
  }

  function add(source: LocationSource) {
    onChange([...value, source])
  }

  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">{title}</p>

      {value.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-200 px-3 py-4 text-center text-xs text-slate-400 dark:border-slate-700 dark:text-slate-500">
          Nothing tried — the fallback label always shows.
        </p>
      ) : (
        <ol className="space-y-1.5">
          {value.map((source, i) => (
            <li key={source} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-2 dark:border-slate-700 dark:bg-slate-900">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[11px] font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">{SOURCE_INFO[source].label}</p>
                <p className="truncate text-xs text-slate-400 dark:text-slate-500">{SOURCE_INFO[source].hint}</p>
              </div>
              <div className="flex shrink-0 items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  aria-label={`Move ${SOURCE_INFO[source].label} up`}
                  className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent dark:hover:bg-slate-800 dark:hover:text-slate-200"
                >
                  <ChevronUp size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => move(i, 1)}
                  disabled={i === value.length - 1}
                  aria-label={`Move ${SOURCE_INFO[source].label} down`}
                  className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent dark:hover:bg-slate-800 dark:hover:text-slate-200"
                >
                  <ChevronDown size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => remove(source)}
                  aria-label={`Stop trying ${SOURCE_INFO[source].label}`}
                  className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10 dark:hover:text-rose-400"
                >
                  <X size={14} />
                </button>
              </div>
            </li>
          ))}
        </ol>
      )}

      {excluded.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {excluded.map((source) => (
            <button
              key={source}
              type="button"
              onClick={() => add(source)}
              className={classNames(
                'flex items-center gap-1 rounded-full border border-dashed border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-500 transition-colors hover:border-brand-400 hover:text-brand-600',
                'dark:border-slate-700 dark:text-slate-400 dark:hover:border-brand-500 dark:hover:text-brand-400',
              )}
            >
              <Plus size={11} /> {SOURCE_INFO[source].label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
