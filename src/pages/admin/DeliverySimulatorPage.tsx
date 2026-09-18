import { useEffect, useMemo, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { AlertTriangle, Bike, Gauge, Navigation, Pause, Play, Route as RouteIcon, RotateCcw } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { SectionCard } from '@/components/ui/SectionCard'
import { Field, Select } from '@/components/ui/FormControls'
import { Badge, EmptyState, LoadingBlock } from '@/components/ui/Feedback'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import { useAsync } from '@/hooks/useAsync'
import { useRouteSimulation, type LatLng } from '@/hooks/useRouteSimulation'
import { deliveryGuyService, type DeliveryGuyRow } from '@/services/deliveryGuyService'
import { deliveryLocationSimulateService } from '@/services/deliveryLocationSimulateService'
import { demoRoutes } from '@/mocks/fixtures/demoRoutes'

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

/**
 * Free OpenStreetMap/Leaflet map, no API key required — same pragmatic choice LocationPickerMap
 * falls back to when Google Maps isn't configured. This page never needs Google's richer features
 * (place search, etc.), so it skips GoogleMapsContext entirely and always renders this, keeping the
 * simulator demoable in any environment without depending on a configured Maps key.
 */
function RouteSimulatorMap({ waypoints, position }: { waypoints: LatLng[]; position: LatLng }) {
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

  // Redraw the full route (polyline + start/end pins) and fit the map to it whenever the selected route changes.
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    routeLayerRef.current?.remove()
    routeLayerRef.current = null
    if (waypoints.length < 2) return
    const latlngs: L.LatLngExpression[] = waypoints.map((w) => [w.lat, w.lng])
    const layer = L.layerGroup([
      L.polyline(latlngs, { color: '#f2612c', weight: 3, opacity: 0.75 }),
      L.marker(latlngs[0], { icon: START_ICON, interactive: false }),
      L.marker(latlngs[latlngs.length - 1], { icon: END_ICON, interactive: false }),
    ]).addTo(map)
    routeLayerRef.current = layer
    map.fitBounds(L.latLngBounds(latlngs), { padding: [32, 32] })
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

  return <div ref={containerRef} className="h-[420px] w-full overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700" />
}

export default function DeliverySimulatorPage() {
  // No backend "/all" endpoint exists for delivery guys either (same situation CartSimulatorPage
  // documents for restaurants) — pull a large page instead of a true listAll().
  const { data: ridersPage, isLoading: ridersLoading } = useAsync(() => deliveryGuyService.list({ perPage: 200 }), [])
  const riders = ridersPage?.data ?? []

  const [selectedRider, setSelectedRider] = useState<DeliveryGuyRow | null>(null)
  const [selectedRouteId, setSelectedRouteId] = useState<string>('')
  const selectedRoute = useMemo(() => demoRoutes.find((r) => r.id === selectedRouteId) ?? null, [selectedRouteId])
  // A stable array reference per route (and a stable EMPTY_WAYPOINTS when none is picked) — the
  // simulation hook resets playback whenever this identity changes, so it must only change when the
  // route selection actually changes, not on every render.
  const waypoints = selectedRoute?.waypoints ?? EMPTY_WAYPOINTS

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
  }, [selectedRider?.id, selectedRouteId])

  const canPlay = !!selectedRider && !!selectedRoute
  const playDisabledReason = !selectedRider && !selectedRoute
    ? 'Pick a delivery partner and a route to start playback.'
    : !selectedRider
      ? 'Pick a delivery partner to start playback.'
      : !selectedRoute
        ? 'Pick a route to start playback.'
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
          {!selectedRoute ? (
            <EmptyState
              icon={<RouteIcon size={22} />}
              title="Pick a route to preview it"
              description="Choose a delivery partner and a demo route on the left to see the live map and play controls."
            />
          ) : (
            <SectionCard title="Live map" icon={Navigation}>
              <RouteSimulatorMap waypoints={waypoints} position={sim.position} />
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
