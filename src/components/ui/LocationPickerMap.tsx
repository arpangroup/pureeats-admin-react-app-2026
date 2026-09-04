import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import markerIconUrl from 'leaflet/dist/images/marker-icon.png'
import markerIcon2xUrl from 'leaflet/dist/images/marker-icon-2x.png'
import markerShadowUrl from 'leaflet/dist/images/marker-shadow.png'

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

function isValidCoordinate(lat: number | null | undefined, lng: number | null | undefined): lat is number {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180 &&
    !(lat === 0 && lng === 0)
  )
}

interface LocationPickerMapProps {
  lat: number | null | undefined
  lng: number | null | undefined
  onChange: (lat: number, lng: number) => void
  height?: number
}

/** Interactive OpenStreetMap picker — click anywhere or drag the pin to set lat/lng; typing in the coordinate fields moves the pin back. */
export function LocationPickerMap({ lat, lng, onChange, height = 260 }: LocationPickerMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markerRef = useRef<L.Marker | null>(null)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    const hasInitial = isValidCoordinate(lat, lng)
    const initialCenter: [number, number] = hasInitial ? [lat, lng] : DEFAULT_CENTER

    const map = L.map(containerRef.current).setView(initialCenter, hasInitial ? 15 : 12)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors',
    }).addTo(map)

    const marker = L.marker(initialCenter, { icon: markerIcon, draggable: true }).addTo(map)
    marker.on('dragend', () => {
      const pos = marker.getLatLng()
      onChangeRef.current(Number(pos.lat.toFixed(6)), Number(pos.lng.toFixed(6)))
    })
    map.on('click', (e: L.LeafletMouseEvent) => {
      marker.setLatLng(e.latlng)
      onChangeRef.current(Number(e.latlng.lat.toFixed(6)), Number(e.latlng.lng.toFixed(6)))
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
    if (!map || !marker || !isValidCoordinate(lat, lng)) return
    const current = marker.getLatLng()
    if (Math.abs(current.lat - lat) > 1e-9 || Math.abs(current.lng - lng) > 1e-9) {
      marker.setLatLng([lat, lng])
      map.setView([lat, lng], Math.max(map.getZoom(), 15))
    }
  }, [lat, lng])

  return (
    <div>
      <div ref={containerRef} className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700" style={{ height }} />
      <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
        Click anywhere on the map, or drag the pin, to set the restaurant's exact location — the latitude/longitude fields below update automatically.
      </p>
    </div>
  )
}
