import type { EffectiveQuotationStatus } from '../../../types/quotation'

const slug = (value: string) => value.toLowerCase().replaceAll(' ', '-')

export function QuotationStatusBadge({ status }: { status: EffectiveQuotationStatus }) {
  return <span className={`quotation-status-badge quotation-status-${slug(status)}`} aria-label={`Status: ${status}`}>{status}</span>
}
