import type { LucideIcon } from 'lucide-react'
import {
  LayoutDashboard,
  ShoppingBag,
  Store,
  UtensilsCrossed,
  Layers,
  PlusSquare,
  Tag,
  Users,
  Bike,
  UserCog,
  MapPin,
  Globe2,
  Images,
  LayoutGrid,
  Languages,
  FileText,
  Settings,
  Puzzle,
  Star,
  Bell,
  Wallet,
  Banknote,
  HandCoins,
  TrendingUp,
  ClipboardCheck,
  UploadCloud,
  Send,
  BarChart3,
  ShieldAlert,
  History,
  KeyRound,
  Gauge,
  ShieldOff,
  Smartphone,
  Cable,
  ListChecks,
} from 'lucide-react'

export interface NavItem {
  label: string
  to: string
  icon: LucideIcon
}

export interface NavSection {
  title?: string
  items: NavItem[]
}

export const adminNav: NavSection[] = [
  { items: [{ label: 'Dashboard', to: '/admin/dashboard', icon: LayoutDashboard }] },
  {
    title: 'Sales',
    items: [
      { label: 'Orders', to: '/admin/orders', icon: ShoppingBag },
      { label: 'Coupons', to: '/admin/coupons', icon: Tag },
      { label: 'Cart Simulator', to: '/admin/cart-simulator', icon: ListChecks },
    ],
  },
  {
    title: 'Stores',
    items: [
      { label: 'Stores', to: '/admin/restaurants', icon: Store },
      { label: 'Store Category', to: '/admin/restaurant-categories', icon: LayoutGrid },
      { label: 'Items', to: '/admin/items', icon: UtensilsCrossed },
      { label: 'Item Categories', to: '/admin/item-categories', icon: Layers },
      { label: 'Addon Categories', to: '/admin/addon-categories', icon: PlusSquare },
      { label: 'Addons', to: '/admin/addons', icon: PlusSquare },
    ],
  },
  {
    title: 'Sliders',
    items: [
      { label: 'Store Category Sliders', to: '/admin/restaurant-category-sliders', icon: Images },
      { label: 'Promo Sliders', to: '/admin/sliders', icon: Images },
    ],
  },
  {
    title: 'People',
    items: [
      { label: 'All Users', to: '/admin/users', icon: Users },
      { label: 'Employees', to: '/admin/employees', icon: UserCog },
      { label: 'Store Owners', to: '/admin/restaurant-owners', icon: UserCog },
      { label: 'Owner ↔ Stores', to: '/admin/restaurant-owners-restaurants', icon: LayoutGrid },
      { label: 'Delivery Partners', to: '/admin/delivery-guys', icon: Bike },
      { label: 'Rider ↔ Stores', to: '/admin/delivery-guys-restaurants', icon: LayoutGrid },
    ],
  },
  {
    title: 'Finance',
    items: [
      { label: 'Store Payouts', to: '/admin/restaurant-payouts', icon: HandCoins },
      { label: 'Wallet Transactions', to: '/admin/wallet-transactions', icon: Wallet },
      { label: 'Delivery Collections', to: '/admin/delivery-collections', icon: Banknote },
    ],
  },
  {
    title: 'Marketing',
    items: [
      { label: 'Notifications', to: '/admin/notifications', icon: Bell },
      { label: 'Send Notification', to: '/admin/send-notification', icon: Send },
    ],
  },
  {
    title: 'Reports',
    items: [{ label: 'Reports', to: '/admin/reports', icon: BarChart3 }],
  },
  {
    title: 'Content',
    items: [
      { label: 'Locations', to: '/admin/locations', icon: MapPin },
      { label: 'Popular Geo Places', to: '/admin/popular-geo-places', icon: Globe2 },
      { label: 'Pages', to: '/admin/pages', icon: FileText },
      { label: 'Translations', to: '/admin/translations', icon: Languages },
      { label: 'Ratings', to: '/admin/ratings', icon: Star },
    ],
  },
  {
    title: 'System',
    items: [
      { label: 'Modules', to: '/admin/modules', icon: Puzzle },
      { label: 'Settings', to: '/admin/settings', icon: Settings },
    ],
  },
  {
    title: 'Security & Audit',
    items: [
      { label: 'Audit Logs', to: '/admin/audit/audit-logs', icon: ShieldAlert },
      { label: 'Login History', to: '/admin/audit/login-history', icon: History },
      { label: 'OTP Challenges', to: '/admin/audit/otp-challenges', icon: KeyRound },
      { label: 'Rate Limit Buckets', to: '/admin/audit/rate-limit-buckets', icon: Gauge },
      { label: 'Security Blocklist', to: '/admin/audit/security-blocklist', icon: ShieldOff },
      { label: 'User Devices', to: '/admin/audit/user-devices', icon: Smartphone },
      { label: 'User Sessions', to: '/admin/audit/user-sessions', icon: Cable },
    ],
  },
]

export const ownerNav: NavSection[] = [
  { items: [{ label: 'Dashboard', to: '/restaurant-owner/dashboard', icon: LayoutDashboard }] },
  {
    title: 'My Restaurant',
    items: [
      { label: 'Orders', to: '/restaurant-owner/orders', icon: ShoppingBag },
      { label: 'Restaurants', to: '/restaurant-owner/restaurants', icon: Store },
      { label: 'Items', to: '/restaurant-owner/items', icon: UtensilsCrossed },
      { label: 'Item Categories', to: '/restaurant-owner/item-categories', icon: Layers },
      { label: 'Addon Categories', to: '/restaurant-owner/addon-categories', icon: PlusSquare },
      { label: 'Addons', to: '/restaurant-owner/addons', icon: PlusSquare },
      { label: 'Coupons', to: '/restaurant-owner/coupons', icon: Tag },
    ],
  },
  {
    title: 'Finance',
    items: [{ label: 'Earnings', to: '/restaurant-owner/earnings', icon: TrendingUp }],
  },
]
