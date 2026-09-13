import { useState } from 'react'
import { CreditCard } from 'lucide-react'
import { SectionCard } from '@/components/ui/SectionCard'
import { Switch } from '@/components/ui/FormControls'
import { useAsync } from '@/hooks/useAsync'
import { useSettingsConfirmation } from '@/hooks/useSettingsConfirmation'
import { settingsService } from '@/services/settingsService'
import { ConfirmPasswordDialog } from './ConfirmPasswordDialog'
import type { PaymentGateway } from '@/types/entities'

/**
 * Its own component (not inlined in SettingsPage) specifically so useSettingsConfirmation() reads
 * the real settingsConfirmationEnabled value - that hook reads SettingsConfirmationContext, and a
 * component can only see a Provider that's an ANCESTOR of it in the tree. SettingsPage renders
 * <SettingsConfirmationProvider> as part of its own return value, so calling the hook directly in
 * SettingsPage's body (as this used to be, inlined) sees only the default context (`enabled: false`)
 * - the toggle silently never asked for a password no matter the actual setting. Every other panel
 * here (RazorpayConfigPanel, SectionVisibilityPanel, ...) already avoids this by being its own
 * component rendered as a *child* of the provider, which is what this now does too.
 */
export function PaymentGatewaysPanel() {
  const { data: gateways, reload } = useAsync(() => settingsService.paymentGateways(), [])
  const { requestConfirmation, open, handleConfirm, handleCancel } = useSettingsConfirmation()
  const [error, setError] = useState<string | null>(null)

  async function handleToggle(gateway: PaymentGateway, nextActive: boolean) {
    setError(null)
    const confirmPassword = await requestConfirmation()
    if (confirmPassword === null) return // admin cancelled
    try {
      await settingsService.togglePaymentGateway(gateway.id, nextActive, confirmPassword)
      reload()
    } catch (err) {
      setError((err as { message?: string })?.message ?? `Could not update ${gateway.name}`)
    }
  }

  return (
    <SectionCard title="Payment gateways" icon={CreditCard} description="Enable the ways customers can pay for orders.">
      {open && <ConfirmPasswordDialog onConfirm={handleConfirm} onCancel={handleCancel} />}
      {error && <p className="mb-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">{error}</p>}
      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {(gateways ?? []).map((gateway) => (
          <div key={gateway.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
            <div>
              <p className="font-medium text-slate-800 dark:text-slate-100">{gateway.name}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">{gateway.description}</p>
            </div>
            <Switch checked={gateway.isActive} onChange={(v) => handleToggle(gateway, v)} />
          </div>
        ))}
      </div>
    </SectionCard>
  )
}
