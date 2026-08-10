import type { InternalApprovalStatus } from '../../types/quotation'
import type { QuotationDisplayStatus } from '../../utils/quotationWorkflow'

const slug = (value: string) => value.toLowerCase().replaceAll(' ', '-')

export function QuotationStatusBadge({ status }: { status: QuotationDisplayStatus }) {
  return <span className={`quotation-status-badge quotation-status-${slug(status)}`} aria-label={`Quotation status: ${status}`}>{status}</span>
}

export function ApprovalStatusBadge({ status }: { status: InternalApprovalStatus }) {
  return <span className={`quotation-approval-badge quotation-approval-${slug(status)}`} aria-label={`Internal approval: ${status}`}>{status}</span>
}
