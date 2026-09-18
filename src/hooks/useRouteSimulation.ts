import { useEffect, useMemo, useRef, useState } from 'react'

export interface LatLng {
  lat: number
  lng: number
}

interface UseRouteSimulationOptions {
  /** Wall-clock time (ms) to traverse the whole route at 1x speed, regardless of the route's real-world length — a fixed "demo" pace rather than a simulated real speed. Default 20s. */
  durationMs?: number
  /** Called with the live position while playing, throttled to at most once per `tickIntervalMs` (not every animation frame) — this is the hook's hand-off point for something that shouldn't be spammed, like a backend location push. Always fires once more on the final frame so the route's last point is reported even if it lands mid-throttle-window. */
  onTick?: (position: LatLng, progress: number) => void
  /** Minimum ms between onTick calls. Default 1000 (~once/second). */
  tickIntervalMs?: number
}

interface Segment {
  from: LatLng
  to: LatLng
  length: number
  cumulativeStart: number
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180
}

/** Great-circle distance in km — used to weight each leg of the route so the marker moves at a roughly constant speed instead of spending equal time on a short leg and a long one. */
function haversineKm(a: LatLng, b: LatLng): number {
  const R = 6371
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))
}

function lerp(a: LatLng, b: LatLng, t: number): LatLng {
  return { lat: a.lat + (b.lat - a.lat) * t, lng: a.lng + (b.lng - a.lng) * t }
}

/**
 * Plays a marker along an ordered list of waypoints over time — the same "lerp between points as
 * time elapses" idea as the customer app's orderTrackingProgress.ts, generalized from a fixed A→B
 * pair to an arbitrary N-waypoint polyline, and driven by requestAnimationFrame instead of a coarse
 * setInterval so it can report progress smoothly.
 *
 * Distance-weighted: `progress` (0-1) maps to a point along total route *distance*, not waypoint
 * *index*, so a long leg takes proportionally longer to cross than a short one — a naive per-segment
 * lerp (1/N of progress per waypoint) would make the marker visibly speed up and slow down across
 * legs of different length.
 *
 * `waypoints` should be a referentially-stable array (e.g. memoized by the caller on the selected
 * route's id) — a new array identity resets playback to the start, same as picking a different route.
 */
export function useRouteSimulation(waypoints: LatLng[], options: UseRouteSimulationOptions = {}) {
  const { durationMs = 20000, onTick, tickIntervalMs = 1000 } = options

  const [progress, setProgress] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeedState] = useState(1)

  const progressRef = useRef(0)
  const speedRef = useRef(speed)
  speedRef.current = speed
  const onTickRef = useRef(onTick)
  onTickRef.current = onTick
  const tickIntervalMsRef = useRef(tickIntervalMs)
  tickIntervalMsRef.current = tickIntervalMs
  const durationMsRef = useRef(durationMs)
  durationMsRef.current = durationMs

  const rafRef = useRef<number | null>(null)
  const lastFrameTimeRef = useRef<number | null>(null)
  const lastTickTimeRef = useRef<number>(0)

  const { segments, totalDistanceKm } = useMemo(() => {
    if (waypoints.length < 2) return { segments: [] as Segment[], totalDistanceKm: 0 }
    const built: Segment[] = []
    let cumulative = 0
    for (let i = 0; i < waypoints.length - 1; i++) {
      const length = haversineKm(waypoints[i], waypoints[i + 1])
      built.push({ from: waypoints[i], to: waypoints[i + 1], length, cumulativeStart: cumulative })
      cumulative += length
    }
    return { segments: built, totalDistanceKm: cumulative }
  }, [waypoints])

  function positionAtProgress(p: number): LatLng {
    if (waypoints.length === 0) return { lat: 0, lng: 0 }
    if (segments.length === 0 || totalDistanceKm === 0) return waypoints[0]
    const targetDistance = p * totalDistanceKm
    const segment = segments.find((s) => targetDistance <= s.cumulativeStart + s.length) ?? segments[segments.length - 1]
    const segmentProgress = segment.length === 0 ? 1 : Math.min(1, Math.max(0, (targetDistance - segment.cumulativeStart) / segment.length))
    return lerp(segment.from, segment.to, segmentProgress)
  }

  // positionAtProgress is a plain function of (segments, totalDistanceKm, waypoints) recreated each
  // render — those are already the memo's real dependencies, so it's intentionally left out here.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const position = useMemo(() => positionAtProgress(progress), [progress, segments, totalDistanceKm, waypoints])

  // A new route (different waypoints array) always restarts from the beginning, paused.
  useEffect(() => {
    progressRef.current = 0
    lastFrameTimeRef.current = null
    setProgress(0)
    setIsPlaying(false)
  }, [waypoints])

  useEffect(() => {
    if (!isPlaying) {
      lastFrameTimeRef.current = null
      return
    }

    function frame(time: number) {
      if (lastFrameTimeRef.current == null) lastFrameTimeRef.current = time
      const dt = time - lastFrameTimeRef.current
      lastFrameTimeRef.current = time

      let next = progressRef.current + (dt * speedRef.current) / durationMsRef.current
      const finished = next >= 1
      if (finished) next = 1
      progressRef.current = next
      setProgress(next)

      // Fire onTick at most once per tickIntervalMs — a route simulation ticks the backend roughly
      // once a second, not every animation frame — but always fire on the very last frame so the
      // route's true final point gets reported even if it lands mid-throttle-window.
      if (onTickRef.current && (finished || time - lastTickTimeRef.current >= tickIntervalMsRef.current)) {
        lastTickTimeRef.current = time
        onTickRef.current(positionAtProgress(next), next)
      }

      if (finished) {
        setIsPlaying(false)
        return
      }
      rafRef.current = requestAnimationFrame(frame)
    }

    rafRef.current = requestAnimationFrame(frame)
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying])

  function play() {
    if (waypoints.length < 2) return
    if (progressRef.current >= 1) {
      progressRef.current = 0
      setProgress(0)
    }
    lastFrameTimeRef.current = null
    setIsPlaying(true)
  }

  function pause() {
    setIsPlaying(false)
  }

  function reset() {
    setIsPlaying(false)
    progressRef.current = 0
    lastFrameTimeRef.current = null
    setProgress(0)
  }

  function setSpeed(multiplier: number) {
    setSpeedState(multiplier)
  }

  return {
    position,
    progress,
    isPlaying,
    play,
    pause,
    reset,
    speed,
    setSpeed,
    totalDistanceKm,
    distanceCoveredKm: progress * totalDistanceKm,
  }
}
