import { ArrowLeft, FileText } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { initialCustomers } from '../../data/customerMockData'
import { serviceRequestRepository } from '../../repositories/serviceRequestRepository'

export function ServiceRequestDetailsPlaceholder() {
  const { requestId } = useParams()
  const request = requestId ? serviceRequestRepository.findById(requestId) : undefined
  if (!request) return <section className="profile-not-found"><FileText size={30} /><h1>Service Request Not Found</h1><p>The requested service request record could not be found.</p><Link className="button button-secondary" to="/marketing/service-requests"><ArrowLeft size={15} />Back to Service Requests</Link></section>
  const customer = initialCustomers.find((item) => item.id === request.customerId)
  return <div className="request-details-page"><nav className="request-breadcrumb" aria-label="Breadcrumb"><ol><li><Link to="/marketing/service-requests">Service Requests</Link></li><li aria-hidden="true">/</li><li aria-current="page">{request.referenceNumber}</li></ol></nav><section className="request-details-card"><span className="request-reference-icon"><FileText size={21} /></span><div><span className={`request-status-badge request-status-${request.status.toLowerCase().replaceAll(' ', '-')}`}>{request.status}</span><h1>{request.referenceNumber}</h1><p>Service Request details will be implemented next.</p></div><dl><div><dt>Customer</dt><dd>{customer?.companyName ?? request.customerId}</dd></div><div><dt>Vessel</dt><dd>{request.vessel.name || 'Not provided'}</dd></div><div><dt>Service Type</dt><dd>{request.service.type || 'Not provided'}</dd></div><div><dt>Requested Date</dt><dd>{request.schedule.requestedDate || 'Not provided'}</dd></div><div><dt>Status</dt><dd>{request.status}</dd></div></dl></section></div>
}
