import { ArrowLeft, ReceiptText } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { initialCustomers } from '../../data/customerMockData'
import { quotationRepository } from '../../repositories/quotationRepository'
import { serviceRequestRepository } from '../../repositories/serviceRequestRepository'
import { formatCurrency } from '../../utils/formatCurrency'
import { getEffectiveQuotationStatus } from '../../utils/quotationStatus'
import { QuotationStatusBadge } from '../../components/customers/quotations/QuotationStatusBadge'

export function QuotationDetailsPlaceholder() {
  const { quotationId } = useParams()
  const quotation = quotationId ? quotationRepository.getById(quotationId) : undefined
  if (!quotation) return <section className="profile-not-found"><h1>Quotation Not Found</h1><p>The requested quotation could not be found.</p><Link className="button button-secondary" to="/marketing/quotations"><ArrowLeft size={15} />Back to Quotations</Link></section>
  const customer = initialCustomers.find((item) => item.id === quotation.customerId)
  const request = serviceRequestRepository.findById(quotation.serviceRequestId)
  return <section className="quotation-placeholder-page"><nav aria-label="Breadcrumb"><Link to={`/marketing/customers/${quotation.customerId}?tab=quotations`}>Customer Quotations</Link></nav><div className="quotation-details-card"><span className="request-reference-icon"><ReceiptText size={22} /></span><div><QuotationStatusBadge status={getEffectiveQuotationStatus(quotation)} /><h1>{quotation.quotationNumber}</h1><p>{quotation.revisionNumber ? `Revision ${quotation.revisionNumber}` : 'Original quotation'}</p></div><dl><div><dt>Customer</dt><dd>{customer?.companyName ?? quotation.customerId}</dd></div><div><dt>Related Request</dt><dd>{request?.referenceNumber ?? quotation.serviceRequestId}</dd></div><div><dt>Service</dt><dd>{request?.service.type ?? quotation.serviceType ?? 'Not provided'}</dd></div><div><dt>Vessel</dt><dd>{request?.vessel.name ?? quotation.vesselName ?? 'Not provided'}</dd></div><div><dt>Amount</dt><dd>{formatCurrency(quotation.totalAmount)}</dd></div><div><dt>Valid Until</dt><dd>{quotation.validUntil ? new Date(quotation.validUntil).toLocaleDateString('en-PH') : 'Not set'}</dd></div></dl></div><p className="quotation-placeholder-note">Quotation details will be implemented next.</p></section>
}
