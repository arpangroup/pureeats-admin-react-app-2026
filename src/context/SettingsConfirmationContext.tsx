import { createContext, useContext, type ReactNode } from 'react'
import { useAsync } from '@/hooks/useAsync'
import { appConfigService } from '@/services/appConfigService'

/**
 * Whether the settings-confirmation-password feature is on, fetched once here and shared by every
 * save surface under SettingsPage — the schema-driven WiredSettingsGroupCard (one instance per
 * group, several per tab) and the three bespoke AppConfig panels (Google Maps, Razorpay, Firebase) —
 * rather than each of them independently fetching the whole AppConfig blob just to read one boolean
 * off it.
 *
 * This is deploy-time config (see AppConfigAdminResponse#settingsConfirmationEnabled, computed
 * backend-side from whether pureeats.settings.confirmation-password is set — there's no admin-panel
 * UI to flip it, so unlike the rest of AppConfig it can't change mid-session; a one-time fetch is
 * enough. `enabled` defaults to false while loading/on error - purely a UX convenience (skip the
 * dialog when we don't yet know). The backend re-verifies the password on every write regardless
 * (see AppConfigService#verifyConfirmationPassword), so a stale/missing flag here can never let an
 * unauthorized save through - worst case is a save request bounces once with "Incorrect confirmation
 * password" and the admin retries.
 */
const SettingsConfirmationContext = createContext<{ enabled: boolean }>({ enabled: false })

export function SettingsConfirmationProvider({ children }: { children: ReactNode }) {
  const { data } = useAsync(() => appConfigService.getAdmin(), [])
  return <SettingsConfirmationContext.Provider value={{ enabled: data?.settingsConfirmationEnabled ?? false }}>{children}</SettingsConfirmationContext.Provider>
}

export function useSettingsConfirmationFlag() {
  return useContext(SettingsConfirmationContext)
}
