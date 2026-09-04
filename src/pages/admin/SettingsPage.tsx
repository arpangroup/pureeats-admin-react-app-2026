import { useState, type ReactNode } from 'react'
import {
  Bell,
  Bike,
  Check,
  Code2,
  CreditCard,
  Database,
  Mail,
  MapPin,
  MessageSquare,
  Palette,
  Percent,
  RefreshCw,
  Settings as SettingsIcon,
  Smartphone,
  Sparkles,
  Store,
  type LucideIcon,
} from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { SectionCard } from '@/components/ui/SectionCard'
import { Field, TextInput, Switch } from '@/components/ui/FormControls'
import { LoadingBlock, ActiveBadge, EmptyState } from '@/components/ui/Feedback'
import { classNames } from '@/lib/format'
import { useAsync } from '@/hooks/useAsync'
import { settingsService } from '@/services/settingsService'
import { IS_MOCK } from '@/config/env'

interface SettingCategory {
  key: string
  label: string
  icon: LucideIcon
  /** Categories without a real service behind them yet show a placeholder instead of a blank pane. */
  wired: boolean
}

const CATEGORIES: SettingCategory[] = [
  { key: 'general', label: 'General', icon: SettingsIcon, wired: true },
  { key: 'design', label: 'Design', icon: Palette, wired: false },
  { key: 'payments', label: 'Payment Gateways', icon: CreditCard, wired: true },
  { key: 'sms-gateways', label: 'SMS Gateways', icon: MessageSquare, wired: true },
  { key: 'email-settings', label: 'Email Settings', icon: Mail, wired: false },
  { key: 'push-notifications', label: 'Push Notifications', icon: Bell, wired: false },
  { key: 'google-map', label: 'Google Map', icon: MapPin, wired: false },
  { key: 'tax-settings', label: 'Tax Settings', icon: Percent, wired: false },
  { key: 'customer-app', label: 'Customer Application', icon: Smartphone, wired: false },
  { key: 'delivery-app', label: 'Delivery Application', icon: Bike, wired: false },
  { key: 'store-dashboard', label: 'Store Dashboard', icon: Store, wired: false },
  { key: 'custom-css', label: 'Custom CSS', icon: Code2, wired: false },
  { key: 'cache-settings', label: 'Cache Settings', icon: Database, wired: true },
]

const FIELD_LABELS: Record<string, string> = {
  app_name: 'App name',
  currency_symbol: 'Currency symbol',
  currency_code: 'Currency code',
  support_email: 'Support email',
  support_phone: 'Support phone',
  default_tax_percent: 'Default tax (%)',
  default_commission_rate: 'Default commission (%)',
  min_withdrawal_amount: 'Minimum withdrawal (₹)',
}

const GENERAL_GROUPS: { title: string; description?: string; icon: LucideIcon; keys: string[] }[] = [
  { title: 'App info', icon: Sparkles, keys: ['app_name', 'currency_symbol', 'currency_code'] },
  { title: 'Contact & support', icon: Mail, keys: ['support_email', 'support_phone'] },
  { title: 'Commerce', description: 'Defaults applied to new restaurants and payouts.', icon: Percent, keys: ['default_tax_percent', 'default_commission_rate', 'min_withdrawal_amount'] },
]

