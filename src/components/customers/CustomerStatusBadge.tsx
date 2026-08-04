import type { CustomerStatus } from '../../types/customer'

export function CustomerStatusBadge({ status }: { status: CustomerStatus }) {
  return <span className={`customer-status status-${status.toLowerCase()}`}>{status}</span>
}
