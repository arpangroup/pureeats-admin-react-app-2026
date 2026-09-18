import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { useJsApiLoader } from '@react-google-maps/api'
import { appConfigService } from '@/services/appConfigService'
import { GOOGLE_MAPS_API_KEY as ENV_GOOGLE_MAPS_API_KEY } from '@/config/env'

// Referenced by identity from useJsApiLoader's internal cache — must stay a stable module-level
// constant, not recreated per render, or the loader thinks its config changed and reloads the
// script (same pitfall documented in the customer app's GoogleMapsContext.tsx).
const GOOGLE_MAPS_LIBRARIES: 'places'[] = ['places']

interface GoogleMapsContextValue {
  isLoaded: boolean
  loadError: Error | undefined
  /** True once the backend's public /app-config has actually returned a usable key (admin-set or
   * the build-time env fallback) — every map component checks this, not googleMapsApiKey directly,
   * to decide Google vs. OpenStreetMap. */
  wantsGoogle: boolean
}

const GoogleMapsContext = createContext<GoogleMapsContextValue>({ isLoaded: false, loadError: undefined, wantsGoogle: false })

export function useGoogleMaps(): GoogleMapsContextValue {
  return useContext(GoogleMapsContext)
}

/**
 * Mounts useJsApiLoader exactly once, for the app's whole lifetime, with a key that's already final
 * by the time this component first renders — see GoogleMapsProvider, which only renders this
 * (instead of a plain passthrough with wantsGoogle: false) once it has actually resolved whether a
 * key exists. Calling useJsApiLoader with a key that changes between renders trips the library's
 * own "Loader must not be called again with different options" crash - mounting this fresh only
 * once the key is already settled avoids that entirely (same fix the customer app already needed).
 */
function GoogleMapsLoader({ apiKey, children }: { apiKey: string; children: ReactNode }) {
  const { isLoaded, loadError } = useJsApiLoader({ id: 'pureeats-admin-google-maps', googleMapsApiKey: apiKey, libraries: GOOGLE_MAPS_LIBRARIES })
  const value: GoogleMapsContextValue = { isLoaded, loadError, wantsGoogle: !loadError }
  return <GoogleMapsContext.Provider value={value}>{children}</GoogleMapsContext.Provider>
}

/**
 * Fetches the backend's public GET /app-config once at app boot to learn whether a Google Maps key
 * is configured (admin-set, falling back to the build-time VITE_GOOGLE_MAPS_API_KEY for local dev)
 * — the same public endpoint the customer app and getPublicFirebaseConfig already use, so this
 * works for both the admin role and the restaurant-owner role (who can't call /admin/app-config).
 * Renders children as-is (every map stays OpenStreetMap-only) until that resolves, and forever
 * after if it resolves to no key at all.
 */
export function GoogleMapsProvider({ children }: { children: ReactNode }) {
  const [apiKey, setApiKey] = useState<string | null>(null)

  useEffect(() => {
    appConfigService
      .getPublicGoogleMapsApiKey()
      .then((key) => setApiKey(key || ENV_GOOGLE_MAPS_API_KEY || null))
      .catch(() => setApiKey(ENV_GOOGLE_MAPS_API_KEY || null))
  }, [])

  if (!apiKey) return <>{children}</>
  return <GoogleMapsLoader apiKey={apiKey}>{children}</GoogleMapsLoader>
}
