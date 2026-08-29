import type { OtpChallenge } from '@/types/audit'
import { auditableUsers, isoMinutesAgo, sampleDeviceIds, sampleIps } from './shared'

const statuses: OtpChallenge['status'][] = ['VERIFIED', 'VERIFIED', 'PENDING', 'EXPIRED', 'LOCKED', 'CANCELLED']

export const otpChallenges: OtpChallenge[] = Array.from({ length: 35 }, (_, i) => {
  const user = auditableUsers[i % auditableUsers.length]
  const status = statuses[i % statuses.length]
  const method = i % 2 === 0 ? 'EMAIL' : 'PHONE'
  const createdAt = isoMinutesAgo(i * 19 + 20)
  return {
    id: i + 1,
    challengeId: `mock-challenge-${900000 + i}`,
    userId: user.id,
    authenticationMethod: method,
    maskedDestination: method === 'EMAIL' ? `${user.email.slice(0, 2)}***@${user.email.split('@')[1]}` : `******${user.phone.slice(-4)}`,
    purpose: 'LOGIN',
    status,
    expiresAt: isoMinutesAgo(i * 19 + 10),
    attemptCount: status === 'LOCKED' ? 5 : i % 3,
    maxAttempts: 5,
    resendCount: i % 2,
    maxResendCount: 3,
    lastSentAt: createdAt,
    createdAt,
    updatedAt: isoMinutesAgo(i * 19),
    verifiedAt: status === 'VERIFIED' ? isoMinutesAgo(i * 19) : null,
    ipAddress: sampleIps[i % sampleIps.length],
    deviceId: sampleDeviceIds[i % sampleDeviceIds.length],
    requestId: `req-${1000 + i}`,
  }
})
