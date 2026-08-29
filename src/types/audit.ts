// Mirrors the admin audit read models exposed by
// pureeats-user-service AdminAuditController (GET /api/v1/admin/*).
import type { Id } from './common'

export type { PageResponse } from '@/lib/pageResponse'

export type SecurityEventType =
  | 'SIGNUP_INITIATED' | 'SIGNUP_SUCCESS' | 'LOGIN_INITIATED' | 'OTP_SENT'
  | 'OTP_VERIFICATION_SUCCESS' | 'OTP_VERIFICATION_FAILED' | 'OTP_RESENT'
  | 'LOGIN_SUCCESS' | 'LOGIN_FAILED' | 'LOGOUT' | 'LOGOUT_ALL'
  | 'ACCOUNT_LOCKED' | 'ACCOUNT_UNLOCKED' | 'ACCOUNT_BLOCKED' | 'ACCOUNT_UNBLOCKED'
  | 'EMAIL_VERIFIED' | 'PHONE_VERIFIED' | 'TOKEN_REFRESHED' | 'TOKEN_REVOKED'
  | 'RATE_LIMIT_EXCEEDED' | 'BLOCKED_REQUEST_REJECTED'

export interface AuditLog {
  id: Id
  eventType: SecurityEventType
  userId: Id | null
  requestId: string | null
  ipAddress: string | null
  deviceId: string | null
  endpoint: string | null
  httpMethod: string | null
  result: 'SUCCESS' | 'FAILURE'
  failureReason: string | null
  metadata: string | null
  createdAt: string
}

export interface LoginHistory {
  id: Id
  userId: Id | null
  loginMethod: 'PASSWORD' | 'EMAIL_OTP' | 'PHONE_OTP'
  status: 'SUCCESS' | 'FAILED'
  ipAddress: string | null
  deviceId: string | null
  userAgent: string | null
  country: string | null
  region: string | null
  city: string | null
  latitude: number | null
  longitude: number | null
  occurredAt: string
  failureReason: string | null
}

export interface OtpChallenge {
  id: Id
  challengeId: string
  userId: Id | null
  authenticationMethod: 'PHONE' | 'EMAIL'
  maskedDestination: string
  purpose: string
  status: 'PENDING' | 'VERIFIED' | 'EXPIRED' | 'LOCKED' | 'CANCELLED'
  expiresAt: string
  attemptCount: number
  maxAttempts: number
  resendCount: number
  maxResendCount: number
  lastSentAt: string
  createdAt: string
  updatedAt: string
  verifiedAt: string | null
  ipAddress: string | null
  deviceId: string | null
  requestId: string | null
}

export interface RateLimitBucket {
  id: Id
  bucketKey: string
  windowStart: string
  hitCount: number
  updatedAt: string
}

export type SecurityBlockType = 'IP' | 'DEVICE' | 'EMAIL' | 'PHONE' | 'USER'

export interface SecurityBlockEntry {
  id: Id
  blockType: SecurityBlockType
  value: string
  reason: string | null
  status: 'ACTIVE' | 'REMOVED'
  createdAt: string
  expiresAt: string | null
  createdBy: string | null
}

export interface UserDevice {
  id: Id
  userId: Id
  deviceId: string
  deviceType: string | null
  browser: string | null
  browserVersion: string | null
  operatingSystem: string | null
  osVersion: string | null
  ipAddress: string | null
  firstSeenAt: string
  lastSeenAt: string
  lastLoginAt: string | null
}

export interface UserSession {
  id: Id
  sessionId: string
  userId: Id
  deviceId: string | null
  createdAt: string
  expiresAt: string
  lastUsedAt: string | null
  revokedAt: string | null
  ipAddress: string | null
  userAgent: string | null
}
