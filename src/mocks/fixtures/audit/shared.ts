import { users } from '../users'

export function isoMinutesAgo(minutes: number): string {
  return new Date(Date.now() - minutes * 60 * 1000).toISOString()
}

export const auditableUsers = users.filter((u) => u.role === 'admin' || u.role === 'employee' || u.role === 'restaurant-owner')

export const sampleIps = ['103.21.244.10', '49.207.55.128', '157.32.19.4', '103.87.169.5', '117.203.11.90']
export const sampleDeviceIds = ['dev-a1b2c3', 'dev-d4e5f6', 'dev-g7h8i9', 'dev-j0k1l2', 'dev-m3n4o5']
export const sampleUserAgents = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/128.0 Safari/537.36',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 Version/17.5 Mobile Safari/604.1',
  'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/126.0 Mobile Safari/537.36',
]
