import type { OperationsReviewStatus, ServicePriority, ServiceRequestStatus } from '../../types/serviceRequest'

const slug = (value: string) => value.toLowerCase().replaceAll(' ', '-')

export function ServiceRequestStatusBadge({ status }: { status: ServiceRequestStatus }) {
  return <span className={`service-request-badge service-status-${slug(status)}`} aria-label={`Status: ${status}`}>{status}</span>
}

export function ServicePriorityBadge({ priority }: { priority: ServicePriority }) {
  return <span className={`service-request-badge service-priority-${slug(priority)}`} aria-label={`Priority: ${priority}`}>{priority}</span>
}

export function OperationsReviewBadge({ status }: { status: OperationsReviewStatus }) {
  return <span className={`operations-review-badge operations-review-${slug(status)}`} aria-label={`Operations review: ${status}`}>{status}</span>
}
