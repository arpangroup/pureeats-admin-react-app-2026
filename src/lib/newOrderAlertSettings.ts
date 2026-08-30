const STORAGE_KEY = 'pureeats_new_order_alert_settings'

export interface NewOrderAlertSettings {
  enabled: boolean
  soundEnabled: boolean
  intervalSeconds: number
}

export const DEFAULT_NEW_ORDER_ALERT_SETTINGS: NewOrderAlertSettings = {
  enabled: false,
  soundEnabled: true,
  intervalSeconds: 20,
}

export const NEW_ORDER_ALERT_INTERVAL_OPTIONS = [15, 20, 30, 60] as const

/** Per-browser preference — deliberately not synced to the backend, this is a local "do you want popups on this device" toggle. */
export function readNewOrderAlertSettings(): NewOrderAlertSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_NEW_ORDER_ALERT_SETTINGS
    const parsed = JSON.parse(raw)
    return { ...DEFAULT_NEW_ORDER_ALERT_SETTINGS, ...parsed }
  } catch {
    return DEFAULT_NEW_ORDER_ALERT_SETTINGS
  }
}

export function writeNewOrderAlertSettings(settings: NewOrderAlertSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch {
    // Storage unavailable (private browsing, quota) — the toggle just won't persist across reloads.
  }
}
