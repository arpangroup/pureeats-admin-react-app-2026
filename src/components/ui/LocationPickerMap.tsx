import { useEffect, useRef, useState } from 'react'
import { Loader2, LocateFixed, MapPin, Search } from 'lucide-react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import markerIconUrl from 'leaflet/dist/images/marker-icon.png'
import markerIcon2xUrl from 'leaflet/dist/images/marker-icon-2x.png'
import markerShadowUrl from 'leaflet/dist/images/marker-shadow.png'
import { useDebounce } from '@/hooks/useDebounce'
import { classNames } from '@/lib/format'

// Leaflet's default marker icon references image paths that don't survive bundling — point it at
// the actual bundled asset URLs Vite produces for these instead.
const markerIcon = L.icon({
  iconUrl: markerIconUrl,
  iconRetinaUrl: markerIcon2xUrl,
  shadowUrl: markerShadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

// Bangalore — matches the rest of this app's mock data, and is a reasonable default center
// when no restaurant location is set yet.
const DEFAULT_CENTER: [number, number] = [12.9716, 77.5946]

// Minimum characters before we bother querying, and how long to wait after the user stops typing —
// keeps this well under Nominatim's ~1 request/sec usage-policy ceiling without a search button.
const MIN_QUERY_LENGTH = 3
const DEBOUNCE_MS = 450

/**
 * Validates and narrows in one step — a plain `(lat, lng) is number` predicate can only narrow the
 * first parameter, so TS still treats `lng` as possibly null/undefined at every call site. Returning
 * the pair (or null) narrows both at once via destructuring instead.
 */
function toValidCoordinate(lat: number | null | undefined, lng: number | null | undefined): [number, number] | null {
  if (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180 &&
    !(lat === 0 && lng === 0)
  ) {
    return [lat, lng]
  }
  return null
}

interface GeocodeResult {
  label: string
  lat: number
  lng: number
}

/** OpenStreetMap's free Nominatim geocoder. */
async function searchAddress(query: string, signal: AbortSignal): Promise<GeocodeResult[]> {
  const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=6&q=${encodeURIComponent(query)}`, { signal })
  if (!res.ok) throw new Error('Search failed')
  const rows: { display_name: string; lat: string; lon: string }[] = await res.json()
  return rows.map((r) => ({ label: r.display_name, lat: Number(r.lat), lng: Number(r.lon) }))
}

/** The reverse direction — turns a lat/lng the pin just moved to (click, drag, "use my location") back into a readable address. */
async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
  if (!res.ok) throw new Error('Reverse geocode failed')
  const row: { display_name?: string } = await res.json()
  return row.display_name ?? null
}

interface LocationPickerMapProps {
  lat: number | null | undefined
  lng: number | null | undefined
  onChange: (lat: number, lng: number) => void
  /** Called whenever the pin moves from a map interaction (click, drag, search pick, "use my location") with the resolved address — not called for external lat/lng changes like typing in the coordinate fields. */
  onAddressResolved?: (address: string) => void
  height?: number
}

/** Interactive OpenStreetMap picker — search an address (live autocomplete), click anywhere, or drag the pin to set lat/lng; typing in the coordinate fields moves the pin back. */
export function LocationPickerMap({ lat, lng, onChange, onAddressResolved, height = 260 }: LocationPickerMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markerRef = useRef<L.Marker | null>(null)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange
  const onAddressResolvedRef = useRef(onAddressResolved)
  onAddressResolvedRef.current = onAddressResolved

  /** Best-effort — a failed reverse geocode just leaves the address field untouched, never blocks setting lat/lng. */
  function resolveAddress(latitude: number, longitude: number) {
    reverseGeocode(latitude, longitude)
      .then((address) => {
        if (address) onAddressResolvedRef.current?.(address)
      })
      .catch(() => {})
  }

  const wrapperRef = useRef<HTMLDivElement>(null)
  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [results, setResults] = useState<GeocodeResult[]>([])
  const [searchError, setSearchError] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const debouncedQuery = useDebounce(query, DEBOUNCE_MS)
  const skipNextSearchRef = useRef(false)
  const [locating, setLocating] = useState(false)
  const [locateError, setLocateError] = useState<string | null>(null)

  function locateMe() {
    if (!navigator.geolocation) {
      setLocateError('Geolocation is not supported by this browser.')
      return
    }
    setLocating(true)
    setLocateError(null)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = Number(position.coords.latitude.toFixed(6))
        const longitude = Number(position.coords.longitude.toFixed(6))
        onChange(latitude, longitude)
        resolveAddress(latitude, longitude)
        setQuery('')
        setResults([])
        setOpen(false)
        setLocating(false)
      },
      () => {
        setLocateError('Could not get your current location — check browser/site permissions.')
        setLocating(false)
      },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  // Fires automatically as the user pauses typing — no search button.
  useEffect(() => {
    const trimmed = debouncedQuery.trim()
    if (skipNextSearchRef.current) {
      skipNextSearchRef.current = false
      return
    }
    if (trimmed.length < MIN_QUERY_LENGTH) {
      setResults([])
      setSearching(false)
      setSearchError(null)
      return
    }
    const controller = new AbortController()
    setSearching(true)
    setSearchError(null)
    searchAddress(trimmed, controller.signal)
      .then((found) => {
        setResults(found)
        setActiveIndex(-1)
        if (found.length === 0) setSearchError('No matches found — try a different search.')
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === 'AbortError') return
        setResults([])
        setSearchError('Search failed — check your connection and try again.')
      })
      .finally(() => setSearching(false))
    return () => controller.abort()
  }, [debouncedQuery])

  function pickResult(result: GeocodeResult) {
    skipNextSearchRef.current = true
    onChange(result.lat, result.lng)
    onAddressResolved?.(result.label)
    setResults([])
    setOpen(false)
    setActiveIndex(-1)
    setQuery(result.label)
  }

  // Close the dropdown on an outside click, same pattern as any combobox.
  useEffect(() => {
    function handlePointerDown(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [])

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    const initialValid = toValidCoordinate(lat, lng)
    const initialCenter: [number, number] = initialValid ?? DEFAULT_CENTER

    const map = L.map(containerRef.current, { zoomControl: false }).setView(initialCenter, initialValid ? 15 : 12)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors',
    }).addTo(map)

    const marker = L.marker(initialCenter, { icon: markerIcon, draggable: true }).addTo(map)
    marker.on('dragend', () => {
      const pos = marker.getLatLng()
      const newLat = Number(pos.lat.toFixed(6))
      const newLng = Number(pos.lng.toFixed(6))
      onChangeRef.current(newLat, newLng)
      resolveAddress(newLat, newLng)
    })
    map.on('click', (e: L.LeafletMouseEvent) => {
      marker.setLatLng(e.latlng)
      const newLat = Number(e.latlng.lat.toFixed(6))
      const newLng = Number(e.latlng.lng.toFixed(6))
      onChangeRef.current(newLat, newLng)
      resolveAddress(newLat, newLng)
    })

    mapRef.current = map
    markerRef.current = marker

    return () => {
      map.remove()
      mapRef.current = null
      markerRef.current = null
    }
    // Init once — lat/lng changes after mount are handled by the sync effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Keep the pin in sync when lat/lng change from outside the map itself (e.g. the number inputs).
  useEffect(() => {
    const map = mapRef.current
    const marker = markerRef.current
    const valid = toValidCoordinate(lat, lng)
    if (!map || !marker || !valid) return
    const [validLat, validLng] = valid
    const current = marker.getLatLng()
    if (Math.abs(current.lat - validLat) > 1e-9 || Math.abs(current.lng - validLng) > 1e-9) {
      marker.setLatLng([validLat, validLng])
      map.setView([validLat, validLng], Math.max(map.getZoom(), 15))
    }
  }, [lat, lng])

  const showDropdown = open && (results.length > 0 || searchError)

  return (
    <div>
      <div ref={wrapperRef} className="relative mb-2">
        <div className="relative">
          {searching ? (
            <Loader2 size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 animate-spin text-slate-400" />
          ) : (
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          )}
          <input
            type="text"
            className="input pl-9"
            placeholder="Search for an address or place…"
            value={query}
            onFocus={() => setOpen(true)}
            onChange={(e) => {
              setQuery(e.target.value)
              setOpen(true)
            }}
            onKeyDown={(e) => {
              if (!showDropdown || results.length === 0) return
              if (e.key === 'ArrowDown') {
                e.preventDefault()
                setActiveIndex((i) => (i + 1) % results.length)
              } else if (e.key === 'ArrowUp') {
                e.preventDefault()
                setActiveIndex((i) => (i <= 0 ? results.length - 1 : i - 1))
              } else if (e.key === 'Enter') {
                e.preventDefault()
                if (activeIndex >= 0) pickResult(results[activeIndex])
              } else if (e.key === 'Escape') {
                setOpen(false)
              }
            }}
          />
        </div>
        {showDropdown && (
          <ul className="absolute z-[1000] mt-1 max-h-64 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-800">
            {results.map((result, i) => (
              <li key={i}>
                <button
                  type="button"
                  className={classNames(
                    'flex w-full items-start gap-2 px-3 py-2 text-left text-sm text-slate-700 dark:text-slate-200',
                    i === activeIndex ? 'bg-brand-50 dark:bg-brand-500/10' : 'hover:bg-slate-50 dark:hover:bg-slate-700',
                  )}
                  onMouseEnter={() => setActiveIndex(i)}
                  onClick={() => pickResult(result)}
                >
                  <MapPin size={14} className="mt-0.5 shrink-0 text-slate-400" />
                  <span>{result.label}</span>
                </button>
              </li>
            ))}
            {results.length === 0 && searchError && (
              <li className="px-3 py-2 text-sm text-slate-400 dark:text-slate-500">{searchError}</li>
            )}
          </ul>
        )}
      </div>
      <div className="relative">
        <div ref={containerRef} className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700" style={{ height }} />
        <button
          type="button"
          onClick={locateMe}
          disabled={locating}
          title="Use my current location"
          aria-label="Use my current location"
          className="absolute right-2.5 top-2.5 z-[1000] flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
        >
          {locating ? <Loader2 size={16} className="animate-spin" /> : <LocateFixed size={16} />}
        </button>
      </div>
      {locateError && <p className="mt-1.5 text-xs text-rose-500">{locateError}</p>}
      <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
        Search for an address above, use your current location, click anywhere on the map, or drag the pin, to set the restaurant's exact location — the latitude/longitude fields below update automatically.
      </p>
    </div>
  )
}
