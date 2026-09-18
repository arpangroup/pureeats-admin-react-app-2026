import { AppRoutes } from '@/routes/AppRoutes'
import { NewOrderAlertProvider } from '@/context/NewOrderAlertContext'
import { NewOrderToastStack } from '@/components/orders/NewOrderToastStack'
import { GoogleMapsProvider } from '@/context/GoogleMapsContext'

export default function App() {
  return (
    <GoogleMapsProvider>
      <NewOrderAlertProvider>
        <AppRoutes />
        <NewOrderToastStack />
      </NewOrderAlertProvider>
    </GoogleMapsProvider>
  )
}
