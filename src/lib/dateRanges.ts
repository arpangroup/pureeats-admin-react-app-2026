export type DateRangePreset = 'this-week' | 'last-7-days' | 'this-month' | 'last-30-days' | 'last-60-days' | 'all-time' | 'custom'

export interface DateRange {
  /** Inclusive lower bound, yyyy-mm-dd — null means no lower bound ("All time"). */
  from: string | null
  /** Inclusive upper bound, yyyy-mm-dd. */
  to: string
}

export const DATE_RANGE_PRESETS: { key: DateRangePreset; label: string }[] = [
  { key: 'this-week', label: 'This Week' },
  { key: 'last-7-days', label: 'Last 7 Days' },
  { key: 'this-month', label: 'This Month' },
  { key: 'last-30-days', label: 'Last 30 Days' },
  { key: 'last-60-days', label: 'Last 60 Days' },
  { key: 'all-time', label: 'All Time' },
  { key: 'custom', label: 'Custom Range' },
]

function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function daysAgo(n: number): Date {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d
}

/** Resolves a preset to a concrete { from, to } range. For 'custom', pass the user's own picked dates through. */
export function resolveDateRange(preset: DateRangePreset, custom?: { from: string; to: string }): DateRange {
  const today = toIsoDate(new Date())

  switch (preset) {
    case 'this-week': {
      const now = new Date()
      const dayIndex = (now.getDay() + 6) % 7 // Monday = 0
      return { from: toIsoDate(daysAgo(dayIndex)), to: today }
    }
    case 'last-7-days':
      return { from: toIsoDate(daysAgo(6)), to: today }
    case 'this-month': {
      const now = new Date()
      return { from: toIsoDate(new Date(now.getFullYear(), now.getMonth(), 1)), to: today }
    }
    case 'last-30-days':
      return { from: toIsoDate(daysAgo(29)), to: today }
    case 'last-60-days':
      return { from: toIsoDate(daysAgo(59)), to: today }
    case 'all-time':
      return { from: null, to: today }
    case 'custom':
      return { from: custom?.from || toIsoDate(daysAgo(29)), to: custom?.to || today }
    default:
      return { from: toIsoDate(daysAgo(29)), to: today }
  }
}
