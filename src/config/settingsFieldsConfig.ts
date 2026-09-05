import {
  BarChart3,
  Bell,
  Bike,
  Code2,
  CreditCard,
  KeyRound,
  Mail,
  MapPin,
  MessageSquare,
  Monitor,
  Sparkles,
  Timer,
  UserCheck,
  Wallet,
  type LucideIcon,
} from 'lucide-react'

/**
 * Declarative definitions for the settings tabs that don't have a real backend endpoint yet
 * (see SettingsPage). Each field only knows its own shape (label/type/options/help copy) —
 * DynamicSettingsForm turns that into UI, and SettingsPage owns the actual values in local
 * state since there's nothing to persist them to.
 */
export type SettingFieldType = 'text' | 'password' | 'number' | 'email' | 'url' | 'textarea' | 'boolean' | 'dropdown' | 'radio'

export interface SettingOption {
  label: string
  value: string
}

export interface SettingFieldDef {
  key: string
  label: string
  fieldType: SettingFieldType
  defaultValue: string
  placeholder?: string
  options?: SettingOption[]
  /** Short note rendered below the field, for context that doesn't fit the label. */
  info?: string
  /** Rendered below the field in amber, for anything risky (secrets, irreversible effects). */
  warning?: string
  link?: { label: string; href: string }
  required?: boolean
}

export interface SettingGroupDef {
  title: string
  description?: string
  icon?: LucideIcon
  fields: SettingFieldDef[]
}

export const GENERAL_TIMING_GROUP: SettingGroupDef = {
  title: 'Order timing',
  description: 'How long a restaurant or delivery partner has to respond before an order times out.',
  icon: Timer,
  fields: [
    {
      key: 'max_time_accept_order',
      label: 'Max time to accept order',
      fieldType: 'number',
      defaultValue: '10',
      placeholder: 'e.g. 10',
      info: 'Minutes a restaurant has to accept a new order before it is auto-cancelled.',
    },
    {
      key: 'max_time_accept_delivery',
      label: 'Max time to accept delivery',
      fieldType: 'number',
      defaultValue: '5',
      placeholder: 'e.g. 5',
      info: "Minutes a delivery partner has to accept an assigned order before it's reassigned.",
    },
  ],
}

export const CUSTOMER_APP_GROUPS: SettingGroupDef[] = [
  {
    title: 'Address & checkout',
    icon: MapPin,
    fields: [
      {
        key: 'flat_mandatory',
        label: 'Flat/Apartment mandatory in address',
        fieldType: 'boolean',
        defaultValue: 'false',
        info: 'Requires the flat/apartment/house number field before an address can be saved.',
      },
      {
        key: 'delivery_pin',
        label: 'Delivery PIN',
        fieldType: 'boolean',
        defaultValue: 'false',
        info: 'Customer gets a 4-digit PIN they share with the delivery partner to confirm handover.',
      },
      {
        key: 'self_pickup',
        label: 'Self pickup',
        fieldType: 'boolean',
        defaultValue: 'true',
        info: 'Lets customers choose to collect their order from the restaurant instead of delivery.',
      },
      {
        key: 'default_country_code',
        label: 'Default country code on phone field',
        fieldType: 'text',
        defaultValue: '+91',
        placeholder: '+91',
      },
    ],
  },
  {
    title: 'Browsing & merchandising',
    icon: Sparkles,
    fields: [
      {
        key: 'promo_slider',
        label: 'Promo slider',
        fieldType: 'boolean',
        defaultValue: 'true',
        info: 'Shows the rotating promotional banner carousel on the home screen.',
      },
      { key: 'recommended_item_slider', label: 'Recommended item slider', fieldType: 'boolean', defaultValue: 'true' },
      { key: 'veg_nonveg_badge', label: 'Veg/Non-veg badge', fieldType: 'boolean', defaultValue: 'true' },
      { key: 'show_discount_percentage', label: 'Show product discount percentage', fieldType: 'boolean', defaultValue: 'true' },
      {
        key: 'hide_zero_price',
        label: 'Hide item price when zero',
        fieldType: 'boolean',
        defaultValue: 'false',
        info: 'Useful for items priced only through variants or add-ons.',
      },
    ],
  },
  {
    title: 'Display',
    icon: Monitor,
    fields: [
      {
        key: 'beautify_datetime',
        label: 'Beautify date/time',
        fieldType: 'boolean',
        defaultValue: 'true',
        info: 'Shows friendly relative timestamps ("2 hours ago") instead of raw dates.',
      },
      {
        key: 'round_up_delivery_charge',
        label: 'Round up dynamic delivery charge',
        fieldType: 'boolean',
        defaultValue: 'false',
        info: 'Rounds the calculated delivery fee up to the nearest whole currency unit.',
      },
    ],
  },
]

