import { apiClient } from '@/lib/apiClient'
import { mockDelay } from '@/lib/mockUtils'
import { IS_MOCK } from '@/config/env'
import { resolveSettingIcon } from '@/lib/settingsIcons'
import type { SettingFieldDef, SettingFieldType, SettingGroupDef } from '@/config/settingsFieldsConfig'
import {
  CUSTOMER_APP_GROUPS,
  DELIVERY_APP_GROUPS,
  EMAIL_SETTINGS_GROUPS,
  GENERAL_INFO_GROUPS,
  GENERAL_TIMING_GROUP,
  GOOGLE_ANALYTICS_GROUPS,
  GOOGLE_MAP_GROUPS,
  PAYMENT_GATEWAY_CONFIG_GROUPS,
  PUSH_NOTIFICATIONS_GROUPS,
  SMS_CONFIG_GROUPS,
  SOCIAL_LOGIN_GROUPS,
  STORE_DASHBOARD_GROUPS,
  TAX_SETTINGS_GROUPS,
} from '@/config/settingsFieldsConfig'

export interface SettingSection {
  key: string
  title: string
  icon: ReturnType<typeof resolveSettingIcon>
  groups: SettingGroupDef[]
}

/** The wire shape GET /admin/settings/schema actually returns — icon as a plain string (see SettingSchemaService on the backend), everything else identical to SettingFieldDef/SettingGroupDef. */
interface WireField {
  key: string
  label: string
  fieldType: SettingFieldType
  defaultValue: string
  placeholder: string | null
  options: { label: string; value: string }[] | null
  info: string | null
  warning: string | null
  link: { label: string; href: string } | null
  required: boolean
}
interface WireGroup {
  title: string
  description: string | null
  icon: string
  fields: WireField[]
}
interface WireSection {
  key: string
  title: string
  icon: string
  groups: WireGroup[]
}

function mapField(f: WireField): SettingFieldDef {
  return {
    key: f.key,
    label: f.label,
    fieldType: f.fieldType,
    defaultValue: f.defaultValue,
    placeholder: f.placeholder ?? undefined,
    options: f.options ?? undefined,
    info: f.info ?? undefined,
    warning: f.warning ?? undefined,
    link: f.link ?? undefined,
    required: f.required,
  }
}

function mapGroup(g: WireGroup): SettingGroupDef {
  return { title: g.title, description: g.description ?? undefined, icon: resolveSettingIcon(g.icon), fields: g.fields.map(mapField) }
}

// Razorpay, Firebase Cloud Messaging, and the two Google Maps API key fields are deliberately
// excluded from the mock schema too — on the backend they live on AppConfig instead of this
// generic store (see SettingSchemaService's class doc), and the admin panel already surfaces them
// for real via RazorpayConfigPanel/FirebaseConfigPanel/GoogleMapsConfigPanel, each rendered
// directly on its natural tab (Payment Gateways / Push Notifications / Google Map).
const MOCK_SCHEMA: SettingSection[] = [
  { key: 'general', title: 'General', icon: resolveSettingIcon('Settings'), groups: [...GENERAL_INFO_GROUPS, GENERAL_TIMING_GROUP] },
  { key: 'payments', title: 'Payment Gateways', icon: resolveSettingIcon('CreditCard'), groups: PAYMENT_GATEWAY_CONFIG_GROUPS.filter((g) => g.title !== 'Razorpay') },
  { key: 'sms-gateways', title: 'SMS Gateways', icon: resolveSettingIcon('MessageSquare'), groups: SMS_CONFIG_GROUPS },
  { key: 'email-settings', title: 'Email Settings', icon: resolveSettingIcon('Mail'), groups: EMAIL_SETTINGS_GROUPS },
  { key: 'push-notifications', title: 'Push Notifications', icon: resolveSettingIcon('Bell'), groups: PUSH_NOTIFICATIONS_GROUPS.filter((g) => g.title !== 'Firebase Cloud Messaging') },
  { key: 'social-login', title: 'Social Login', icon: resolveSettingIcon('UserCheck'), groups: SOCIAL_LOGIN_GROUPS },
  {
    key: 'google-map',
    title: 'Google Map',
    icon: resolveSettingIcon('MapPin'),
    groups: GOOGLE_MAP_GROUPS.map((g) => ({ ...g, fields: g.fields.filter((f) => !f.key.startsWith('google_map_api_key')) })),
  },
  { key: 'google-analytics', title: 'Google Analytics', icon: resolveSettingIcon('BarChart3'), groups: GOOGLE_ANALYTICS_GROUPS },
  { key: 'tax-settings', title: 'Tax Settings', icon: resolveSettingIcon('Percent'), groups: TAX_SETTINGS_GROUPS },
  { key: 'customer-app', title: 'Customer Application', icon: resolveSettingIcon('Smartphone'), groups: CUSTOMER_APP_GROUPS },
  { key: 'delivery-app', title: 'Delivery Application', icon: resolveSettingIcon('Bike'), groups: DELIVERY_APP_GROUPS },
  { key: 'store-dashboard', title: 'Store Dashboard', icon: resolveSettingIcon('Store'), groups: STORE_DASHBOARD_GROUPS },
]

export const settingsSchemaService = {
  /**
   * Every settings section/group/field the Settings page should render, in the order to render
   * them. Live mode fetches this from the backend (GET /admin/settings/schema) so a field or whole
   * section added there shows up here with no frontend deploy; mock mode falls back to the
   * hand-maintained MOCK_SCHEMA above.
   */
  async getSchema(): Promise<SettingSection[]> {
    if (IS_MOCK) {
      await mockDelay()
      return MOCK_SCHEMA
    }
    const { data } = await apiClient.get<{ data: WireSection[] }>('/admin/settings/schema')
    return data.data.map((s) => ({ key: s.key, title: s.title, icon: resolveSettingIcon(s.icon), groups: s.groups.map(mapGroup) }))
  },
}
