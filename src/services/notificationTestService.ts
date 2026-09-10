import { apiClient } from '@/lib/apiClient'
import { mockDelay } from '@/lib/mockUtils'
import { IS_MOCK } from '@/config/env'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * One-off "does this actually work" sends triggered from the admin panel's Settings page — a test
 * email (Email Settings tab) and a test push notification (Push Notifications tab), each hitting
 * the real provider/FCM path rather than a template, so a working send here means the real thing
 * will work too. See AdminNotificationTestController on the backend.
 */
export const notificationTestService = {
  async sendTestEmail(to: string): Promise<void> {
    if (IS_MOCK) {
      await mockDelay()
      if (!EMAIL_PATTERN.test(to)) throw { message: 'Enter a valid email address' }
      return
    }
    await apiClient.post('/admin/notifications/test/email', { to })
  },

  async sendTestPush(userId: number, title?: string, body?: string): Promise<void> {
    if (IS_MOCK) {
      await mockDelay()
      if (!userId || userId <= 0) throw { message: 'Enter a user ID to target' }
      return
    }
    await apiClient.post('/admin/notifications/test/push', { userId, title, body })
  },
}
