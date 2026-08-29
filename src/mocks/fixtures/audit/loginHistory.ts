import type { LoginHistory } from '@/types/audit'
import { auditableUsers, isoMinutesAgo, sampleDeviceIds, sampleIps, sampleUserAgents } from './shared'

const cities: [string, string, string][] = [
  ['India', 'Karnataka', 'Bengaluru'],
  ['India', 'Maharashtra', 'Mumbai'],
  ['India', 'Delhi', 'New Delhi'],
  ['India', 'Tamil Nadu', 'Chennai'],
]

export const loginHistory: LoginHistory[] = Array.from({ length: 40 }, (_, i) => {
  const user = auditableUsers[i % auditableUsers.length]
  const [country, region, city] = cities[i % cities.length]
  const failed = i % 6 === 0
  return {
    id: i + 1,
    userId: user.id,
    loginMethod: i % 3 === 0 ? 'EMAIL_OTP' : i % 3 === 1 ? 'PHONE_OTP' : 'EMAIL_OTP',
    status: failed ? 'FAILED' : 'SUCCESS',
    ipAddress: sampleIps[i % sampleIps.length],
    deviceId: sampleDeviceIds[i % sampleDeviceIds.length],
    userAgent: sampleUserAgents[i % sampleUserAgents.length],
    country,
    region,
    city,
    latitude: 12.9 + (i % 5) * 0.01,
    longitude: 77.5 + (i % 5) * 0.01,
    occurredAt: isoMinutesAgo(i * 23),
    failureReason: failed ? 'OTP attempts exceeded' : null,
  }
})