export const DELIVERY_APP_GROUPS: SettingGroupDef[] = [
  {
    title: 'Earnings',
    icon: Wallet,
    fields: [
      {
        key: 'enable_delivery_earnings',
        label: "Enable delivery guy's earnings",
        fieldType: 'boolean',
        defaultValue: 'true',
        info: 'Shows an earnings summary inside the delivery partner app.',
      },
      {
        key: 'delivery_earning_from',
        label: "Delivery guy's earning from",
        fieldType: 'dropdown',
        defaultValue: 'delivery_charge',
        options: [
          { label: 'Delivery charge', value: 'delivery_charge' },
          { label: 'Fixed amount per order', value: 'fixed_amount' },
          { label: 'Percentage of order total', value: 'percentage_of_order' },
        ],
        info: "Determines how a delivery partner's per-order earning is calculated.",
      },
    ],
  },
  {
    title: 'Order list',
    icon: Bike,
    fields: [
      {
        key: 'show_full_address_order_list',
        label: 'Show full address on order list',
        fieldType: 'boolean',
        defaultValue: 'false',
        info: 'When off, the delivery app shows only the area/locality until the order is accepted.',
      },
    ],
  },
]

export const STORE_DASHBOARD_GROUPS: SettingGroupDef[] = [
  {
    title: 'Order notifications',
    icon: Bell,
    fields: [
      {
        key: 'new_order_fetch_rate',
        label: 'New order fetch rate',
        fieldType: 'dropdown',
        defaultValue: '15',
        options: [
          { label: 'Every 5 seconds', value: '5' },
          { label: 'Every 15 seconds', value: '15' },
          { label: 'Every 25 seconds', value: '25' },
          { label: 'Every 30 seconds', value: '30' },
        ],
        info: 'How often the store dashboard polls for new orders.',
      },
      {
        key: 'notification_tone',
        label: 'Notification tone',
        fieldType: 'radio',
        defaultValue: 'alert-1',
        options: [
          { label: 'Alert 1', value: 'alert-1' },
          { label: 'Alert 2', value: 'alert-2' },
          { label: 'Alert 3', value: 'alert-3' },
        ],
        info: 'Sound played on the store dashboard when a new order arrives.',
      },
    ],
  },
]

export const PUSH_NOTIFICATIONS_GROUPS: SettingGroupDef[] = [
  {
    title: 'Push notifications',
    icon: Bell,
    fields: [
      { key: 'enable_push_notifications', label: 'Enable push notifications', fieldType: 'boolean', defaultValue: 'true' },
      {
        key: 'push_notifications_order_updates',
        label: 'Push notifications for order updates',
        fieldType: 'boolean',
        defaultValue: 'true',
      },
    ],
  },
  {
    title: 'Firebase Cloud Messaging',
    description: 'Credentials from the Firebase console deliver push notifications to the customer, store and delivery apps.',
    icon: KeyRound,
    fields: [
      { key: 'firebase_sender_id', label: 'Firebase sender ID', fieldType: 'text', defaultValue: '', placeholder: 'e.g. 1234567890' },
      {
        key: 'firebase_web_push_certificate',
        label: 'Firebase web push certificate',
        fieldType: 'password',
        defaultValue: '',
        placeholder: 'BIms… (VAPID key pair)',
        info: 'Also called the VAPID key — found under Project settings → Cloud Messaging → Web configuration.',
      },
      {
        key: 'firebase_server_key',
        label: 'Firebase server key',
        fieldType: 'password',
        defaultValue: '',
        warning: 'Keep this secret — it authorizes sending notifications to every device on your project.',
        link: { label: 'Open Firebase console', href: 'https://console.firebase.google.com' },
      },
    ],
  },
]

