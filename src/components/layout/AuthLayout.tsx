import { Outlet } from 'react-router-dom'
import { UtensilsCrossed } from 'lucide-react'

export function AuthLayout() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600 text-white">
            <UtensilsCrossed size={22} />
          </div>
          <h1 className="text-lg font-semibold text-slate-800">PureEats</h1>
          <p className="text-sm text-slate-500">Admin &amp; Restaurant Owner Console</p>
        </div>
        <Outlet />
      </div>
    </div>
  )
}
