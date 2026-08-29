import type { UserSession } from '@/types/audit'
import { auditableUsers, isoMinutesAgo, sampleDeviceIds, sampleIps, sampleUserAgents } from './shared'

export const userSessions: UserSession[] = Array.from({ length: 30 }, (_, i) => {
  const user = auditableUsers[i % auditableUsers.length]
  const revoked = i % 5 === 0
  const createdAt = isoMinutesAgo(i * 30 + 30)
  return {
    id: i + 1,
    sessionId: `sess-${(200000 + i).toString(16)}`,
    userId: user.id,
    deviceId: sampleDeviceIds[i % sampleDeviceIds.length],
    createdAt,
    expiresAt: isoMinutesAgo(i * 30 + 30 - 60 * 24 * 30),
    lastUsedAt: isoMinutesAgo(i * 5),
    revokedAt: revoked ? isoMinutesAgo(i * 5 + 1) : null,
    ipAddress: sampleIps[i % sampleIps.length],
    userAgent: sampleUserAgents[i % sampleUserAgents.length],
  }
})
