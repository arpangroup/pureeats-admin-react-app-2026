import { Navigate, Route, Routes } from 'react-router-dom'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { RestaurantOwnerLayout } from '@/components/layout/RestaurantOwnerLayout'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { useAuth } from '@/hooks/useAuth'
import { ProtectedRoute } from './ProtectedRoute'

import LoginPage from '@/pages/auth/LoginPage'
import RegisterPage from '@/pages/auth/RegisterPage'
import VerifyPage from '@/pages/auth/VerifyPage'

import AdminDashboardPage from '@/pages/admin/DashboardPage'
import AdminOrdersPage from '@/pages/admin/OrdersPage'
import AdminOrderDetailPage from '@/pages/admin/OrderDetailPage'
import AdminRestaurantsPage from '@/pages/admin/RestaurantsPage'
import AdminRestaurantFormPage from '@/pages/admin/RestaurantFormPage'
import RestaurantCategoriesPage from '@/pages/admin/RestaurantCategoriesPage'
import AdminItemsPage from '@/pages/admin/ItemsPage'
import ItemCategoriesPage from '@/pages/admin/ItemCategoriesPage'
import AddonCategoriesPage from '@/pages/admin/AddonCategoriesPage'
import AddonsPage from '@/pages/admin/AddonsPage'
import CouponsPage from '@/pages/admin/CouponsPage'
import CouponFormPage from '@/pages/admin/CouponFormPage'
import UsersPage from '@/pages/admin/UsersPage'
import UserDetailPage from '@/pages/admin/UserDetailPage'
import EmployeesPage from '@/pages/admin/EmployeesPage'
import EmployeeDetailPage from '@/pages/admin/EmployeeDetailPage'
import RestaurantOwnersPage from '@/pages/admin/RestaurantOwnersPage'
import RestaurantOwnerDetailPage from '@/pages/admin/RestaurantOwnerDetailPage'
import RestaurantOwnerRestaurantsPage from '@/pages/admin/RestaurantOwnerRestaurantsPage'
import DeliveryGuysPage from '@/pages/admin/DeliveryGuysPage'
import DeliveryGuyDetailPage from '@/pages/admin/DeliveryGuyDetailPage'
import DeliveryGuyRestaurantsPage from '@/pages/admin/DeliveryGuyRestaurantsPage'
import RestaurantPayoutsPage from '@/pages/admin/RestaurantPayoutsPage'
import WalletTransactionsPage from '@/pages/admin/WalletTransactionsPage'
import DeliveryCollectionsPage from '@/pages/admin/DeliveryCollectionsPage'
import LocationsPage from '@/pages/admin/LocationsPage'
import PopularGeoLocationsPage from '@/pages/admin/PopularGeoLocationsPage'
import RestaurantCategorySliderPage from '@/pages/admin/RestaurantCategorySliderPage'
import SlidersPage from '@/pages/admin/SlidersPage'
import PagesPage from '@/pages/admin/PagesPage'
import TranslationsPage from '@/pages/admin/TranslationsPage'
import RatingsPage from '@/pages/admin/RatingsPage'
import NotificationsPage from '@/pages/admin/NotificationsPage'
import SendNotificationPage from '@/pages/admin/SendNotificationPage'
import ReportsPage from '@/pages/admin/ReportsPage'
import ModulesPage from '@/pages/admin/ModulesPage'
import SettingsPage from '@/pages/admin/SettingsPage'
import AuditLogsPage from '@/pages/admin/audit/AuditLogsPage'
import LoginHistoryPage from '@/pages/admin/audit/LoginHistoryPage'
import OtpChallengesPage from '@/pages/admin/audit/OtpChallengesPage'
import RateLimitBucketsPage from '@/pages/admin/audit/RateLimitBucketsPage'
import SecurityBlockEntriesPage from '@/pages/admin/audit/SecurityBlockEntriesPage'
import UserDevicesPage from '@/pages/admin/audit/UserDevicesPage'
import UserSessionsPage from '@/pages/admin/audit/UserSessionsPage'

import OwnerDashboardPage from '@/pages/restaurant-owner/DashboardPage'
import OwnerOrdersPage from '@/pages/restaurant-owner/OrdersPage'
import OwnerOrderDetailPage from '@/pages/restaurant-owner/OrderDetailPage'
import OwnerRestaurantsPage from '@/pages/restaurant-owner/RestaurantsPage'
import OwnerRestaurantFormPage from '@/pages/restaurant-owner/RestaurantFormPage'
import OwnerItemsPage from '@/pages/restaurant-owner/ItemsPage'
import OwnerItemCategoriesPage from '@/pages/restaurant-owner/ItemCategoriesPage'
import OwnerAddonCategoriesPage from '@/pages/restaurant-owner/AddonCategoriesPage'
import OwnerAddonsPage from '@/pages/restaurant-owner/AddonsPage'
import OwnerCouponsPage from '@/pages/restaurant-owner/CouponsPage'
import EarningsPage from '@/pages/restaurant-owner/EarningsPage'

