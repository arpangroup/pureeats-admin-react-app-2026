import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { GoogleMap, MarkerF, PolylineF } from '@react-google-maps/api'
import { AlertTriangle, Bike, Eraser, Gauge, Loader2, MapPin, MapPinPlus, Navigation, Pause, Play, Route as RouteIcon, RotateCcw, Search, Undo2 } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { SectionCard } from '@/components/ui/SectionCard'
import { Field, Select, Textarea } from '@/components/ui/FormControls'
import { Badge, EmptyState, LoadingBlock } from '@/components/ui/Feedback'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import { GooglePlaceSearchBox, searchAddress, DEBOUNCE_MS, MIN_QUERY_LENGTH, type GeocodeResult } from '@/components/ui/LocationPickerMap'
import { useAsync } from '@/hooks/useAsync'
import { useDebounce } from '@/hooks/useDebounce'
import { useRouteSimulation, type LatLng } from '@/hooks/useRouteSimulation'
import { useGoogleMaps } from '@/context/GoogleMapsContext'
import { deliveryGuyService, type DeliveryGuyRow } from '@/services/deliveryGuyService'
import { deliveryLocationSimulateService } from '@/services/deliveryLocationSimulateService'
import { demoRoutes } from '@/mocks/fixtures/demoRoutes'
import { classNames } from '@/lib/format'

const SPEED_OPTIONS = [1, 2, 4]

const EMPTY_WAYPOINTS: LatLng[] = []

