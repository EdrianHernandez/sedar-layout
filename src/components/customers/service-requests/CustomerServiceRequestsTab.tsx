import { BadgeCheck, CircleCheckBig, ClipboardList, Clock3, Plus, Search } from 'lucide-react'
import { useDeferredValue, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { SERVICE_PRIORITIES, SERVICE_REQUEST_STATUSES, SERVICE_TYPES } from '../../../data/serviceRequestOptions'
import { serviceRequestRepository } from '../../../repositories/serviceRequestRepository'
import type { Customer } from '../../../types/customer'
import type { ServicePriority, ServiceRequest, ServiceRequestStatus } from '../../../types/serviceRequest'
import { ServicePriorityBadge, ServiceRequestStatusBadge } from '../../service-requests/ServiceRequestBadges'
import { ServiceRequestActionsMenu } from './ServiceRequestActionsMenu'
import { CancelServiceRequestDialog, DuplicateServiceRequestDialog } from './ServiceRequestDialogs'

interface Props { customer: Customer; onNotify: (message: string) => void }
type DatePeriod = '' | 'today' | 'week' | 'month'

const dateFormatter = new Intl.DateTimeFormat('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })
const formatDate = (value: string) => value ? dateFormatter.format(new Date(`${value}T00:00:00`)) : 'Not scheduled'
const inPeriod = (value: string, period: DatePeriod) => {
  if (!period) return true
  if (!value) return false
  const date = new Date(`${value}T00:00:00`)
  const now = new Date(); now.setHours(0, 0, 0, 0)
  if (period === 'today') return date.getTime() === now.getTime()
  if (period === 'week') { const end = new Date(now); end.setDate(now.getDate() + 6); return date >= now && date <= end }
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth()
}

export function CustomerServiceRequestsTab({ customer, onNotify }: Props) {
  const navigate = useNavigate()
  const [requests, setRequests] = useState(() => serviceRequestRepository.getByCustomerId(customer.id))
  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search.trim().toLowerCase())
  const [status, setStatus] = useState<'' | ServiceRequestStatus>('')
  const [serviceType, setServiceType] = useState('')
  const [priority, setPriority] = useState<'' | ServicePriority>('')
  const [datePeriod, setDatePeriod] = useState<DatePeriod>('')
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [duplicateTarget, setDuplicateTarget] = useState<ServiceRequest | null>(null)
  const [cancelTarget, setCancelTarget] = useState<ServiceRequest | null>(null)

  const filtered = requests.filter((request) => {
    const searchable = [request.referenceNumber, request.vessel.name, request.vessel.type, request.service.type, request.schedule.portOrOperatingArea, request.schedule.berthOrTerminal, request.schedule.origin, request.schedule.destination, request.service.contractReference, request.service.purchaseOrderReference].filter(Boolean).join(' ').toLowerCase()
    return (!deferredSearch || searchable.includes(deferredSearch)) && (!status || request.status === status) && (!serviceType || request.service.type === serviceType) && (!priority || request.priority === priority) && inPeriod(request.schedule.requestedDate, datePeriod)
  })
  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage))
  const currentPage = Math.min(page, totalPages)
  const start = (currentPage - 1) * rowsPerPage
  const visible = filtered.slice(start, start + rowsPerPage)
  const filtersActive = Boolean(search || status || serviceType || priority || datePeriod)
  const clearFilters = () => { setSearch(''); setStatus(''); setServiceType(''); setPriority(''); setDatePeriod(''); setPage(1) }
  const refresh = () => setRequests(serviceRequestRepository.getByCustomerId(customer.id))
  const newRequestPath = `/marketing/service-requests/new?customerId=${encodeURIComponent(customer.id)}`

  const duplicate = () => {
    if (!duplicateTarget) return
    if (serviceRequestRepository.duplicate(duplicateTarget.id)) { refresh(); onNotify('Service request duplicated as draft.') }
    setDuplicateTarget(null)
  }
  const cancel = (reason: string, explanation?: string) => {
    if (!cancelTarget) return
    if (serviceRequestRepository.cancel(cancelTarget.id, reason, explanation)) { refresh(); onNotify('Service request cancelled.') }
    setCancelTarget(null)
  }

  return <section className="service-requests-tab" aria-labelledby="customer-service-requests-title">
    <header className="service-requests-tab-header"><h2 id="customer-service-requests-title">Service Request</h2><Link className="button button-primary" to={newRequestPath}><Plus size={15} aria-hidden="true" />New Service Request</Link></header>
    <div className="service-request-summary" aria-label="Service request summary">
      <div><ClipboardList /><span>Total Requests</span><strong>{requests.length}</strong></div>
      <div><Clock3 /><span>Open Requests</span><strong>{requests.filter((request) => !['Completed', 'Cancelled'].includes(request.status)).length}</strong></div>
      <div><BadgeCheck /><span>Awaiting Approval</span><strong>{requests.filter((request) => ['Awaiting Operations', 'Awaiting Customer Approval'].includes(request.status)).length}</strong></div>
      <div><CircleCheckBig /><span>Completed Services</span><strong>{requests.filter((request) => request.status === 'Completed').length}</strong></div>
    </div>
    <div className="service-request-directory">
      <div className="service-request-filters">
        <label className="customer-search"><Search size={14} /><span className="sr-only">Search service requests</span><input value={search} placeholder="Search by reference, vessel, service, or location" onChange={(event) => { setSearch(event.target.value); setPage(1) }} /></label>
        <label><span className="sr-only">Status</span><select value={status} onChange={(event) => { setStatus(event.target.value as '' | ServiceRequestStatus); setPage(1) }}><option value="">All Statuses</option>{SERVICE_REQUEST_STATUSES.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label><span className="sr-only">Service type</span><select value={serviceType} onChange={(event) => { setServiceType(event.target.value); setPage(1) }}><option value="">All Services</option>{SERVICE_TYPES.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label><span className="sr-only">Priority</span><select value={priority} onChange={(event) => { setPriority(event.target.value as '' | ServicePriority); setPage(1) }}><option value="">All Priorities</option>{SERVICE_PRIORITIES.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label><span className="sr-only">Date period</span><select value={datePeriod} onChange={(event) => { setDatePeriod(event.target.value as DatePeriod); setPage(1) }}><option value="">All Dates</option><option value="today">Today</option><option value="week">This Week</option><option value="month">This Month</option></select></label>
        <button className="clear-filters" type="button" disabled={!filtersActive} onClick={clearFilters}>Clear Filters</button>
      </div>
      {requests.length === 0 ? <div className="service-request-empty"><ClipboardList size={34} /><h3>No service requests have been created for this customer.</h3><p>Create a service request to begin coordinating tug operations.</p><Link className="button button-primary" to={newRequestPath}><Plus size={15} />New Service Request</Link></div> : filtered.length === 0 ? <div className="service-request-empty"><Search size={34} /><h3>No service requests match your search or selected filters.</h3><button className="button button-secondary" type="button" onClick={clearFilters}>Clear Filters</button></div> : <>
        <div className="service-request-table-scroll"><table className="service-request-table"><thead><tr><th scope="col">Reference</th><th scope="col">Vessel</th><th scope="col">Service</th><th scope="col">Schedule</th><th scope="col">Location</th><th scope="col" className="centered">Tugboats</th><th scope="col">Priority</th><th scope="col">Status</th><th scope="col">Assigned To</th><th scope="col"><span className="sr-only">Actions</span></th></tr></thead><tbody>{visible.map((request) => <tr key={request.id}>
          <td><Link className="service-request-reference" aria-label={`View service request ${request.referenceNumber}`} to={`/marketing/service-requests/${request.id}`}>{request.referenceNumber}</Link></td>
          <td><strong>{request.vessel.name || '—'}</strong>{request.vessel.type && <span>{request.vessel.type}</span>}</td>
          <td><strong>{request.service.type || '—'}</strong>{request.service.preferredTugClass && <span>{request.service.preferredTugClass}</span>}</td>
          <td><strong>{formatDate(request.schedule.requestedDate)}</strong><span>{request.schedule.requestedTime || 'Time not set'}</span></td>
          <td><strong>{request.schedule.portOrOperatingArea || '—'}</strong>{request.schedule.berthOrTerminal && <span>{request.schedule.berthOrTerminal}</span>}</td>
          <td className="centered"><strong>{request.service.tugboatsRequired}</strong></td>
          <td><ServicePriorityBadge priority={request.priority} /></td><td><ServiceRequestStatusBadge status={request.status} /></td>
          <td>{request.assignedMarketingRepresentative || '—'}</td>
          <td><ServiceRequestActionsMenu request={request} open={openMenu === request.id} onOpenChange={(open) => setOpenMenu(open ? request.id : null)} onView={() => navigate(`/marketing/service-requests/${request.id}`)} onEdit={() => onNotify('Service request editing will be implemented next.')} onQuotation={() => onNotify('Quotation creation will be implemented next.')} onAppointment={() => onNotify('Appointment scheduling will be implemented next.')} onDuplicate={() => setDuplicateTarget(request)} onCancel={() => setCancelTarget(request)} /></td>
        </tr>)}</tbody></table></div>
        <footer className="service-request-pagination"><span>{filtered.length ? `Showing ${start + 1}–${Math.min(start + rowsPerPage, filtered.length)} of ${filtered.length} service requests` : 'Showing 0 service requests'}</span><div><label>Rows per page <select value={rowsPerPage} onChange={(event) => { setRowsPerPage(Number(event.target.value)); setPage(1) }}><option>10</option><option>25</option><option>50</option></select></label>{totalPages > 1 && <><button type="button" disabled={currentPage === 1} onClick={() => setPage((value) => value - 1)}>Previous</button><span>Page {currentPage} of {totalPages}</span><button type="button" disabled={currentPage === totalPages} onClick={() => setPage((value) => value + 1)}>Next</button></>}</div></footer>
      </>}
    </div>
    {duplicateTarget && <DuplicateServiceRequestDialog reference={duplicateTarget.referenceNumber} onClose={() => setDuplicateTarget(null)} onConfirm={duplicate} />}
    {cancelTarget && <CancelServiceRequestDialog onClose={() => setCancelTarget(null)} onConfirm={cancel} />}
  </section>
}