function IndexRedirect() {
  const { user, isAuthenticated } = useAuth()
  if (!isAuthenticated || !user) return <Navigate to="/login" replace />
  return <Navigate to={user.role === 'restaurant-owner' ? '/restaurant-owner/dashboard' : '/admin/dashboard'} replace />
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<IndexRedirect />} />

      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify" element={<VerifyPage />} />
      </Route>

      <Route
        path="/admin"
        element={
          <ProtectedRoute allow={['admin', 'employee']}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<AdminDashboardPage />} />
        <Route path="orders" element={<AdminOrdersPage />} />
        <Route path="orders/:id" element={<AdminOrderDetailPage />} />
        <Route path="restaurants" element={<AdminRestaurantsPage />} />
        <Route path="restaurants/new" element={<AdminRestaurantFormPage />} />
        <Route path="restaurants/:id/edit" element={<AdminRestaurantFormPage />} />
        <Route path="restaurant-categories" element={<RestaurantCategoriesPage />} />
        <Route path="restaurant-category-sliders" element={<RestaurantCategorySliderPage />} />
        <Route path="items" element={<AdminItemsPage />} />
        <Route path="item-categories" element={<ItemCategoriesPage />} />
        <Route path="addon-categories" element={<AddonCategoriesPage />} />
        <Route path="addons" element={<AddonsPage />} />
        <Route path="coupons" element={<CouponsPage />} />
        <Route path="coupons/new" element={<CouponFormPage />} />
        <Route path="coupons/:id/edit" element={<CouponFormPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="users/:id" element={<UserDetailPage />} />
        <Route path="employees" element={<EmployeesPage />} />
        <Route path="employees/:id" element={<EmployeeDetailPage />} />
        <Route path="restaurant-owners" element={<RestaurantOwnersPage />} />
        <Route path="restaurant-owners/:id" element={<RestaurantOwnerDetailPage />} />
        <Route path="restaurant-owners-restaurants" element={<RestaurantOwnerRestaurantsPage />} />
        <Route path="delivery-guys" element={<DeliveryGuysPage />} />
        <Route path="delivery-guys/:id" element={<DeliveryGuyDetailPage />} />
        <Route path="delivery-guys-restaurants" element={<DeliveryGuyRestaurantsPage />} />
        <Route path="restaurant-payouts" element={<RestaurantPayoutsPage />} />
        <Route path="wallet-transactions" element={<WalletTransactionsPage />} />
        <Route path="delivery-collections" element={<DeliveryCollectionsPage />} />
        <Route path="locations" element={<LocationsPage />} />
        <Route path="popular-geo-places" element={<PopularGeoLocationsPage />} />
        <Route path="sliders" element={<SlidersPage />} />
        <Route path="pages" element={<PagesPage />} />
        <Route path="translations" element={<TranslationsPage />} />
        <Route path="ratings" element={<RatingsPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="send-notification" element={<SendNotificationPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="modules" element={<ModulesPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="audit/audit-logs" element={<AuditLogsPage />} />
        <Route path="audit/login-history" element={<LoginHistoryPage />} />
        <Route path="audit/otp-challenges" element={<OtpChallengesPage />} />
        <Route path="audit/rate-limit-buckets" element={<RateLimitBucketsPage />} />
        <Route path="audit/security-blocklist" element={<SecurityBlockEntriesPage />} />
        <Route path="audit/user-devices" element={<UserDevicesPage />} />
        <Route path="audit/user-sessions" element={<UserSessionsPage />} />
        <Route index element={<Navigate to="dashboard" replace />} />
      </Route>

      <Route
        path="/restaurant-owner"
        element={
          <ProtectedRoute allow={['restaurant-owner']}>
            <RestaurantOwnerLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<OwnerDashboardPage />} />
        <Route path="orders" element={<OwnerOrdersPage />} />
        <Route path="orders/:id" element={<OwnerOrderDetailPage />} />
        <Route path="restaurants" element={<OwnerRestaurantsPage />} />
        <Route path="restaurants/:id/edit" element={<OwnerRestaurantFormPage />} />
        <Route path="items" element={<OwnerItemsPage />} />
        <Route path="item-categories" element={<OwnerItemCategoriesPage />} />
        <Route path="addon-categories" element={<OwnerAddonCategoriesPage />} />
        <Route path="addons" element={<OwnerAddonsPage />} />
        <Route path="coupons" element={<OwnerCouponsPage />} />
        <Route path="earnings" element={<EarningsPage />} />
        <Route index element={<Navigate to="dashboard" replace />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