function emojiIcon(emoji: string): L.DivIcon {
  return L.divIcon({
    className: '',
    html: `<span style="font-size:22px;line-height:1;display:block;filter:drop-shadow(0 1px 1px rgb(0 0 0 / 0.35))">${emoji}</span>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  })
}

const START_ICON = emojiIcon('🏁')
const END_ICON = emojiIcon('📍')
const RIDER_ICON = emojiIcon('🛵')

const DEFAULT_CENTER: [number, number] = [12.9716, 77.5946] // Bangalore — matches the rest of this app's mock data.

const MAP_HEIGHT = 420

/** A search-box selection — `token` is bumped on every pick (even re-picking the same place) so the
 * map's "pan there" effect fires every time, not just when the lat/lng value actually changes. */
interface FocusRequest {
  lat: number
  lng: number
  token: number
}

interface RouteMapProps {
  waypoints: LatLng[]
  position: LatLng
  onMapClick?: (point: LatLng) => void
  focusRequest: FocusRequest | null
}

/**
 * OpenStreetMap/Leaflet map, no API key required — same fallback LocationPickerMap uses when Google
 * Maps isn't configured (see the RouteSimulatorMap picker below, which chooses between this and
 * GoogleRouteMap the same way LocationPickerMap does).
 *
 * `onMapClick` (only set in custom-route-editing mode, see DeliverySimulatorPage) turns every map
 * click into a new waypoint — the click handler is attached/detached in its own effect keyed on
 * the callback identity, not the mount effect, so it always sees the latest `onMapClick` closure
 * without needing to recreate the whole map. `focusRequest` (from the address search box) pans the
 * map to a searched place without adding a waypoint, so the user can then click precisely nearby.
 */
function OsmRouteMap({ waypoints, position, onMapClick, focusRequest }: RouteMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<L.Map | null>(null)
  const riderMarkerRef = useRef<L.Marker | null>(null)
  const routeLayerRef = useRef<L.LayerGroup | null>(null)

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    const map = L.map(containerRef.current, { zoomControl: true, attributionControl: true }).setView(DEFAULT_CENTER, 12)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors',
    }).addTo(map)
    mapRef.current = map
    return () => {
      map.remove()
      mapRef.current = null
      riderMarkerRef.current = null
      routeLayerRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !onMapClick) return
    function handleClick(e: L.LeafletMouseEvent) {
      onMapClick?.({ lat: e.latlng.lat, lng: e.latlng.lng })
    }
    map.on('click', handleClick)
    return () => {
      map.off('click', handleClick)
    }
  }, [onMapClick])

  // Pan to a searched address without touching the route itself.
  useEffect(() => {
    const map = mapRef.current
    if (!map || !focusRequest) return
    map.setView([focusRequest.lat, focusRequest.lng], Math.max(map.getZoom(), 15))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusRequest?.token])

  // Redraw the route (start pin always; polyline + end pin once there are 2+ points) and fit the
  // map to it whenever the waypoints change.
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    routeLayerRef.current?.remove()
    routeLayerRef.current = null
    if (waypoints.length === 0) return
    const latlngs: L.LatLngExpression[] = waypoints.map((w) => [w.lat, w.lng])
    const layers: L.Layer[] = [L.marker(latlngs[0], { icon: START_ICON, interactive: false })]
    if (waypoints.length >= 2) {
      layers.push(
        L.polyline(latlngs, { color: '#f2612c', weight: 3, opacity: 0.75 }),
        L.marker(latlngs[latlngs.length - 1], { icon: END_ICON, interactive: false }),
      )
    }
    routeLayerRef.current = L.layerGroup(layers).addTo(map)
    if (waypoints.length >= 2) map.fitBounds(L.latLngBounds(latlngs), { padding: [32, 32] })
    else map.setView(latlngs[0], Math.max(map.getZoom(), 14))
  }, [waypoints])

  // Create/move/remove the animated rider marker as the simulation's position updates — kept
  // separate from the route-redraw effect so the marker eases smoothly frame-to-frame instead of
  // the whole map (and route layer) re-initializing on every tick.
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    if (waypoints.length < 2) {
      riderMarkerRef.current?.remove()
      riderMarkerRef.current = null
      return
    }
    if (!riderMarkerRef.current) {
      riderMarkerRef.current = L.marker([position.lat, position.lng], { icon: RIDER_ICON, interactive: false }).addTo(map)
    } else {
      riderMarkerRef.current.setLatLng([position.lat, position.lng])
    }
  }, [position.lat, position.lng, waypoints.length])

  return <div ref={containerRef} className="w-full overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700" style={{ height: MAP_HEIGHT }} />
}

const GOOGLE_MARKER_LABEL_STYLE = { fontSize: '20px', className: 'select-none' }

/** Same picker experience as OsmRouteMap, backed by the real Google Maps JS API instead — mirrors LocationPickerMap's GoogleLocationPicker (panTo/fitBounds driven imperatively via the map instance, not the center/zoom props, which react-google-maps/api only honors on initial mount). */
function GoogleRouteMap({ waypoints, position, onMapClick, focusRequest }: RouteMapProps) {
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null)
  const initialCenter = waypoints[0] ? { lat: waypoints[0].lat, lng: waypoints[0].lng } : { lat: DEFAULT_CENTER[0], lng: DEFAULT_CENTER[1] }

  useEffect(() => {
    if (!mapInstance) return
    if (waypoints.length >= 2) {
      const bounds = new google.maps.LatLngBounds()
      waypoints.forEach((w) => bounds.extend({ lat: w.lat, lng: w.lng }))
      mapInstance.fitBounds(bounds, 40)
    } else if (waypoints.length === 1) {
      mapInstance.panTo(waypoints[0])
      mapInstance.setZoom(15)
    }
  }, [mapInstance, waypoints])

  useEffect(() => {
    if (!mapInstance || !focusRequest) return
    mapInstance.panTo({ lat: focusRequest.lat, lng: focusRequest.lng })
    mapInstance.setZoom(15)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapInstance, focusRequest?.token])

  function handleClick(e: google.maps.MapMouseEvent) {
    if (!onMapClick) return
    const lat = e.latLng?.lat()
    const lng = e.latLng?.lng()
    if (lat === undefined || lng === undefined) return
    onMapClick({ lat, lng })
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: MAP_HEIGHT }}
        center={initialCenter}
        zoom={waypoints.length ? 14 : 12}
        onLoad={setMapInstance}
        onClick={handleClick}
        options={{ streetViewControl: false, mapTypeControl: false, fullscreenControl: false, zoomControl: true, gestureHandling: 'greedy' }}
      >
        {waypoints.length >= 1 && <MarkerF position={waypoints[0]} label={{ text: '🏁', ...GOOGLE_MARKER_LABEL_STYLE }} />}
        {waypoints.length >= 2 && (
          <>
            <PolylineF path={waypoints.map((w) => ({ lat: w.lat, lng: w.lng }))} options={{ strokeColor: '#f2612c', strokeWeight: 3, strokeOpacity: 0.75 }} />
            <MarkerF position={waypoints[waypoints.length - 1]} label={{ text: '📍', ...GOOGLE_MARKER_LABEL_STYLE }} />
            <MarkerF position={position} label={{ text: '🛵', ...GOOGLE_MARKER_LABEL_STYLE }} />
          </>
        )}
      </GoogleMap>
    </div>
  )
}

/**
 * Picks Google Maps whenever a key is actually configured and loads successfully, OpenStreetMap
 * otherwise — the free option that needs no key, so this always renders a working map. Same
 * fallback rule LocationPickerMap already uses for the restaurant/address pickers.
 */
function RouteSimulatorMap(props: RouteMapProps) {
  const { wantsGoogle, isLoaded } = useGoogleMaps()
  if (wantsGoogle) {
    if (!isLoaded) {
      return (
        <div className="flex w-full items-center justify-center rounded-xl border border-slate-200 text-xs text-slate-400 dark:border-slate-700" style={{ height: MAP_HEIGHT }}>
          Loading map…
        </div>
      )
    }
    return <GoogleRouteMap {...props} />
  }
  return <OsmRouteMap {...props} />
}

/** Nominatim-backed "search an address, pick a result, pan the map there" input for the OSM route
 * map. Unlike LocationPickerMap's picker (which also drops/moves a single pin on a pick), this only
 * recenters the map — the user still clicks to place waypoints precisely near the searched place. */
function AddressSearchInput({ onSelect }: { onSelect: (lat: number, lng: number, label: string) => void }) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [results, setResults] = useState<GeocodeResult[]>([])
  const [searchError, setSearchError] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const debouncedQuery = useDebounce(query, DEBOUNCE_MS)
  const skipNextSearchRef = useRef(false)

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

  useEffect(() => {
    function handlePointerDown(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [])

  function pickResult(result: GeocodeResult) {
    skipNextSearchRef.current = true
    onSelect(result.lat, result.lng, result.label)
    setResults([])
    setOpen(false)
    setActiveIndex(-1)
    setQuery(result.label)
  }

  const showDropdown = open && (results.length > 0 || !!searchError)

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        {searching ? (
          <Loader2 size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 animate-spin text-slate-400" />
        ) : (
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        )}
        <input
          type="text"
          className="input pl-9"
          placeholder="Search an address to jump the map there…"
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
          {results.length === 0 && searchError && <li className="px-3 py-2 text-sm text-slate-400 dark:text-slate-500">{searchError}</li>}
        </ul>
      )}
    </div>
  )
}

export default function DeliverySimulatorPage() {
  // No backend "/all" endpoint exists for delivery guys either (same situation CartSimulatorPage
  // documents for restaurants) — pull a large page instead of a true listAll().
  const { data: ridersPage, isLoading: ridersLoading } = useAsync(() => deliveryGuyService.list({ perPage: 200 }), [])
  const riders = ridersPage?.data ?? []

  const [selectedRider, setSelectedRider] = useState<DeliveryGuyRow | null>(null)
  const [selectedRouteId, setSelectedRouteId] = useState<string>('')
  const selectedRoute = useMemo(() => demoRoutes.find((r) => r.id === selectedRouteId) ?? null, [selectedRouteId])

  // Custom routes: built by clicking points on the map (each click appends a waypoint, drawing the
  // route live) and/or pasting "lat,lng" lines into the textarea below and hitting "Load points" —
  // both feed this same array, so either method (or a mix) works.
  const [routeSource, setRouteSource] = useState<'demo' | 'custom'>('demo')
  const [customWaypoints, setCustomWaypoints] = useState<LatLng[]>(EMPTY_WAYPOINTS)
  const [customRouteText, setCustomRouteText] = useState('')
  const [customRouteError, setCustomRouteError] = useState<string | null>(null)

  // Set by the address search box (Google Places or Nominatim, whichever the map is running) — pans
  // the map to a searched place without adding a waypoint, so the next click lands precisely.
  const [focusRequest, setFocusRequest] = useState<FocusRequest | null>(null)
  const { wantsGoogle: mapWantsGoogle, isLoaded: googleMapsLoaded } = useGoogleMaps()

  function handleAddressFound(lat: number, lng: number) {
    setFocusRequest({ lat, lng, token: Date.now() })
  }

  function handleGooglePlaceSelected(place: google.maps.places.Place) {
    const location = place.location
    if (!location) return
    handleAddressFound(location.lat(), location.lng())
  }

  // A stable array reference per route/mode (and a stable EMPTY_WAYPOINTS when none is picked) —
  // the simulation hook resets playback whenever this identity changes, so it must only change when
  // the actual route data changes, not on every render.
  const waypoints = routeSource === 'demo' ? (selectedRoute?.waypoints ?? EMPTY_WAYPOINTS) : customWaypoints

  const [lastPushError, setLastPushError] = useState<string | null>(null)
  const [lastPushAt, setLastPushAt] = useState<number | null>(null)

  const sim = useRouteSimulation(waypoints, {
    durationMs: 20000,
    tickIntervalMs: 1000,
    onTick: (pos) => {
      if (!selectedRider) return
      deliveryLocationSimulateService
        .pushLocation(selectedRider.id, pos.lat, pos.lng)
        .then(() => {
          setLastPushError(null)
          setLastPushAt(Date.now())
        })
        .catch((err) => {
          setLastPushError((err as { message?: string })?.message ?? 'Location push failed')
        })
    },
  })

  // A fresh rider or route selection shouldn't keep showing a stale push error from a previous run.
  useEffect(() => {
    setLastPushError(null)
    setLastPushAt(null)
  }, [selectedRider?.id, selectedRouteId, routeSource])

  // sim.progress (and therefore sim.position) update every animation frame while playing, which
  // would recreate this callback ~60x/sec and, with it, thrash RouteSimulatorMap's click-listener
  // effect (whose identity dependency is this function). isPlayingRef sidesteps that: the callback
  // stays referentially stable across renders, so the map's click listener is only ever attached once.
  const isPlayingRef = useRef(sim.isPlaying)
  isPlayingRef.current = sim.isPlaying

  const handleAddCustomPoint = useCallback((point: LatLng) => {
    if (isPlayingRef.current) return // avoid mutating the route the animation is mid-flight through
    setCustomWaypoints((prev) => [...prev, point])
    setCustomRouteError(null)
  }, [])

  function handleUndoLastPoint() {
    setCustomWaypoints((prev) => prev.slice(0, -1))
  }

  function handleClearCustomPoints() {
    setCustomWaypoints(EMPTY_WAYPOINTS)
    setCustomRouteText('')
    setCustomRouteError(null)
  }

  /** Parses "lat,lng" (or "lat lng") one per line, ignoring blank lines - appends onto whatever
   * points already exist (from prior clicks or a prior paste) rather than replacing them, so
   * clicking the map and pasting coordinates can be freely combined. */
  function handleLoadCustomText() {
    const lines = customRouteText.split('\n').map((l) => l.trim()).filter(Boolean)
    if (lines.length === 0) {
      setCustomRouteError('Paste at least one "lat,lng" line first.')
      return
    }
    const parsed: LatLng[] = []
    for (const line of lines) {
      const parts = line.split(/[,\s]+/).filter(Boolean)
      const lat = Number(parts[0])
      const lng = Number(parts[1])
      if (parts.length !== 2 || Number.isNaN(lat) || Number.isNaN(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
        setCustomRouteError(`Couldn't parse "${line}" as "lat,lng" (e.g. 12.9716,77.5946).`)
        return
      }
      parsed.push({ lat, lng })
    }
    setCustomWaypoints((prev) => [...prev, ...parsed])
    setCustomRouteText('')
    setCustomRouteError(null)
  }

  const hasRoute = routeSource === 'demo' ? !!selectedRoute : customWaypoints.length >= 2
  const canPlay = !!selectedRider && hasRoute
  const playDisabledReason = !selectedRider && !hasRoute
    ? routeSource === 'demo'
      ? 'Pick a delivery partner and a route to start playback.'
      : 'Pick a delivery partner and add at least 2 points to start playback.'
    : !selectedRider
      ? 'Pick a delivery partner to start playback.'
      : !hasRoute
        ? routeSource === 'demo'
          ? 'Pick a route to start playback.'
          : 'Add at least 2 points (click the map or paste coordinates) to start playback.'
        : null

  return (
    <div>
      <PageHeader
        title="Delivery Route Simulator"
        description="Play back simulated GPS movement for a delivery partner along a demo route — each tick also pushes the position to the backend, so a concurrently-open rider app or order-tracking view reflects it live."
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[380px_1fr]">
        <div className="space-y-4">
          <SectionCard title="Simulation setup" icon={RouteIcon}>
            <div className="space-y-4">
              <Field label="Delivery partner" hint="Their simulated position is what actually gets pushed to the backend on each tick.">
                {ridersLoading ? (
                  <LoadingBlock />
                ) : (
                  <SearchableSelect
                    items={riders}
                    value={selectedRider}
                    onChange={setSelectedRider}
                    getId={(r) => r.id}
                    getLabel={(r) => r.name}
                    getDescription={(r) => `${r.vehicleNumber || 'No vehicle'} — ${r.isOnline ? 'Online' : 'Offline'}`}
                    placeholder="Search delivery partners…"
                    emptyMessage="No delivery partners match"
                  />
                )}
              </Field>

              {selectedRider && (
                <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                  <Badge tone={selectedRider.isActive ? 'green' : 'slate'}>{selectedRider.isActive ? 'Active' : 'Inactive'}</Badge>
                  <Badge tone={selectedRider.isOnline ? 'green' : 'red'}>{selectedRider.isOnline ? 'Online' : 'Offline'}</Badge>
                  <Badge tone="slate">
                    <Bike size={11} className="mr-1 inline -mt-0.5" />
                    {selectedRider.vehicleNumber || 'No vehicle'}
                  </Badge>
                </div>
              )}

              <div>
                <p className="label mb-1.5">Route</p>
                <div className="flex gap-2">
                  {(['demo', 'custom'] as const).map((source) => (
                    <button
                      key={source}
                      type="button"
                      onClick={() => setRouteSource(source)}
                      className={`flex-1 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                        routeSource === source
                          ? 'border-brand-400 bg-brand-50 text-brand-700 dark:border-brand-500/50 dark:bg-brand-500/10 dark:text-brand-300'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-brand-500/10'
                      }`}
                    >
                      {source === 'demo' ? 'Demo route' : 'Custom route'}
                    </button>
                  ))}
                </div>
              </div>

              {routeSource === 'demo' ? (
                <>
                  <Field label="Demo route">
                    <Select value={selectedRouteId} onChange={(e) => setSelectedRouteId(e.target.value)}>
                      <option value="">Select a route…</option>
                      {demoRoutes.map((route) => (
                        <option key={route.id} value={route.id}>
                          {route.name}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  {selectedRoute && <p className="text-xs text-slate-400 dark:text-slate-500">{selectedRoute.description}</p>}
                </>
              ) : (
                <div className="space-y-2.5 rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                  <p className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300">
                    <MapPinPlus size={14} /> Click the map to add points ({customWaypoints.length} so far)
                  </p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500">Each click appends a waypoint in order, drawing the route live. Pause first if playback is running.</p>
                  <div className="flex gap-2">
                    <button type="button" className="btn-secondary flex-1 !py-1.5 !text-xs" disabled={customWaypoints.length === 0} onClick={handleUndoLastPoint}>
                      <Undo2 size={13} /> Undo last point
                    </button>
                    <button type="button" className="btn-secondary flex-1 !py-1.5 !text-xs" disabled={customWaypoints.length === 0} onClick={handleClearCustomPoints}>
                      <Eraser size={13} /> Clear
                    </button>
                  </div>

                  <Field label="Or paste coordinates" hint={'One "lat,lng" pair per line — appended to any points already placed above.'}>
                    <Textarea
                      rows={3}
                      value={customRouteText}
                      onChange={(e) => setCustomRouteText(e.target.value)}
                      placeholder={'12.9716,77.5946\n12.9352,77.6146\n12.9279,77.6271'}
                      className="font-mono text-xs"
                    />
                  </Field>
                  <button type="button" className="btn-secondary w-full !py-1.5 !text-xs" onClick={handleLoadCustomText}>
                    Load points from text
                  </button>
                  {customRouteError && <p className="text-xs text-rose-500">{customRouteError}</p>}
                </div>
              )}

              <div>
                <p className="label mb-1.5">Playback</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="btn-primary"
                    disabled={!canPlay || sim.isPlaying}
                    onClick={sim.play}
                  >
                    <Play size={15} /> Play
                  </button>
                  <button type="button" className="btn-secondary" disabled={!sim.isPlaying} onClick={sim.pause}>
                    <Pause size={15} /> Pause
                  </button>
                  <button
                    type="button"
                    className="btn-secondary"
                    disabled={!sim.isPlaying && sim.progress === 0}
                    onClick={sim.reset}
                  >
                    <RotateCcw size={15} /> Reset
                  </button>
                </div>
                {playDisabledReason && <p className="mt-1.5 text-xs text-amber-600 dark:text-amber-400">{playDisabledReason}</p>}
              </div>

              <Field label="Speed">
                <div className="flex gap-2">
                  {SPEED_OPTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => sim.setSpeed(s)}
                      className={`inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                        sim.speed === s
                          ? 'border-brand-400 bg-brand-50 text-brand-700 dark:border-brand-500/50 dark:bg-brand-500/10 dark:text-brand-300'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-brand-500/10'
                      }`}
                    >
                      <Gauge size={12} /> {s}x
                    </button>
                  ))}
                </div>
              </Field>

              {lastPushError && (
                <p className="flex items-start gap-1.5 text-xs text-rose-500">
                  <AlertTriangle size={13} className="mt-0.5 shrink-0" />
                  Last location push failed: {lastPushError}. Playback keeps running locally regardless.
                </p>
              )}
            </div>
          </SectionCard>
        </div>

        <div className="space-y-4">
          {routeSource === 'demo' && !selectedRoute ? (
            <EmptyState
              icon={<RouteIcon size={22} />}
              title="Pick a route to preview it"
              description="Choose a delivery partner and a demo route on the left to see the live map and play controls."
            />
          ) : (
            <SectionCard title="Live map" icon={Navigation}>
              {routeSource === 'custom' && (
                <div className="mb-3">
                  {mapWantsGoogle ? (
                    googleMapsLoaded && <GooglePlaceSearchBox onPlaceSelected={handleGooglePlaceSelected} />
                  ) : (
                    <AddressSearchInput onSelect={handleAddressFound} />
                  )}
                </div>
              )}
              <RouteSimulatorMap
                waypoints={waypoints}
                position={sim.position}
                onMapClick={routeSource === 'custom' ? handleAddCustomPoint : undefined}
                focusRequest={focusRequest}
              />
              {routeSource === 'custom' && waypoints.length === 0 && (
                <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">Search an address above to jump there, then click anywhere on the map to place your first waypoint.</p>
              )}
              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                <ReadoutStat label="Latitude" value={sim.position.lat.toFixed(6)} />
                <ReadoutStat label="Longitude" value={sim.position.lng.toFixed(6)} />
                <ReadoutStat label="Progress" value={`${Math.round(sim.progress * 100)}%`} />
                <ReadoutStat label="Distance" value={`${sim.distanceCoveredKm.toFixed(2)} / ${sim.totalDistanceKm.toFixed(2)} km`} />
              </dl>
              {selectedRider && lastPushAt && !lastPushError && (
                <p className="mt-3 text-xs text-emerald-600 dark:text-emerald-400">
                  Last pushed to {selectedRider.name}'s live location at {new Date(lastPushAt).toLocaleTimeString()}.
                </p>
              )}
            </SectionCard>
          )}
        </div>
      </div>
    </div>
  )
}

function ReadoutStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-100 px-3 py-2 dark:border-slate-800">
      <dt className="text-[11px] uppercase tracking-wide text-slate-400 dark:text-slate-500">{label}</dt>
      <dd className="mt-0.5 font-mono text-sm text-slate-700 dark:text-slate-200">{value}</dd>
    </div>
  )
}
