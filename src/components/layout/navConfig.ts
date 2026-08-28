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
    title: 'Operations',
    items: [
      { label: 'Orders', to: '/admin/orders', icon: ShoppingBag },
      { label: 'Restaurants', to: '/admin/restaurants', icon: Store },
      { label: 'Restaurant Categories', to: '/admin/restaurant-categories', icon: LayoutGrid },
      { label: 'Category Sliders', to: '/admin/restaurant-category-sliders', icon: Images },
      { label: 'Items', to: '/admin/items', icon: UtensilsCrossed },
      { label: 'Item Categories', to: '/admin/item-categories', icon: Layers },
      { label: 'Addon Categories', to: '/admin/addon-categories', icon: PlusSquare },
      { label: 'Addons', to: '/admin/addons', icon: PlusSquare },
      { label: 'Coupons', to: '/admin/coupons', icon: Tag },
    ],
  },
  {
    title: 'People',
    items: [
      { label: 'Users', to: '/admin/users', icon: Users },
      { label: 'Employees', to: '/admin/employees', icon: UserCog },
      { label: 'Restaurant Owners', to: '/admin/restaurant-owners', icon: UserCog },
      { label: 'Owner ↔ Restaurants', to: '/admin/restaurant-owners-restaurants', icon: LayoutGrid },
      { label: 'Delivery Partners', to: '/admin/delivery-guys', icon: Bike },
      { label: 'Rider ↔ Restaurants', to: '/admin/delivery-guys-restaurants', icon: LayoutGrid },
    ],
  },
  {
    title: 'Finance',
    items: [
      { label: 'Restaurant Payouts', to: '/admin/restaurant-payouts', icon: HandCoins },
      { label: 'Wallet Transactions', to: '/admin/wallet-transactions', icon: Wallet },
      { label: 'Delivery Collections', to: '/admin/delivery-collections', icon: Banknote },
    ],
  },
  {
    title: 'Content',
    items: [
      { label: 'Locations', to: '/admin/locations', icon: MapPin },
      { label: 'Popular Geo Places', to: '/admin/popular-geo-places', icon: Globe2 },
      { label: 'Sliders', to: '/admin/sliders', icon: Images },
      { label: 'Pages', to: '/admin/pages', icon: FileText },
      { label: 'Translations', to: '/admin/translations', icon: Languages },
      { label: 'Ratings', to: '/admin/ratings', icon: Star },
      { label: 'Notifications', to: '/admin/notifications', icon: Bell },
    ],
  },
  {
    title: 'System',
    items: [
      { label: 'Modules', to: '/admin/modules', icon: Puzzle },
      { label: 'Settings', to: '/admin/settings', icon: Settings },
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
