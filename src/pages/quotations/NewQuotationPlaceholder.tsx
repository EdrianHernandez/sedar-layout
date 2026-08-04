import { ArrowLeft, FilePlus2 } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { initialCustomers } from '../../data/customerMockData'
import { serviceRequestRepository } from '../../repositories/serviceRequestRepository'

export function NewQuotationPlaceholder() {
  const [params] = useSearchParams()
  const customer = initialCustomers.find((item) => item.id === params.get('customerId'))
  const request = serviceRequestRepository.findById(params.get('serviceRequestId') ?? '')
  const back = customer ? `/marketing/customers/${customer.id}?tab=quotations` : '/marketing/quotations'
  return <section className="quotation-placeholder-page"><Link className="quotation-back-link" to={back}><ArrowLeft size={15} />Back to Quotations</Link><div className="quotation-builder-placeholder"><span><FilePlus2 size={24} /></span><h1>Create Quotation</h1>{customer && request ? <dl><div><dt>Customer</dt><dd>{customer.companyName}</dd></div><div><dt>Related Request</dt><dd>{request.referenceNumber}</dd></div><div><dt>Vessel</dt><dd>{request.vessel.name}</dd></div><div><dt>Service</dt><dd>{request.service.type}</dd></div></dl> : <p>Select a customer and eligible service request before preparing a quotation.</p>}<strong>The quotation builder will be implemented next.</strong></div></section>
}
