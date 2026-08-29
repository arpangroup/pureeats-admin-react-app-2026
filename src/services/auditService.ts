import { apiClient } from '@/lib/apiClient'
import { paginate } from '@/lib/mockUtils'
import { toPaginated, type PageResponse } from '@/lib/pageResponse'
import { IS_MOCK } from '@/config/env'
import {
  auditLogs as mockAuditLogs,
  loginHistory as mockLoginHistory,
  otpChallenges as mockOtpChallenges,
  rateLimitBuckets as mockRateLimitBuckets,
  securityBlocklist as mockSecurityBlocklist,
  userDevices as mockUserDevices,
  userSessions as mockUserSessions,
} from '@/mocks/fixtures/audit'
import type { Paginated } from '@/types/common'
import type {
  AuditLog,
  LoginHistory,
  OtpChallenge,
  RateLimitBucket,
  SecurityBlockEntry,
  SecurityBlockType,
  UserDevice,
  UserSession,
} from '@/types/audit'

interface AuditListParams {
  page?: number
  perPage?: number
}

async function fetchAdminPage<T extends { id: number }>(path: string, params: Record<string, unknown>): Promise<Paginated<T>> {
  const { data } = await apiClient.get<{ data: PageResponse<T> }>(path, { params })
  return toPaginated(data.data)
}

export const auditLogService = {
  list(params: AuditListParams & { userId?: number }): Promise<Paginated<AuditLog>> {
    if (IS_MOCK) {
      return Promise.resolve(paginate(mockAuditLogs, { page: params.page, perPage: params.perPage, filters: { userId: params.userId } }))
    }
    return fetchAdminPage('/admin/audit-logs', { userId: params.userId, page: (params.page ?? 1) - 1, size: params.perPage ?? 10 })
  },
}

export const loginHistoryService = {
  list(params: AuditListParams & { userId?: number }): Promise<Paginated<LoginHistory>> {
    if (IS_MOCK) {
      return Promise.resolve(paginate(mockLoginHistory, { page: params.page, perPage: params.perPage, filters: { userId: params.userId } }))
    }
    return fetchAdminPage('/admin/login-history', { userId: params.userId, page: (params.page ?? 1) - 1, size: params.perPage ?? 10 })
  },
}

export const otpChallengeService = {
  list(params: AuditListParams & { userId?: number }): Promise<Paginated<OtpChallenge>> {
    if (IS_MOCK) {
      return Promise.resolve(paginate(mockOtpChallenges, { page: params.page, perPage: params.perPage, filters: { userId: params.userId } }))
    }
    return fetchAdminPage('/admin/otp-challenges', { userId: params.userId, page: (params.page ?? 1) - 1, size: params.perPage ?? 10 })
  },
}

export const rateLimitBucketService = {
  list(params: AuditListParams): Promise<Paginated<RateLimitBucket>> {
    if (IS_MOCK) {
      return Promise.resolve(paginate(mockRateLimitBuckets, { page: params.page, perPage: params.perPage }))
    }
    return fetchAdminPage('/admin/rate-limit-buckets', { page: (params.page ?? 1) - 1, size: params.perPage ?? 10 })
  },
}

export const securityBlockEntryService = {
  list(params: AuditListParams & { blockType?: SecurityBlockType }): Promise<Paginated<SecurityBlockEntry>> {
    if (IS_MOCK) {
      return Promise.resolve(paginate(mockSecurityBlocklist, { page: params.page, perPage: params.perPage, filters: { blockType: params.blockType } }))
    }
    return fetchAdminPage('/admin/security-blocklist', { blockType: params.blockType, page: (params.page ?? 1) - 1, size: params.perPage ?? 10 })
  },
}

export const userDeviceService = {
  list(params: AuditListParams & { userId?: number }): Promise<Paginated<UserDevice>> {
    if (IS_MOCK) {
      return Promise.resolve(paginate(mockUserDevices, { page: params.page, perPage: params.perPage, filters: { userId: params.userId } }))
    }
    return fetchAdminPage('/admin/user-devices', { userId: params.userId, page: (params.page ?? 1) - 1, size: params.perPage ?? 10 })
  },
}

export const userSessionService = {
  list(params: AuditListParams & { userId?: number }): Promise<Paginated<UserSession>> {
    if (IS_MOCK) {
      return Promise.resolve(paginate(mockUserSessions, { page: params.page, perPage: params.perPage, filters: { userId: params.userId } }))
    }
    return fetchAdminPage('/admin/user-sessions', { userId: params.userId, page: (params.page ?? 1) - 1, size: params.perPage ?? 10 })
  },
}
