import { Badge } from '@/components/ui/Feedback'
import { timeAgo } from '@/lib/format'
import type { DeliveryGuyDetail } from '@/types/entities'

/**
 * Online / Offline / Forced stop for a delivery partner. "Forced stop" = the backend's inactivity
 * scheduler took the driver offline because their app stopped reporting location for longer than
 * Settings -> Delivery Application -> Inactivity auto-offline -> timeout.
 */
export function DriverStatusBadge({ driver, showTime = false }: { driver: Pick<DeliveryGuyDetail, 'isOnline' | 'offlineReason' | 'statusChangedAt'>; showTime?: boolean }) {
  const since = showTime && driver.statusChangedAt ? ` · ${timeAgo(driver.statusChangedAt)}` : ''
  if (driver.isOnline) return <Badge tone="green">Online{since}</Badge>
  if (driver.offlineReason === 'INACTIVITY') return <Badge tone="amber">Forced stop{since}</Badge>
  if (driver.offlineReason === 'ADMIN') return <Badge tone="slate">Offline (admin){since}</Badge>
  return <Badge tone="slate">Offline{since}</Badge>
}

export function driverStatusExplanation(driver: Pick<DeliveryGuyDetail, 'isOnline' | 'offlineReason'>): string | null {
  if (driver.isOnline) return null
  if (driver.offlineReason === 'INACTIVITY') return 'Forced stop - automatically set offline after the driver app stopped reporting location (inactivity timeout).'
  if (driver.offlineReason === 'ADMIN') return 'Set offline by an admin.'
  if (driver.offlineReason === 'SELF') return 'Went offline from the driver app.'
  return null
}