export const SOCIAL_LOGIN_GROUPS: SettingGroupDef[] = [
  {
    title: 'Facebook login',
    icon: UserCheck,
    fields: [
      { key: 'enable_facebook_login', label: 'Enable Facebook login', fieldType: 'boolean', defaultValue: 'false' },
      {
        key: 'facebook_app_id',
        label: 'Facebook app ID',
        fieldType: 'text',
        defaultValue: '',
        placeholder: 'e.g. 1234567890123456',
        link: { label: 'Facebook for Developers', href: 'https://developers.facebook.com/apps' },
      },
      {
        key: 'facebook_login_button_text',
        label: 'Facebook login button text',
        fieldType: 'text',
        defaultValue: 'Continue with Facebook',
        placeholder: 'Continue with Facebook',
      },
    ],
  },
  {
    title: 'Google login',
    icon: UserCheck,
    fields: [
      { key: 'enable_google_login', label: 'Enable Google login', fieldType: 'boolean', defaultValue: 'true' },
      {
        key: 'google_app_id',
        label: 'Google app ID',
        fieldType: 'text',
        defaultValue: '',
        placeholder: 'e.g. xxxx.apps.googleusercontent.com',
        link: { label: 'Google Cloud console credentials', href: 'https://console.cloud.google.com/apis/credentials' },
      },
      {
        key: 'google_login_button_text',
        label: 'Google login button text',
        fieldType: 'text',
        defaultValue: 'Continue with Google',
        placeholder: 'Continue with Google',
      },
    ],
  },
]

export const GOOGLE_MAP_GROUPS: SettingGroupDef[] = [
  {
    title: 'Google Maps',
    icon: MapPin,
    fields: [
      { key: 'show_map_order_tracking', label: 'Show map on order tracking page', fieldType: 'boolean', defaultValue: 'true' },
      {
        key: 'google_map_api_key_http',
        label: 'Google Map API key (with HTTP restriction)',
        fieldType: 'password',
        defaultValue: '',
        placeholder: 'AIza…',
        info: "Used by the web-based admin, customer and store apps. Restrict this key to your site's domains.",
      },
      {
        key: 'google_map_api_key_ip',
        label: 'Google Map API key (with IP restriction)',
        fieldType: 'password',
        defaultValue: '',
        placeholder: 'AIza…',
        info: "Used by server-side geocoding and distance calls. Restrict this key to your server's IP address.",
        warning: 'Never reuse the same unrestricted key for both server and client calls.',
        link: { label: 'Manage API keys', href: 'https://console.cloud.google.com/google/maps-apis/credentials' },
      },
    ],
  },
]

export const GOOGLE_ANALYTICS_GROUPS: SettingGroupDef[] = [
  {
    title: 'Google Analytics',
    icon: BarChart3,
    fields: [
      { key: 'enable_google_analytics', label: 'Enable Google Analytics', fieldType: 'boolean', defaultValue: 'false' },
      {
        key: 'analytics_ua_id',
        label: 'Analytics UA ID',
        fieldType: 'text',
        defaultValue: '',
        placeholder: 'e.g. G-XXXXXXXXXX or UA-XXXXXXXXX-X',
        info: 'Accepts either a legacy Universal Analytics ID or a GA4 measurement ID.',
      },
    ],
  },
]

