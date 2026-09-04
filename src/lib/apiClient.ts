import axios, { AxiosError, type AxiosRequestConfig, type InternalAxiosRequestConfig } from 'axios'
import { API_BASE_URL, AUTH_REFRESH_TOKEN_STORAGE_KEY, AUTH_TOKEN_STORAGE_KEY, AUTH_USER_STORAGE_KEY, IS_MOCK } from '@/config/env'
import { getDeviceId } from '@/lib/deviceId'
import { readStorage, removeStorage, writeStorage } from '@/lib/storage'
import type { ApiError } from '@/types/common'
import type { AuthTokenResponse } from '@/types/auth'

// This is the ONLY place that knows how to talk to the real backend.
// Every service in src/services/* calls through here when
// DATA_SOURCE === 'live'. Point it at the Spring Boot app by changing
// VITE_API_BASE_URL — nothing else in the app needs to change.
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.request.use((config) => {
  const token = readStorage<string | null>(AUTH_TOKEN_STORAGE_KEY, null)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  config.headers['X-Device-Id'] = getDeviceId()
  // The instance-level default 'Content-Type: application/json' header (set above) sticks even
  // for a FormData body, which stops the browser from setting its own multipart boundary — every
  // file upload (photos, gallery images, etc.) would otherwise silently go out as an empty/invalid
  // JSON-typed request. Let the browser set the correct multipart Content-Type itself instead.
  if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
    delete config.headers['Content-Type']
  }
  return config
})

// Dedupe concurrent identical GETs into one network request. Chiefly for React 18 StrictMode,
// which deliberately mounts every component twice in dev — two components (or one remounted
// twice) calling useAsync(() => service.get(id)) at the same instant would otherwise fire the
// same request twice; this makes the second caller just await the first's in-flight promise.
// Harmless (and rare) outside that case too: any two callers racing the same GET share one round trip.
// Untyped on purpose: axios's own `.get` overload signature is generic enough (and has shifted
// enough across versions) that trying to mirror it exactly here is brittle. The double cast through
// `unknown` at the end is what actually matters — every real caller still sees the normal, fully
// typed `apiClient.get<T>(...)` signature; only this file's internals are loosely typed.
const inFlightGets = new Map<string, Promise<unknown>>()
const rawGet = apiClient.get.bind(apiClient) as (url: string, config?: AxiosRequestConfig) => Promise<unknown>
const dedupedGet = (url: string, config?: AxiosRequestConfig): Promise<unknown> => {
  const key = `${url}?${JSON.stringify(config?.params ?? {})}`
  const existing = inFlightGets.get(key)
  if (existing) return existing
  const promise = rawGet(url, config).finally(() => {
    inFlightGets.delete(key)
  })
  inFlightGets.set(key, promise)
  return promise
}
apiClient.get = dedupedGet as unknown as typeof apiClient.get

interface RetriableConfig extends InternalAxiosRequestConfig {
  _retry?: boolean
}

let refreshInFlight: Promise<string | null> | null = null

/** Rotates the refresh token once, sharing the in-flight request across concurrent 401s. */
function refreshAccessToken(): Promise<string | null> {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      const refreshToken = readStorage<string | null>(AUTH_REFRESH_TOKEN_STORAGE_KEY, null)
      if (!refreshToken) return null
      try {
        const { data } = await apiClient.post<{ data: AuthTokenResponse }>('/auth/refresh', { refreshToken })
        writeStorage(AUTH_TOKEN_STORAGE_KEY, data.data.accessToken)
        writeStorage(AUTH_REFRESH_TOKEN_STORAGE_KEY, data.data.refreshToken)
        return data.data.accessToken
      } catch {
        return null
      }
    })().finally(() => {
      refreshInFlight = null
    })
  }
  return refreshInFlight
}

/** True for the `Map<String, String>` shape GlobalExceptionHandler.handleValidation puts in `data`. */
function isFieldErrorMap(value: unknown): value is Record<string, string> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    Object.values(value).every((v) => typeof v === 'string')
  )
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<{ message?: string; data?: unknown }>) => {
    const config = error.config as RetriableConfig | undefined
    const isRefreshCall = config?.url === '/auth/refresh'

    if (!IS_MOCK && error.response?.status === 401 && config && !config._retry && !isRefreshCall) {
      config._retry = true
      const newAccessToken = await refreshAccessToken()
      if (newAccessToken) {
        config.headers.Authorization = `Bearer ${newAccessToken}`
        return apiClient(config)
      }
      removeStorage(AUTH_TOKEN_STORAGE_KEY)
      removeStorage(AUTH_REFRESH_TOKEN_STORAGE_KEY)
      removeStorage(AUTH_USER_STORAGE_KEY)
    }

    // Field-level validation errors come back as { message: "Validation failed", data: { field: reason } }
    // (see GlobalExceptionHandler#handleValidation on the backend) — surface the per-field reasons instead
    // of the generic top-level message, so e.g. "address: must not be blank" replaces "Validation failed".
    const responseBody = error.response?.data
    const fieldErrors = isFieldErrorMap(responseBody?.data) ? responseBody.data : undefined
    const baseMessage = responseBody?.message ?? error.message ?? 'Something went wrong'
    const message = fieldErrors
      ? Object.entries(fieldErrors)
          .map(([field, reason]) => `${field}: ${reason}`)
          .join('; ')
      : baseMessage

    const apiError: ApiError = {
      message,
      status: error.response?.status,
      fieldErrors,
    }
    return Promise.reject(apiError)
  },
)
