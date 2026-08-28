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

export const AUTH_TOKEN_STORAGE_KEY = 'pureeats.auth.token'
export const AUTH_USER_STORAGE_KEY = 'pureeats.auth.user'