export const EMAIL_SETTINGS_GROUPS: SettingGroupDef[] = [
  {
    title: 'Email delivery',
    description: 'Transactional emails are sent through SendGrid.',
    icon: Mail,
    fields: [
      { key: 'enable_password_reset_email', label: 'Enable password reset email', fieldType: 'boolean', defaultValue: 'true' },
      {
        key: 'sendgrid_api_key',
        label: 'API key (SendGrid)',
        fieldType: 'password',
        defaultValue: '',
        placeholder: 'SG.xxxxxxxx',
        link: { label: 'SendGrid API keys', href: 'https://app.sendgrid.com/settings/api_keys' },
      },
      {
        key: 'send_emails_from_email',
        label: 'Send emails from "Email"',
        fieldType: 'email',
        defaultValue: '',
        placeholder: 'no-reply@yourdomain.com',
      },
      { key: 'send_emails_from_name', label: 'Send emails from "Name"', fieldType: 'text', defaultValue: '', placeholder: 'PureEats' },
      {
        key: 'password_reset_email_subject',
        label: 'Password reset email "Subject"',
        fieldType: 'text',
        defaultValue: 'Reset your password',
        placeholder: 'Reset your password',
      },
    ],
  },
]

export const PAYMENT_GATEWAY_CONFIG_GROUPS: SettingGroupDef[] = [
  {
    title: 'Stripe',
    description: 'Online payment with Stripe.',
    icon: CreditCard,
    fields: [
      { key: 'stripe_public_key', label: 'Stripe public key', fieldType: 'text', defaultValue: '', placeholder: 'pk_live_…' },
      {
        key: 'stripe_secret_key',
        label: 'Stripe secret key',
        fieldType: 'password',
        defaultValue: '',
        placeholder: 'sk_live_…',
        warning: 'Never share your secret key or commit it to source control.',
      },
    ],
  },
  {
    title: 'PayPal',
    description: 'PayPal Express Checkout.',
    icon: CreditCard,
    fields: [
      {
        key: 'paypal_environment',
        label: 'PayPal environment',
        fieldType: 'dropdown',
        defaultValue: 'sandbox',
        options: [
          { label: 'Sandbox (testing)', value: 'sandbox' },
          { label: 'Production (live)', value: 'production' },
        ],
      },
      { key: 'paypal_sandbox_key', label: 'PayPal sandbox key', fieldType: 'password', defaultValue: '' },
      { key: 'paypal_production_key', label: 'PayPal production key', fieldType: 'password', defaultValue: '' },
    ],
  },
  {
    title: 'PayStack',
    description: 'PayStack payment gateway.',
    icon: CreditCard,
    fields: [
      { key: 'paystack_public_key', label: 'PayStack public key', fieldType: 'text', defaultValue: '' },
      { key: 'paystack_private_key', label: 'PayStack private key', fieldType: 'password', defaultValue: '' },
    ],
  },
  {
    title: 'Razorpay',
    description: 'Razorpay payment gateway.',
    icon: CreditCard,
    fields: [
      { key: 'razorpay_key_id', label: 'Razorpay key ID', fieldType: 'text', defaultValue: '' },
      { key: 'razorpay_secret_key', label: 'Razorpay secret key', fieldType: 'password', defaultValue: '' },
    ],
  },
  {
    title: 'PayTm',
    description: 'Paytm payment gateway.',
    icon: CreditCard,
    fields: [
      { key: 'paytm_merchant_id', label: 'Merchant ID', fieldType: 'text', defaultValue: '' },
      { key: 'paytm_merchant_key', label: 'Merchant key', fieldType: 'password', defaultValue: '' },
      { key: 'paytm_website', label: 'Website', fieldType: 'text', defaultValue: '', placeholder: 'WEBSTAGING / DEFAULT' },
      { key: 'paytm_industry_type', label: 'Industry type', fieldType: 'text', defaultValue: '', placeholder: 'Retail' },
      { key: 'paytm_channel_id_website', label: 'Channel ID (for website)', fieldType: 'text', defaultValue: '', placeholder: 'WEB' },
      { key: 'paytm_channel_id_mobile', label: 'Channel ID (for mobile)', fieldType: 'text', defaultValue: '', placeholder: 'WAP' },
      {
        key: 'paytm_transaction_url',
        label: 'Transaction URL',
        fieldType: 'url',
        defaultValue: '',
        placeholder: 'https://securegw.paytm.in/...',
      },
      {
        key: 'paytm_transaction_status_url',
        label: 'Transaction status URL (callback)',
        fieldType: 'url',
        defaultValue: '',
        placeholder: 'https://yourapp.com/api/paytm/callback',
      },
    ],
  },
  {
    title: 'PayUmoney',
    description: 'PayUMoney payment gateway.',
    icon: CreditCard,
    fields: [
      { key: 'payumoney_merchant_key', label: 'Merchant key', fieldType: 'password', defaultValue: '' },
      { key: 'payumoney_salt', label: 'Salt', fieldType: 'password', defaultValue: '' },
      { key: 'payumoney_working_key', label: 'Working key', fieldType: 'password', defaultValue: '' },
      {
        key: 'payumoney_success_url',
        label: 'Success URL',
        fieldType: 'url',
        defaultValue: '',
        placeholder: 'https://yourapp.com/api/payumoney/success',
      },
      {
        key: 'payumoney_failure_url',
        label: 'Failure URL',
        fieldType: 'url',
        defaultValue: '',
        placeholder: 'https://yourapp.com/api/payumoney/failure',
      },
    ],
  },
  {
    title: 'CCAvenue',
    description: 'CCAvenue gateway.',
    icon: CreditCard,
    fields: [
      { key: 'ccavenue_merchant_id', label: 'Merchant ID', fieldType: 'text', defaultValue: '' },
      { key: 'ccavenue_access_code', label: 'Access code', fieldType: 'text', defaultValue: '' },
      { key: 'ccavenue_working_key', label: 'Working key', fieldType: 'password', defaultValue: '' },
      { key: 'ccavenue_redirect_url', label: 'Redirect URL', fieldType: 'url', defaultValue: '' },
      { key: 'ccavenue_cancel_url', label: 'Cancel URL', fieldType: 'url', defaultValue: '' },
      { key: 'ccavenue_currency', label: 'Currency', fieldType: 'text', defaultValue: 'INR', placeholder: 'INR' },
      { key: 'ccavenue_language', label: 'Language', fieldType: 'text', defaultValue: 'EN', placeholder: 'EN' },
    ],
  },
]

