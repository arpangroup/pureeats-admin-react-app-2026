import { useContext } from 'react'
import { NewOrderAlertContext } from '@/context/NewOrderAlertContext'

export function useNewOrderAlerts() {
  const ctx = useContext(NewOrderAlertContext)
  if (!ctx) throw new Error('useNewOrderAlerts must be used within a NewOrderAlertProvider')
  return ctx
}
