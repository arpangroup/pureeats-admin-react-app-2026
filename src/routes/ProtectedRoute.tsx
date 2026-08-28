import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import type { User } from '@/types/entities'

export function ProtectedRoute({ allow, children }: { allow: User['role'][]; children: ReactNode }) {
  const { user, isAuthenticated } = useAuth()

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />
  }

  if (!allow.includes(user.role)) {
    const fallback = user.role === 'restaurant-owner' ? '/restaurant-owner/dashboard' : '/admin/dashboard'
    return <Navigate to={fallback} replace />
  }

  return <>{children}</>
}