export const SMS_CONFIG_GROUPS: SettingGroupDef[] = [
  {
    title: 'Gateway',
    icon: MessageSquare,
    fields: [
      {
        key: 'default_sms_gateway',
        label: 'Default SMS gateway',
        fieldType: 'dropdown',
        defaultValue: 'msg91',
        options: [
          { label: 'Custom', value: 'custom' },
          { label: 'Twilio', value: 'twilio' },
          { label: 'MSG91', value: 'msg91' },
        ],
      },
    ],
  },
  {
    title: 'Custom SMS settings',
    description: 'Used only when the default gateway above is set to Custom.',
    icon: Code2,
    fields: [
      { key: 'custom_sms_base_url', label: 'Base URL', fieldType: 'url', defaultValue: '', placeholder: 'https://sms-provider.com/api/send' },
      { key: 'custom_sms_auth_key', label: 'Auth key', fieldType: 'password', defaultValue: '' },
      { key: 'custom_sms_sender_id', label: 'Sender ID', fieldType: 'text', defaultValue: '', placeholder: 'PUREET' },
      {
        key: 'custom_sms_method_type',
        label: 'Method type',
        fieldType: 'dropdown',
        defaultValue: 'GET',
        options: [
          { label: 'GET', value: 'GET' },
          { label: 'POST', value: 'POST' },
        ],
      },
      {
        key: 'custom_sms_sample_url',
        label: 'Sample URL',
        fieldType: 'textarea',
        defaultValue: '',
        placeholder: 'https://sms-provider.com/api/send?authkey={key}&mobiles={mobile}&message={message}',
        info: 'Use {key}, {mobile}, {message} as placeholders for the values sent on each request.',
      },
      { key: 'custom_sms_extra_param_1', label: 'Extra parameter 1', fieldType: 'text', defaultValue: '' },
      { key: 'custom_sms_extra_param_2', label: 'Extra parameter 2', fieldType: 'text', defaultValue: '' },
      { key: 'custom_sms_extra_param_3', label: 'Extra parameter 3', fieldType: 'text', defaultValue: '' },
      { key: 'custom_sms_extra_param_4', label: 'Extra parameter 4', fieldType: 'text', defaultValue: '' },
      { key: 'custom_sms_extra_param_5', label: 'Extra parameter 5', fieldType: 'text', defaultValue: '' },
    ],
  },
  {
    title: 'Twilio settings',
    description: 'Used only when the default gateway above is set to Twilio.',
    icon: MessageSquare,
    fields: [
      { key: 'twilio_sid', label: 'Twilio SID', fieldType: 'text', defaultValue: '' },
      { key: 'twilio_access_token', label: 'Twilio access token', fieldType: 'password', defaultValue: '' },
      { key: 'twilio_phone_number', label: 'Twilio phone number', fieldType: 'text', defaultValue: '', placeholder: '+1XXXXXXXXXX' },
    ],
  },
  {
    title: 'OTP verification',
    icon: Bell,
    fields: [
      { key: 'otp_verification_registration', label: 'OTP verification on registration', fieldType: 'boolean', defaultValue: 'true' },
      {
        key: 'otp_message',
        label: 'OTP message',
        fieldType: 'textarea',
        defaultValue: 'Your OTP verification code is: {otp}',
        placeholder: 'Your OTP verification code is: {otp}',
        info: 'Use {otp} as a placeholder for the generated code.',
      },
    ],
  },
  {
    title: 'Order SMS notifications',
    icon: MessageSquare,
    fields: [
      { key: 'sms_notification_store_owners', label: 'SMS notification for store owners', fieldType: 'boolean', defaultValue: 'true' },
      {
        key: 'store_owner_new_order_message',
        label: "Store owner's new order message",
        fieldType: 'textarea',
        defaultValue: 'You have a new order #{order_id}.',
        placeholder: 'You have a new order #{order_id}.',
        info: 'Use {order_id} as a placeholder for the order number.',
      },
      { key: 'include_order_value_sms', label: 'Include order value in the SMS', fieldType: 'boolean', defaultValue: 'true' },
      { key: 'sms_notification_delivery_guys', label: 'SMS notification for delivery guys', fieldType: 'boolean', defaultValue: 'true' },
      {
        key: 'delivery_guy_new_order_message',
        label: "Delivery guy's new order message",
        fieldType: 'textarea',
        defaultValue: 'A new delivery #{order_id} has been assigned to you.',
        placeholder: 'A new delivery #{order_id} has been assigned to you.',
        info: 'Use {order_id} as a placeholder for the order number.',
      },
    ],
  },
]

const ALL_DYNAMIC_SETTING_GROUPS: SettingGroupDef[] = [
  GENERAL_TIMING_GROUP,
  ...CUSTOMER_APP_GROUPS,
  ...DELIVERY_APP_GROUPS,
  ...STORE_DASHBOARD_GROUPS,
  ...PUSH_NOTIFICATIONS_GROUPS,
  ...SOCIAL_LOGIN_GROUPS,
  ...GOOGLE_MAP_GROUPS,
  ...GOOGLE_ANALYTICS_GROUPS,
  ...EMAIL_SETTINGS_GROUPS,
  ...PAYMENT_GATEWAY_CONFIG_GROUPS,
  ...SMS_CONFIG_GROUPS,
]

export function buildDefaultDynamicSettingValues(): Record<string, string> {
  const defaults: Record<string, string> = {}
  for (const group of ALL_DYNAMIC_SETTING_GROUPS) {
    for (const field of group.fields) {
      defaults[field.key] = field.defaultValue
    }
  }
  return defaults
}
