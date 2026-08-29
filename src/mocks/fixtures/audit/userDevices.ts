import type { UserDevice } from '@/types/audit'
import { auditableUsers, isoMinutesAgo, sampleIps } from './shared'

const browsers: [string, string][] = [['Chrome', '128.0'], ['Safari', '17.5'], ['Edge', '126.0'], ['Firefox', '129.0']]
const platforms: [string, string][] = [['Windows', '11'], ['macOS', '14.5'], ['Android', '14'], ['iOS', '17.5']]
const deviceTypes = ['DESKTOP', 'MOBILE', 'MOBILE', 'DESKTOP']

export const userDevices: UserDevice[] = Array.from({ length: 30 }, (_, i) => {
  const user = auditableUsers[i % auditableUsers.length]
  const [browser, browserVersion] = browsers[i % browsers.length]
  const [os, osVersion] = platforms[i % platforms.length]
  return {
    id: i + 1,
    userId: user.id,
    deviceId: `dev-${(100000 + i).toString(16)}`,
    deviceType: deviceTypes[i % deviceTypes.length],
    browser,
    browserVersion,
    operatingSystem: os,
    osVersion,
    ipAddress: sampleIps[i % sampleIps.length],
    firstSeenAt: isoMinutesAgo(i * 200 + 200),
    lastSeenAt: isoMinutesAgo(i * 3),
    lastLoginAt: isoMinutesAgo(i * 40),
  }
})
