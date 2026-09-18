/**
 * Single source of truth for "where does data come from".
 *
 * Everything in src/services/* reads DATA_SOURCE and either returns the
 * organized mock fixtures (src/mocks) or calls the real API through
 * src/lib/apiClient.ts. No component ever branches on this itself — the
 * branch lives once, here, and in each service file's `if` at the top of
 * each function. Flipping VITE_DATA_SOURCE=live in .env (or a hosting
 * platform's env vars) is the only change needed to point the whole app
 * at the Spring Boot backend once it exists — no component/page changes.
 */

export type DataSource = 'mock' | 'live'

export const DATA_SOURCE: DataSource = (import.meta.env.VITE_DATA_SOURCE as DataSource) || 'mock'

export const IS_MOCK = DATA_SOURCE === 'mock'

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'

export const MOCK_DELAY_MS = Number(import.meta.env.VITE_MOCK_DELAY_MS ?? 350)

/** Mock-mode stand-in for the backend's pureeats.settings.confirmation-password env property — blank/unset means the settings-confirmation-password feature is off, same as on the real backend. There's no admin-panel UI to set this in either mode, only env config. */
export const MOCK_SETTINGS_CONFIRMATION_PASSWORD = import.meta.env.VITE_MOCK_SETTINGS_CONFIRMATION_PASSWORD || ''

/** Google Maps JavaScript API key, used only as a build-time fallback for local dev — the real
 * source is the backend's public GET /app-config (see appConfigService.getPublicGoogleMapsApiKey),
 * same admin-configurable value the customer app reads. When neither resolves to a key, every map
 * in this app (LocationPickerMap) falls back to OpenStreetMap/Leaflet, which needs no key at all. */
export const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''

export const AUTH_TOKEN_STORAGE_KEY = 'pureeats.auth.token'
export const AUTH_USER_STORAGE_KEY = 'pureeats.auth.user'
export const AUTH_REFRESH_TOKEN_STORAGE_KEY = 'pureeats.auth.refreshToken'
