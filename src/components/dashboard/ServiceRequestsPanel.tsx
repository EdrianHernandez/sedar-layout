import type { RequestFilter } from '../../types'
import { RequestFilterTabs } from './RequestFilterTabs'
import { serviceRequestRepository } from '../../repositories/serviceRequestRepository'
import { initialCustomers } from '../../data/customerMockData'
import { ServiceRequestStatusBadge } from '../service-requests/ServiceRequestBadges'
import { Link } from 'react-router-dom'

interface ServiceRequestsPanelProps { filter: RequestFilter; onFilterChange: (filter: RequestFilter) => void }

export function ServiceRequestsPanel({ filter, onFilterChange }: ServiceRequestsPanelProps) {
  const customerNames = new Map(initialCustomers.map((customer) => [customer.id, customer.companyName]))
  const requests = serviceRequestRepository.getAll().filter((request) => filter === 'ALL' || (filter === 'DRAFTS' ? request.status === 'Draft' : !['Draft', 'Completed', 'Cancelled'].includes(request.status))).slice(0, 6)
  return (
    <section className="panel requests-panel" aria-labelledby="requests-heading">
      <header className="panel-header"><h2 id="requests-heading">Service Requests</h2><RequestFilterTabs selected={filter} onSelect={onFilterChange} /></header>
      <div className="table-scroll">
        <table><thead><tr><th>Ref No.</th><th>Customer</th><th>Service Type</th><th>Status</th></tr></thead><tbody>{requests.length ? requests.map((request) => <tr key={request.id}><td><Link to={`/marketing/service-requests/${request.id}`}>{request.referenceNumber}</Link></td><td>{customerNames.get(request.customerId) ?? request.customerId}</td><td>{request.service.type}</td><td><ServiceRequestStatusBadge status={request.status} /></td></tr>) : <tr><td colSpan={4} className="empty-table">No service requests found.</td></tr>}</tbody></table>
      </div>
    </section>
  )
}
