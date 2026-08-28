import { ExternalLink, MapPinOff } from 'lucide-react'

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

interface MapEmbedProps {
  lat: number | null | undefined
  lng: number | null | undefined
  label?: string
  height?: number
  /** Show the "how to find coordinates" helper note (used on editable forms, not read-only cards). */
  showCoordinatesNote?: boolean
}

// Keyless Google Maps embed — no API key/billing needed, but it means this is a
// static preview, not a live GPS feed. Coordinates are validated up front because
// an out-of-range lat/lng fed straight into the embed can render a blank/white
// iframe with no error, which is confusing without this fallback state.
export function MapEmbed({ lat, lng, label = 'Location preview', height = 220, showCoordinatesNote }: MapEmbedProps) {
  const valid = isValidCoordinate(lat, lng)

  return (
    <div>
      {valid ? (
        <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700" style={{ height }}>
          <iframe
            title={label}
            src={`https://maps.google.com/maps?q=${lat},${lng}&z=15&output=embed`}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            loading="lazy"
          />
        </div>
      ) : (
        <div
          className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-200 bg-slate-50 text-center text-slate-400 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-500"
          style={{ height }}
        >
          <MapPinOff size={22} />
          <p className="text-xs font-medium">No valid coordinates to preview</p>
        </div>
      )}

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs">
        {valid ? (
          <a
            href={`https://maps.google.com/maps?q=${lat},${lng}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 font-medium text-brand-600 hover:underline dark:text-brand-400"
          >
            Open in Google Maps <ExternalLink size={12} />
          </a>
        ) : (
          <span />
        )}
        {showCoordinatesNote && (
          <p className="text-slate-400 dark:text-slate-500">
            Find coordinates at{' '}
            <a
              href="https://www.mapcoordinates.net/en"
              target="_blank"
              rel="noreferrer"
              className="font-medium text-brand-600 hover:underline dark:text-brand-400"
            >
              mapcoordinates.net
            </a>
            . An invalid latitude/longitude can leave the map blank instead of erroring — double-check the values.
          </p>
        )}
      </div>
    </div>
  )
}
