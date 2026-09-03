import { Badge } from '@/components/ui/Feedback'

const toneByStatus: Record<string, 'slate' | 'green' | 'red' | 'amber' | 'blue' | 'purple'> = {
  Placed: 'blue',
  Accepted: 'purple',
  Preparing: 'amber',
  'Ready for Pickup': 'amber',
  'Rider Assigned': 'purple',
  'Picked Up': 'blue',
  'On the way': 'blue',
  Delivered: 'green',
  'Delivered (Self-Pickup)': 'green',
  Cancelled: 'red',
  Rejected: 'red',
  Returned: 'purple',
  'Auto-Cancelled': 'amber',
}

export function OrderStatusBadge({ status }: { status: string }) {
  return <Badge tone={toneByStatus[status] ?? 'slate'}>{status}</Badge>
}
