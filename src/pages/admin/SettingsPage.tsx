import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Database, MessageSquare } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { SectionCard } from '@/components/ui/SectionCard'
import { LoadingBlock, ActiveBadge, EmptyState } from '@/components/ui/Feedback'
import { WiredSettingsForm } from '@/components/settings/WiredSettingsForm'
import { GoogleMapsConfigPanel } from '@/components/settings/GoogleMapsConfigPanel'
import { RazorpayConfigPanel } from '@/components/settings/RazorpayConfigPanel'
import { PaymentGatewaysPanel } from '@/components/settings/PaymentGatewaysPanel'
import { FirebaseConfigPanel } from '@/components/settings/FirebaseConfigPanel'
import { PushNotificationTestPanel } from '@/components/settings/PushNotificationTestPanel'
import { EmailTestPanel } from '@/components/settings/EmailTestPanel'
import { SectionVisibilityPanel } from '@/components/settings/SectionVisibilityPanel'
import { LocationPriorityPanel } from '@/components/settings/LocationPriorityPanel'
import { SettingsConfirmationProvider } from '@/context/SettingsConfirmationContext'
import { classNames } from '@/lib/format'
import { useAsync } from '@/hooks/useAsync'
import { settingsService } from '@/services/settingsService'
import { settingsSchemaService } from '@/services/settingsSchemaService'
import { IS_MOCK } from '@/config/env'

/**
 * Every tab here (except Cache Settings, a real-time operational action rather than a "setting")
 * renders off the section list GET /admin/settings/schema returns — see settingsSchemaService.ts
 * and, on the backend, SettingSchemaService. Add a field to a section there, or a whole new
 * section, and it shows up here automatically: no CATEGORIES array, no per-field JSX, nothing in
 * this file to touch. What *is* still bespoke per tab is content that isn't a generic key/value
 * field at all — the live gateway-enable lists on Payment Gateways/SMS Gateways, and three
 * AppConfig-backed panels (GoogleMapsConfigPanel, RazorpayConfigPanel, FirebaseConfigPanel) that
 * need typed fields/write-only-secret handling the generic schema doesn't provide — those render
 * above the schema-driven form for their section, not instead of it.
 */
export default function SettingsPage() {
  const { data: schema, isLoading: schemaLoading } = useAsync(() => settingsSchemaService.getSchema(), [])
  const { data: smsGateways } = useAsync(() => settingsService.smsGateways(), [])
  const { data: caches, isLoading: cachesLoading, reload: reloadCaches } = useAsync(() => settingsService.listCaches(), [])

  const [clearingCache, setClearingCache] = useState(false)
  const [clearedAt, setClearedAt] = useState<Date | null>(null)
  const [clearCacheError, setClearCacheError] = useState<string | null>(null)

  const categories = schema
    ? [...schema.map((s) => ({ key: s.key, label: s.title, icon: s.icon })), { key: 'cache-settings', label: 'Cache Settings', icon: Database }]
    : []

  // The active tab lives in the URL (/admin/settings/:category) rather than plain component state,
  // so refreshing or sharing a link (e.g. straight to Payment Gateways) lands on the same tab
  // instead of always resetting to the first one.
  const { category: activeCategory } = useParams<{ category?: string }>()
  const navigate = useNavigate()

  useEffect(() => {
    if (!activeCategory && categories.length > 0) navigate(`/admin/settings/${categories[0].key}`, { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategory, categories.length])

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

  const activeSection = schema?.find((s) => s.key === activeCategory)

  return (
    <SettingsConfirmationProvider>
      <div>
        <PageHeader title="Settings" description="Platform-wide configuration for PureEats." />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[220px_1fr]">
        <nav className="card flex gap-1 overflow-x-auto p-2 lg:flex-col lg:overflow-visible">
          {schemaLoading ? (
            <LoadingBlock />
          ) : (
            categories.map((cat) => (
              <button
                key={cat.key}
                onClick={() => navigate(`/admin/settings/${cat.key}`)}
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
            ))
          )}
        </nav>

        <div className="min-w-0 space-y-4">
          {activeCategory === 'payments' && <PaymentGatewaysPanel />}

          {activeCategory === 'payments' && <RazorpayConfigPanel />}

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

          {activeCategory === 'google-map' && <GoogleMapsConfigPanel />}

          {activeCategory === 'push-notifications' && <FirebaseConfigPanel />}

          {activeCategory === 'customer-app' && <SectionVisibilityPanel />}

          {activeCategory === 'customer-app' && <LocationPriorityPanel />}

          {activeSection && <WiredSettingsForm key={activeSection.key} groups={activeSection.groups} />}

          {activeCategory === 'email-settings' && <EmailTestPanel />}

          {activeCategory === 'push-notifications' && <PushNotificationTestPanel />}

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
        </div>
      </div>
      </div>
    </SettingsConfirmationProvider>
  )
}
