import type { PaymentGateway, Setting, SmsGateway } from '@/types/entities'

export const settings: Setting[] = [
  { id: 1, key: 'app_name', value: 'PureEats' },
  { id: 2, key: 'currency_symbol', value: '₹' },
  { id: 3, key: 'currency_code', value: 'INR' },
  { id: 4, key: 'default_tax_percent', value: '5' },
  { id: 5, key: 'support_email', value: 'support@pureeats.in' },
  { id: 6, key: 'support_phone', value: '+91 98000 00000' },
  { id: 7, key: 'default_commission_rate', value: '15' },
  { id: 8, key: 'min_withdrawal_amount', value: '500' },
  { id: 9, key: 'maintenance_mode', value: 'false' },
]

// code matches the customer app's PaymentMode exactly ('COD' | 'WALLET' | 'UPI') — a gateway with no
// code (none of these three) would show in this list but never actually appear at checkout.
export const paymentGateways: PaymentGateway[] = [
  { id: 1, name: 'Cash on Delivery', code: 'COD', description: 'Pay with cash when your order arrives', logo: '', isActive: true, createdAt: '2025-10-01T09:00:00Z', updatedAt: '2025-10-01T09:00:00Z' },
  { id: 2, name: 'PureEats Wallet', code: 'WALLET', description: 'Pay using your wallet balance', logo: '', isActive: true, createdAt: '2025-10-01T09:00:00Z', updatedAt: '2025-10-01T09:00:00Z' },
  { id: 3, name: 'UPI / Razorpay', code: 'UPI', description: 'Pay via GPay, PhonePe, Paytm, cards & more, through Razorpay once configured', logo: '', isActive: true, createdAt: '2025-10-01T09:00:00Z', updatedAt: '2025-10-01T09:00:00Z' },
]

export const smsGateways: SmsGateway[] = [
  { id: 1, gatewayName: 'MSG91', isActive: true, createdAt: '2025-10-01T09:00:00Z', updatedAt: '2025-10-01T09:00:00Z' },
  { id: 2, gatewayName: 'Twilio', isActive: false, createdAt: '2025-10-01T09:00:00Z', updatedAt: '2025-10-01T09:00:00Z' },
]
