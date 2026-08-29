import type { SecurityBlockEntry, SecurityBlockType } from '@/types/audit'
import { isoMinutesAgo, sampleDeviceIds, sampleIps } from './shared'

const blockTypes: SecurityBlockType[] = ['IP', 'DEVICE', 'EMAIL', 'PHONE', 'USER']
const reasons = ['Repeated OTP failures', 'Suspicious signup velocity', 'Reported by user', 'Manual admin action']

export const securityBlocklist: SecurityBlockEntry[] = Array.from({ length: 20 }, (_, i) => {
  const blockType = blockTypes[i % blockTypes.length]
  const value =
    blockType === 'IP' ? sampleIps[i % sampleIps.length] :
    blockType === 'DEVICE' ? sampleDeviceIds[i % sampleDeviceIds.length] :
    blockType === 'EMAIL' ? `blocked${i}@example.com` :
    blockType === 'PHONE' ? `98${(10000000 + i).toString().slice(-8)}` :
    String(30 + (i % 6))
  const removed = i % 4 === 0
  return {
    id: i + 1,
    blockType,
    value,
    reason: reasons[i % reasons.length],
    status: removed ? 'REMOVED' : 'ACTIVE',
    createdAt: isoMinutesAgo(i * 60 + 60),
    expiresAt: i % 3 === 0 ? null : isoMinutesAgo(-1440),
    createdBy: i % 2 === 0 ? 'system' : 'arpan@pureeats.in',
  }
})