export default function SettingsPage() {
  const [activeCategory, setActiveCategory] = useState('general')
  const { data: settings, isLoading, reload } = useAsync(() => settingsService.getAll(), [])
  const { data: gateways, reload: reloadGateways } = useAsync(() => settingsService.paymentGateways(), [])
  const { data: smsGateways } = useAsync(() => settingsService.smsGateways(), [])
  const { data: caches, isLoading: cachesLoading, reload: reloadCaches } = useAsync(() => settingsService.listCaches(), [])

  const [savingKey, setSavingKey] = useState<string | null>(null)
  const [draft, setDraft] = useState<Record<string, string>>({})
  const [clearingCache, setClearingCache] = useState(false)
  const [clearedAt, setClearedAt] = useState<Date | null>(null)
  const [clearCacheError, setClearCacheError] = useState<string | null>(null)

  async function handleClearCache() {
    setClearingCache(true)
    setClearCacheError(null)
    try {
      await settingsService.clearAllCaches()
      setClearedAt(new Date())
      reloadCaches()
    } catch (err) {
      setClearCacheError((err as { message?: string })?.message ?? 'Unable to clear caches')
    } finally {
      setClearingCache(false)
    }
  }

  const [saveSettingError, setSaveSettingError] = useState<string | null>(null)

  async function handleSave(key: string) {
    setSavingKey(key)
    setSaveSettingError(null)
    try {
      await settingsService.update(key, draft[key])
      reload()
      setDraft((prev) => {
        const next = { ...prev }
        delete next[key]
        return next
      })
    } catch (err) {
      setSaveSettingError((err as { message?: string })?.message ?? 'Unable to save setting')
    } finally {
      setSavingKey(null)
    }
  }

  const maintenanceMode = settings?.find((s) => s.key === 'maintenance_mode')

  return (
    <div>
      <PageHeader title="Settings" description="Platform-wide configuration for PureEats." />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[220px_1fr]">
        <nav className="card flex gap-1 overflow-x-auto p-2 lg:flex-col lg:overflow-visible">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={classNames(
                'flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors',
                activeCategory === cat.key
                  ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200',
              )}
            >
              <cat.icon size={16} className="shrink-0" />
              <span className="whitespace-nowrap">{cat.label}</span>
            </button>
          ))}
        </nav>

        <div className="min-w-0 space-y-4">
          {activeCategory === 'general' && (
            isLoading || !settings ? (
              <LoadingBlock />
            ) : (
              <>
                {saveSettingError && (
                  <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">{saveSettingError}</p>
                )}
                {GENERAL_GROUPS.map((group) => (
                  <SectionCard key={group.title} title={group.title} description={group.description} icon={group.icon}>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      {group.keys.map((key) => {
                        const setting = settings.find((s) => s.key === key)
                        if (!setting) return null
                        const isDirty = draft[key] !== undefined && draft[key] !== setting.value
                        return (
                          <Field key={key} label={FIELD_LABELS[key] ?? key.replace(/_/g, ' ')}>
                            <div className="flex items-center gap-2">
                              <TextInput
                                defaultValue={setting.value}
                                onChange={(e) => setDraft((prev) => ({ ...prev, [key]: e.target.value }))}
                              />
                              {isDirty && (
                                <button
                                  className="btn-secondary shrink-0 px-2.5"
                                  onClick={() => handleSave(key)}
                                  disabled={savingKey === key}
                                  aria-label="Save"
                                  title="Save"
                                >
                                  {savingKey === key ? '…' : <Check size={15} />}
                                </button>
                              )}
                            </div>
                          </Field>
                        )
                      })}
                    </div>
                  </SectionCard>
                ))}

                {maintenanceMode && (
                  <SectionCard title="Platform" icon={SettingsIcon} description="Take the customer app offline for maintenance.">
                    <Field label="Maintenance mode" hint="When on, customers see a maintenance page instead of the app.">
                      <Switch
                        checked={maintenanceMode.value === 'true'}
                        onChange={async (v) => {
                          setSavingKey('maintenance_mode')
                          try {
                            await settingsService.update('maintenance_mode', String(v))
                            reload()
                          } finally {
                            setSavingKey(null)
                          }
                        }}
                      />
                    </Field>
                  </SectionCard>
                )}
              </>
            )
          )}

          {activeCategory === 'payments' && (
            <SectionCard title="Payment gateways" icon={CreditCard} description="Enable the ways customers can pay for orders.">
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {(gateways ?? []).map((gateway) => (
                  <div key={gateway.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                    <div>
                      <p className="font-medium text-slate-800 dark:text-slate-100">{gateway.name}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{gateway.description}</p>
                    </div>
                    <Switch
                      checked={gateway.isActive}
                      onChange={async (v) => {
                        await settingsService.togglePaymentGateway(gateway.id, v)
                        reloadGateways()
                      }}
                    />
                  </div>
                ))}
              </div>
            </SectionCard>
          )}

          {activeCategory === 'sms-gateways' && (
            <SectionCard title="SMS gateways" icon={MessageSquare} description="Providers used to send OTPs and order alerts.">
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {(smsGateways ?? []).map((gateway) => (
                  <div key={gateway.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                    <p className="font-medium text-slate-800 dark:text-slate-100">{gateway.gatewayName}</p>
                    <ActiveBadge active={gateway.isActive} />
                  </div>
                ))}
              </div>
            </SectionCard>
          )}

          {activeCategory === 'cache-settings' && (
            <SectionCard
              title="Cache"
              icon={Database}
              description="Restaurant, menu and a few other reads are cached in memory for speed. If a backend change (a direct DB edit, another service, a support script) doesn't show up here yet, it's waiting out the cache's TTL — clear it to force everything fresh immediately."
            >
              {IS_MOCK ? (
                <EmptyState icon={<Database size={22} />} title="Not applicable in mock mode" description="There's no real backend cache to inspect or clear against the demo dataset." />
              ) : (
                <>
                  <div className="mb-4 flex flex-wrap items-center gap-3">
                    <button className="btn-primary" onClick={handleClearCache} disabled={clearingCache}>
                      <RefreshCw size={15} className={clearingCache ? 'animate-spin' : ''} />
                      {clearingCache ? 'Refreshing…' : 'Refresh cache'}
                    </button>
                    {clearedAt && !clearCacheError && (
                      <span className="text-sm text-emerald-600 dark:text-emerald-400">
                        Cleared at {clearedAt.toLocaleTimeString()} — the next request re-reads from the database.
                      </span>
                    )}
                  </div>
                  {clearCacheError && <p className="mb-3 text-sm text-rose-600 dark:text-rose-400">{clearCacheError}</p>}
                  {cachesLoading ? (
                    <LoadingBlock />
                  ) : caches && caches.length > 0 ? (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                      {caches.map((cache) => (
                        <div key={cache.name} className="flex items-center justify-between py-2.5 text-sm first:pt-0 last:pb-0">
                          <span className="font-mono text-slate-700 dark:text-slate-300">{cache.name}</span>
                          <span className="text-slate-400 dark:text-slate-500">
                            {cache.estimatedSize ?? '—'} {cache.estimatedSize === 1 ? 'entry' : 'entries'}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400 dark:text-slate-500">No caches have been used yet this session.</p>
                  )}
                </>
              )}
            </SectionCard>
          )}

          {!CATEGORIES.find((c) => c.key === activeCategory)?.wired && (
            <ComingSoonPanel category={CATEGORIES.find((c) => c.key === activeCategory)!} />
          )}
        </div>
      </div>
    </div>
  )
}

function ComingSoonPanel({ category }: { category: SettingCategory }): ReactNode {
  return (
    <SectionCard title={category.label} icon={category.icon}>
      <EmptyState
        icon={<category.icon size={22} />}
        title="Not configured yet"
        description="This section isn't wired up to a backend endpoint in the demo dataset yet."
      />
    </SectionCard>
  )
}
