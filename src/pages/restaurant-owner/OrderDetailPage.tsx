import { Navigate } from 'react-router-dom'

/**
 * The store-owner order API has no "get one order by id" endpoint (see StoreOwnerOrderController
 * — only the /new and /running buckets plus the accept/ready/self-pickup-complete/cancel action
 * verbs exist), so there's nothing for a detail page to fetch. The Orders list itself already
 * shows every order in those two buckets with the same actions, so this route just lands back there.
 */
export default function OwnerOrderDetailPage() {
  return <Navigate to="/restaurant-owner/orders" replace />
}
