import { useState } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Tabs } from '@/components/ui/Tabs'
import { TextInput, Switch } from '@/components/ui/FormControls'
import { LoadingBlock, ActiveBadge } from '@/components/ui/Feedback'
import { useAsync } from '@/hooks/useAsync'
import { settingsService } from '@/services/settingsService'

const TABS = [
  { key: 'general', label: 'General' },
  { key: 'payments', label: 'Payment Gateways' },
  { key: 'sms', label: 'SMS Gateways' },
]

export default function SettingsPage() {
  const [tab, setTab] = useState('general')
  const { data: settings, isLoading, reload } = useAsync(() => settingsService.getAll(), [])
  const { data: gateways, reload: reloadGateways } = useAsync(() => settingsService.paymentGateways(), [])
  const { data: smsGateways } = useAsync(() => settingsService.smsGateways(), [])

  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [draft, setDraft] = useState<Record<string, string>>({})

  async function handleSave(key: string) {
    setSavingKey(key)
    try {
      await settingsService.update(key, draft[key])
      reload()
    } finally {
      setSavingKey(null)
    }
  }

  return (
    <div>
      <PageHeader title="Settings" description="Platform-wide configuration for PureEats." />
      <div className="mb-4">
        <Tabs items={TABS} activeKey={tab} onChange={setTab} />
      </div>

      {tab === 'general' && (
        isLoading || !settings ? <LoadingBlock /> : (
          <div className="card divide-y divide-slate-100">
            {settings.map((setting) => (
              <div key={setting.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <label htmlFor={setting.key} className="text-sm font-medium capitalize text-slate-700">
                  {setting.key.replace(/_/g, ' ')}
                </label>
                <div className="flex items-center gap-2 sm:w-72">
                  <TextInput
                    id={setting.key}
                    defaultValue={setting.value}
                    onChange={(e) => setDraft((prev) => ({ ...prev, [setting.key]: e.target.value }))}
                  />
                  <button className="btn-secondary shrink-0" onClick={() => handleSave(setting.key)} disabled={savingKey === setting.key}>
                    {savingKey === setting.key ? 'Saving…' : 'Save'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {tab === 'payments' && (
        <div className="card divide-y divide-slate-100">
          {(gateways ?? []).map((gateway) => (
            <div key={gateway.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="font-medium text-slate-800">{gateway.name}</p>
                <p className="text-sm text-slate-500">{gateway.description}</p>
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
      )}

      {tab === 'sms' && (
        <div className="card divide-y divide-slate-100">
          {(smsGateways ?? []).map((gateway) => (
            <div key={gateway.id} className="flex items-center justify-between px-4 py-3">
              <p className="font-medium text-slate-800">{gateway.gatewayName}</p>
              <ActiveBadge active={gateway.isActive} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
