import type { AuditLog, SecurityEventType } from '@/types/audit'
import { auditableUsers, isoMinutesAgo, sampleDeviceIds, sampleIps } from './shared'

const eventCycle: SecurityEventType[] = [
  'LOGIN_INITIATED', 'OTP_SENT', 'OTP_VERIFICATION_SUCCESS', 'LOGIN_SUCCESS',
  'OTP_VERIFICATION_FAILED', 'LOGIN_FAILED', 'TOKEN_REFRESHED', 'LOGOUT',
  'RATE_LIMIT_EXCEEDED', 'ACCOUNT_LOCKED', 'ACCOUNT_UNLOCKED', 'BLOCKED_REQUEST_REJECTED',
]

export const auditLogs: AuditLog[] = Array.from({ length: 45 }, (_, i) => {
  const user = auditableUsers[i % auditableUsers.length]
  const eventType = eventCycle[i % eventCycle.length]
  const isFailure = eventType.includes('FAILED') || eventType === 'RATE_LIMIT_EXCEEDED' || eventType === 'BLOCKED_REQUEST_REJECTED'
  return {
    id: i + 1,
    eventType,
    userId: user.id,
    requestId: `req-${1000 + i}`,
    ipAddress: sampleIps[i % sampleIps.length],
    deviceId: sampleDeviceIds[i % sampleDeviceIds.length],
    endpoint: eventType.startsWith('LOGIN') || eventType.startsWith('OTP') ? '/api/v1/auth/otp/verify' : '/api/v1/auth/refresh',
    httpMethod: 'POST',
    result: isFailure ? 'FAILURE' : 'SUCCESS',
    failureReason: isFailure ? 'Invalid or expired OTP' : null,
    metadata: `attempt=${(i % 3) + 1}`,
    createdAt: isoMinutesAgo(i * 17),
  }
})
