import type { RateLimitBucket } from '@/types/audit'
import { isoMinutesAgo, sampleIps } from './shared'

const bucketPrefixes = ['login-ip', 'login-destination', 'verify-ip', 'resend-ip']

export const rateLimitBuckets: RateLimitBucket[] = Array.from({ length: 25 }, (_, i) => ({
  id: i + 1,
  bucketKey: `${bucketPrefixes[i % bucketPrefixes.length]}:${sampleIps[i % sampleIps.length]}`,
  windowStart: isoMinutesAgo(i * 5 + 5),
  hitCount: (i % 8) + 1,
  updatedAt: isoMinutesAgo(i * 5),
}))
