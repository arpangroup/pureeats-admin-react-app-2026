import { AppRoutes } from '@/routes/AppRoutes'
import { NewOrderAlertProvider } from '@/context/NewOrderAlertContext'
import { NewOrderToastStack } from '@/components/orders/NewOrderToastStack'

export default function App() {
  return (
    <NewOrderAlertProvider>
      <AppRoutes />
      <NewOrderToastStack />
    </NewOrderAlertProvider>
  )
}
