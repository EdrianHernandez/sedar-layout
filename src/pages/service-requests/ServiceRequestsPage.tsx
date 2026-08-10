import { ClipboardList, Download, Plus, Search, ShipWheel, SlidersHorizontal, TriangleAlert, UserRoundCheck } from 'lucide-react'
import { useDeferredValue, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AssignRepresentativeDialog, CancelRequestDialog, DuplicateRequestDialog, RespondOperationsDialog, SubmitOperationsDialog } from '../../components/service-requests/GlobalServiceRequestDialogs'
import { GlobalServiceRequestActionsMenu } from '../../components/service-requests/GlobalServiceRequestActionsMenu'
import { OperationsReviewBadge, ServicePriorityBadge, ServiceRequestStatusBadge } from '../../components/service-requests/ServiceRequestBadges'
import { initialCustomers } from '../../data/customerMockData'
import { OPERATIONS_REVIEW_STATUSES, SERVICE_PRIORITIES, SERVICE_REQUEST_STATUSES, SERVICE_TYPES } from '../../data/serviceRequestOptions'
import { customerContactRepository } from '../../repositories/customerContactRepository'
import { quotationRepository } from '../../repositories/quotationRepository'
import { serviceRequestRepository } from '../../repositories/serviceRequestRepository'
import { PROTOTYPE_ACTIVITY_ACTOR } from '../../types/customerActivity'
import type { OperationsReviewStatus, ServicePriority, ServiceRequest, ServiceRequestStatus } from '../../types/serviceRequest'

interface Props { onNotify: (message: string) => void }
type QuickTab = 'all' | 'mine' | 'drafts' | 'review' | 'scheduled' | 'completed'
type KpiFilter = '' | 'open' | 'operations' | 'customer' | 'urgent'
type DateFilter = '' | 'today' | 'week' | 'month' | 'custom'
type SortKey = 'reference' | 'customer' | 'schedule' | 'priority' | 'status' | 'updated'
type SortDirection = 'asc' | 'desc'
type DialogState = { kind: 'assign' | 'submit' | 'respond' | 'duplicate' | 'cancel'; request: ServiceRequest } | null
type RequestAction = 'view' | 'edit' | 'assign' | 'submit' | 'respond' | 'quotation' | 'appointment' | 'duplicate' | 'cancel'

const dateFormatter = new Intl.DateTimeFormat('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })
const exactFormatter = new Intl.DateTimeFormat('en-PH', { dateStyle: 'medium', timeStyle: 'short' })
const formatDate = (value: string) => value ? dateFormatter.format(new Date(`${value}T00:00:00`)) : 'Not scheduled'
const formatTime = (value: string) => value ? new Intl.DateTimeFormat('en-PH', { hour: 'numeric', minute: '2-digit' }).format(new Date(`2026-01-01T${value}:00`)) : 'Time not set'
const relativeTime = (value: string) => {
  const seconds = Math.round((new Date(value).getTime() - Date.now()) / 1000)
  const formatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
  const units: [Intl.RelativeTimeFormatUnit, number][] = [['year', 31536000], ['month', 2592000], ['week', 604800], ['day', 86400], ['hour', 3600], ['minute', 60]]
  const [unit, size] = units.find(([, size]) => Math.abs(seconds) >= size) ?? ['second', 1]
  return formatter.format(Math.round(seconds / size), unit)
}
const priorityRank: Record<ServicePriority, number> = { Normal: 0, High: 1, Urgent: 2, Emergency: 3 }
const statusRank: Record<ServiceRequestStatus, number> = Object.fromEntries(SERVICE_REQUEST_STATUSES.map((status, index) => [status, index])) as Record<ServiceRequestStatus, number>
const isOpen = (request: ServiceRequest) => !['Completed', 'Cancelled'].includes(request.status)
const reviewStatus = (request: ServiceRequest): OperationsReviewStatus => request.operationsReview?.status ?? 'Not Submitted'
const isAwaitingOperations = (request: ServiceRequest) => request.status === 'Awaiting Operations' || ['Awaiting Review', 'More Information Required'].includes(reviewStatus(request))
const isAwaitingCustomer = (request: ServiceRequest) => request.status === 'Awaiting Customer Approval' || Boolean(request.waitingForCustomerInformation)
const isUrgent = (request: ServiceRequest) => isOpen(request) && ['Urgent', 'Emergency'].includes(request.priority)
const activeQuotationStatuses = new Set(['Draft', 'For Internal Approval', 'Ready to Send', 'Sent', 'Viewed', 'Customer Approved'])

export function ServiceRequestsPage({ onNotify }: Props) {
  const navigate = useNavigate()
  const [requests, setRequests] = useState(() => serviceRequestRepository.getAll())
  const [quickTab, setQuickTab] = useState<QuickTab>('all')
  const [kpiFilter, setKpiFilter] = useState<KpiFilter>('')
  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search.trim().toLowerCase())
  const [status, setStatus] = useState<'' | ServiceRequestStatus>('')
  const [review, setReview] = useState<'' | OperationsReviewStatus>('')
  const [priority, setPriority] = useState<'' | ServicePriority>('')
  const [serviceType, setServiceType] = useState('')
  const [representative, setRepresentative] = useState('')
  const [dateFilter, setDateFilter] = useState<DateFilter>('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [location, setLocation] = useState('')
  const [dateError, setDateError] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('updated')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [dialog, setDialog] = useState<DialogState>(null)
  const [showFilters, setShowFilters] = useState(false)

  const customers = new Map(initialCustomers.map((customer) => [customer.id, customer]))
  const contacts = new Map(customerContactRepository.getAll().map((contact) => [contact.id, contact]))
  const quotations = quotationRepository.getAll()
  const hasActiveQuotation = (requestId: string) => quotations.some((quotation) => quotation.serviceRequestId === requestId && activeQuotationStatuses.has(quotation.status))
  const representatives = [...new Set([...initialCustomers.map((customer) => customer.assignedRepresentative), ...requests.map((request) => request.assignedMarketingRepresentative)].filter(Boolean))].sort()
  const locations = [...new Set(requests.map((request) => request.schedule.portOrOperatingArea).filter(Boolean))].sort()
  const customerName = (request: ServiceRequest) => customers.get(request.customerId)?.companyName ?? request.customerId
  const contactName = (request: ServiceRequest) => { const contact = contacts.get(request.contactId); return contact ? `${contact.firstName} ${contact.lastName}` : 'Contact unavailable' }
  const contactEmail = (request: ServiceRequest) => contacts.get(request.contactId)?.email ?? ''

  const quickCounts: Record<QuickTab, number> = {
    all: requests.length,
    mine: requests.filter((request) => request.assignedMarketingRepresentative === PROTOTYPE_ACTIVITY_ACTOR.name).length,
    drafts: requests.filter((request) => request.status === 'Draft').length,
    review: requests.filter((request) => ['Under Review', 'Awaiting Operations'].includes(request.status) || reviewStatus(request) === 'More Information Required').length,
    scheduled: requests.filter((request) => request.status === 'Scheduled').length,
    completed: requests.filter((request) => request.status === 'Completed').length,
  }
  const quickTabs: { key: QuickTab; label: string }[] = [{ key: 'all', label: 'All Requests' }, { key: 'mine', label: 'My Requests' }, { key: 'drafts', label: 'Drafts' }, { key: 'review', label: 'In Review' }, { key: 'scheduled', label: 'Scheduled' }, { key: 'completed', label: 'Completed' }]
  const kpis = [
    { key: 'open' as const, label: 'Open Requests', value: requests.filter(isOpen).length, icon: ClipboardList },
    { key: 'operations' as const, label: 'Awaiting Operations', value: requests.filter(isAwaitingOperations).length, icon: ShipWheel },
    { key: 'customer' as const, label: 'Awaiting Customer', value: requests.filter(isAwaitingCustomer).length, icon: UserRoundCheck },
    { key: 'urgent' as const, label: 'Urgent and Emergency', value: requests.filter(isUrgent).length, icon: TriangleAlert },
  ]

  const now = new Date(); now.setHours(0, 0, 0, 0)
  const dateMatches = (request: ServiceRequest) => {
    if (!dateFilter) return true
    if (!request.schedule.requestedDate) return false
    const date = new Date(`${request.schedule.requestedDate}T00:00:00`)
    if (dateFilter === 'today') return date.getTime() === now.getTime()
    if (dateFilter === 'week') { const end = new Date(now); end.setDate(now.getDate() + 6); return date >= now && date <= end }
    if (dateFilter === 'month') return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth()
    return (!startDate || request.schedule.requestedDate >= startDate) && (!endDate || request.schedule.requestedDate <= endDate)
  }
  const quickMatches = (request: ServiceRequest) => quickTab === 'all' || (quickTab === 'mine' && request.assignedMarketingRepresentative === PROTOTYPE_ACTIVITY_ACTOR.name) || (quickTab === 'drafts' && request.status === 'Draft') || (quickTab === 'review' && (['Under Review', 'Awaiting Operations'].includes(request.status) || reviewStatus(request) === 'More Information Required')) || (quickTab === 'scheduled' && request.status === 'Scheduled') || (quickTab === 'completed' && request.status === 'Completed')
  const kpiMatches = (request: ServiceRequest) => !kpiFilter || (kpiFilter === 'open' && isOpen(request)) || (kpiFilter === 'operations' && isAwaitingOperations(request)) || (kpiFilter === 'customer' && isAwaitingCustomer(request)) || (kpiFilter === 'urgent' && isUrgent(request))
  const filtered = requests.filter((request) => {
    const searchable = [request.referenceNumber, customerName(request), contactName(request), contactEmail(request), request.vessel.name, request.vessel.imoNumber, request.vessel.type, request.service.type, request.schedule.portOrOperatingArea, request.schedule.berthOrTerminal, request.schedule.origin, request.schedule.destination, request.service.contractReference, request.service.purchaseOrderReference].filter(Boolean).join(' ').toLowerCase()
    return quickMatches(request) && kpiMatches(request) && (!deferredSearch || searchable.includes(deferredSearch)) && (!status || request.status === status) && (!review || reviewStatus(request) === review) && (!priority || request.priority === priority) && (!serviceType || request.service.type === serviceType) && (!representative || (representative === 'Unassigned' ? !request.assignedMarketingRepresentative : request.assignedMarketingRepresentative === representative)) && dateMatches(request) && (!location || request.schedule.portOrOperatingArea === location)
  })
  const defaultSort = (a: ServiceRequest, b: ServiceRequest) => {
    const openEmergency = Number(isOpen(b) && b.priority === 'Emergency') - Number(isOpen(a) && a.priority === 'Emergency'); if (openEmergency) return openEmergency
    const openUrgent = Number(isOpen(b) && b.priority === 'Urgent') - Number(isOpen(a) && a.priority === 'Urgent'); if (openUrgent) return openUrgent
    const aDate = a.schedule.requestedDate || '9999-12-31'; const bDate = b.schedule.requestedDate || '9999-12-31'; if (aDate !== bDate) return aDate.localeCompare(bDate)
    return b.updatedAt.localeCompare(a.updatedAt)
  }
  const sorted = [...filtered].sort((a, b) => {
    if (sortKey === 'updated' && sortDirection === 'desc') return defaultSort(a, b)
    const values: Record<SortKey, [string | number, string | number]> = { reference: [a.referenceNumber, b.referenceNumber], customer: [customerName(a), customerName(b)], schedule: [a.schedule.requestedDate || '9999', b.schedule.requestedDate || '9999'], priority: [priorityRank[a.priority], priorityRank[b.priority]], status: [statusRank[a.status], statusRank[b.status]], updated: [a.updatedAt, b.updatedAt] }
    const [left, right] = values[sortKey]
    const result = typeof left === 'number' ? left - Number(right) : left.localeCompare(String(right))
    return sortDirection === 'asc' ? result : -result
  })
  const totalPages = Math.max(1, Math.ceil(sorted.length / rowsPerPage))
  const currentPage = Math.min(page, totalPages)
  const start = (currentPage - 1) * rowsPerPage
  const visible = sorted.slice(start, start + rowsPerPage)
  const filtersActive = Boolean(search || status || review || priority || serviceType || representative || dateFilter || location || kpiFilter || quickTab !== 'all')
  const activeFilterCount = [status, review, priority, serviceType, representative, dateFilter, location].filter(Boolean).length

  const resetPage = () => setPage(1)
  const clearFilters = () => { setSearch(''); setStatus(''); setReview(''); setPriority(''); setServiceType(''); setRepresentative(''); setDateFilter(''); setStartDate(''); setEndDate(''); setLocation(''); setKpiFilter(''); setQuickTab('all'); setDateError(''); setPage(1) }
  const refresh = () => setRequests(serviceRequestRepository.getAll())
  const setSort = (next: SortKey) => { if (sortKey === next) setSortDirection((direction) => direction === 'asc' ? 'desc' : 'asc'); else { setSortKey(next); setSortDirection(next === 'updated' || next === 'priority' ? 'desc' : 'asc') } }
  const validateSubmission = (request: ServiceRequest) => {
    const contact = contacts.get(request.contactId)
    if (!contact || contact.status !== 'Active') return 'An active customer contact is required.'
    if (!request.vessel.name || !request.vessel.type) return 'Complete the vessel information before submission.'
    if (!request.service.type || !request.service.description.trim()) return 'Complete the service type and description before submission.'
    if (!request.schedule.requestedDate || !request.schedule.requestedTime || !request.schedule.portOrOperatingArea) return 'Complete the requested schedule and location before submission.'
    if (!Number.isInteger(request.service.tugboatsRequired) || request.service.tugboatsRequired < 1) return 'Enter a valid tugboat count before submission.'
    return ''
  }
  const handleAction = (request: ServiceRequest, action: RequestAction) => {
    if (action === 'view') navigate(`/marketing/service-requests/${request.id}`)
    else if (action === 'edit') onNotify('Service Request editing will be implemented next.')
    else if (action === 'quotation') { if (request.operationsReview?.status === 'Feasible with Conditions' && request.operationsReview.conditions) onNotify(`Operations conditions: ${request.operationsReview.conditions}`); navigate(`/marketing/quotations/new?customerId=${request.customerId}&serviceRequestId=${request.id}`) }
    else if (action === 'appointment') navigate(`/marketing/appointments?customerId=${request.customerId}&contactId=${request.contactId}&relatedType=Service%20Request&relatedId=${request.id}`)
    else setDialog({ kind: action, request })
  }
  const confirmDialog = (callback: () => void) => { callback(); setDialog(null); refresh() }

  return <div className="global-service-requests-page">
    <header className="dashboard-header global-request-header"><div><h1>Service Requests</h1><p>Review and coordinate customer tug-service requests.</p></div><div className="header-actions"><button className="button button-secondary" type="button" onClick={() => onNotify('Service Request export will be implemented later.')}><Download size={15} />Export</button><Link className="button button-primary" to="/marketing/service-requests/new"><Plus size={15} />New Service Request</Link></div></header>
    <section className="global-request-kpis" aria-label="Service Request summary filters">{kpis.map(({ key, label, value, icon: Icon }) => <button key={key} className={kpiFilter === key ? 'active' : ''} type="button" aria-label={`Filter table by ${label}`} aria-pressed={kpiFilter === key} onClick={() => { setKpiFilter((current) => current === key ? '' : key); resetPage() }}><span>{label}</span><strong>{value}</strong><Icon aria-hidden="true" /></button>)}</section>
    <section className="global-request-workspace" aria-labelledby="service-request-directory-title">
      <h2 className="sr-only" id="service-request-directory-title">Service Request Directory</h2>
      <div className="global-request-tabs" role="tablist" aria-label="Service Request quick views">{quickTabs.map(({ key, label }) => <button key={key} role="tab" aria-selected={quickTab === key} className={quickTab === key ? 'active' : ''} onClick={() => { setQuickTab(key); resetPage() }}>{label}<span>{quickCounts[key]}</span></button>)}</div>
      <div className="global-request-filters">
        <div className="global-request-filters-row">
          <label className="customer-search global-request-search"><Search size={15} /><span className="sr-only">Search Service Requests</span><input value={search} placeholder="Search by reference, customer, vessel, service, or location" onChange={(event) => { setSearch(event.target.value); resetPage() }} /></label>
          <button className={`global-request-filter-toggle${showFilters ? ' active' : ''}`} type="button" onClick={() => setShowFilters((value) => !value)} aria-label="Toggle filters" aria-expanded={showFilters}><SlidersHorizontal size={14} />{activeFilterCount > 0 && <span className="global-request-filter-badge">{activeFilterCount}</span>}</button>
        </div>
        {showFilters && <div className="global-request-filters-row">
          <label><span className="sr-only">Status</span><select value={status} onChange={(event) => { setStatus(event.target.value as '' | ServiceRequestStatus); resetPage() }}><option value="">Status</option>{SERVICE_REQUEST_STATUSES.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label><span className="sr-only">Review</span><select value={review} onChange={(event) => { setReview(event.target.value as '' | OperationsReviewStatus); resetPage() }}><option value="">Review</option>{OPERATIONS_REVIEW_STATUSES.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label><span className="sr-only">Priority</span><select value={priority} onChange={(event) => { setPriority(event.target.value as '' | ServicePriority); resetPage() }}><option value="">Priority</option>{SERVICE_PRIORITIES.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label><span className="sr-only">Service</span><select value={serviceType} onChange={(event) => { setServiceType(event.target.value); resetPage() }}><option value="">Service</option>{SERVICE_TYPES.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label><span className="sr-only">Rep</span><select value={representative} onChange={(event) => { setRepresentative(event.target.value); resetPage() }}><option value="">Rep</option><option>Unassigned</option>{representatives.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label><span className="sr-only">Date</span><select value={dateFilter} onChange={(event) => { setDateFilter(event.target.value as DateFilter); setDateError(''); resetPage() }}><option value="">Date</option><option value="today">Today</option><option value="week">This Week</option><option value="month">This Month</option><option value="custom">Custom Range</option></select></label>
          <label><span className="sr-only">Location</span><select value={location} onChange={(event) => { setLocation(event.target.value); resetPage() }}><option value="">Location</option>{locations.map((item) => <option key={item}>{item}</option>)}</select></label>
          <button className="clear-filters" type="button" disabled={!filtersActive} onClick={clearFilters}>Clear</button>
        </div>}
      </div>
      {dateFilter === 'custom' && <div className="global-request-date-range"><label>Start Date<input type="date" value={startDate} aria-invalid={Boolean(dateError)} onChange={(event) => { setStartDate(event.target.value); if (endDate && event.target.value && endDate < event.target.value) setDateError('End Date cannot occur before Start Date.'); else setDateError(''); resetPage() }} /></label><label>End Date<input type="date" value={endDate} min={startDate || undefined} aria-invalid={Boolean(dateError)} aria-describedby={dateError ? 'global-request-date-error' : undefined} onChange={(event) => { setEndDate(event.target.value); if (startDate && event.target.value && event.target.value < startDate) setDateError('End Date cannot occur before Start Date.'); else setDateError(''); resetPage() }} /></label>{dateError && <p id="global-request-date-error" role="alert">{dateError}</p>}</div>}
      {requests.length === 0 ? <div className="service-request-empty"><ClipboardList size={34} /><h3>No Service Requests have been created.</h3><p>Create a Service Request to begin coordinating customer tug services.</p><Link className="button button-primary" to="/marketing/service-requests/new"><Plus size={15} />New Service Request</Link></div> : sorted.length === 0 ? <div className="service-request-empty"><Search size={34} /><h3>No Service Requests match your search or selected filters.</h3><button className="button button-secondary" onClick={clearFilters}>Clear Filters</button></div> : <>
        <div className="global-request-table-scroll"><table className="global-request-table"><thead><tr>{([['reference', 'Reference'], ['customer', 'Customer'], ['', 'Vessel'], ['', 'Service'], ['schedule', 'Schedule'], ['', 'Location'], ['', 'Tugboats'], ['priority', 'Priority'], ['status', 'Status'], ['', 'Assigned To'], ['updated', 'Updated'], ['', 'Actions']] as [SortKey | '', string][]).map(([key, label]) => <th key={label} scope="col" aria-sort={key && sortKey === key ? (sortDirection === 'asc' ? 'ascending' : 'descending') : undefined}>{key ? <button type="button" onClick={() => setSort(key)}>{label}<span aria-hidden="true">{sortKey === key ? (sortDirection === 'asc' ? ' ↑' : ' ↓') : ''}</span></button> : label}</th>)}</tr></thead><tbody>{visible.map((request) => <tr key={request.id} onClick={() => navigate(`/marketing/service-requests/${request.id}`)} style={{ cursor: 'pointer' }}>
          <td><Link className="service-request-reference" to={`/marketing/service-requests/${request.id}`}>{request.referenceNumber}</Link></td>
          <td><Link className="global-request-customer" to={`/marketing/customers/${request.customerId}`}>{customerName(request)}</Link><span>{contactName(request)}</span></td>
          <td><strong>{request.vessel.name || '—'}</strong><span>{request.vessel.type || 'Type not set'}</span></td>
          <td><strong>{request.service.type || '—'}</strong>{request.service.preferredTugClass && <span>{request.service.preferredTugClass}</span>}</td>
          <td><strong>{formatDate(request.schedule.requestedDate)}</strong><span>{formatTime(request.schedule.requestedTime)}</span></td>
          <td><strong>{request.schedule.portOrOperatingArea || '—'}</strong><span>{request.schedule.berthOrTerminal || 'Berth not set'}</span></td>
          <td className="centered"><strong>{request.service.tugboatsRequired}</strong></td>
          <td><ServicePriorityBadge priority={request.priority} /></td>
          <td><ServiceRequestStatusBadge status={request.status} /><OperationsReviewBadge status={reviewStatus(request)} /></td>
          <td><strong>{request.assignedMarketingRepresentative || 'Unassigned'}</strong></td>
          <td><time dateTime={request.updatedAt} title={exactFormatter.format(new Date(request.updatedAt))}>{relativeTime(request.updatedAt)}</time></td>
          <td onClick={(e) => e.stopPropagation()}><GlobalServiceRequestActionsMenu request={request} hasActiveQuotation={hasActiveQuotation(request.id)} open={openMenu === request.id} onOpenChange={(open) => setOpenMenu(open ? request.id : null)} onAction={(action) => handleAction(request, action)} /></td>
        </tr>)}</tbody></table></div>
        <footer className="service-request-pagination"><span>{`Showing ${start + 1}–${Math.min(start + rowsPerPage, sorted.length)} of ${sorted.length} Service Requests`}</span><div><label>Rows per page <select value={rowsPerPage} onChange={(event) => { setRowsPerPage(Number(event.target.value)); resetPage() }}><option>10</option><option>25</option><option>50</option></select></label>{totalPages > 1 && <><button disabled={currentPage === 1} onClick={() => setPage((value) => value - 1)}>Previous</button><span>Page {currentPage} of {totalPages}</span><button disabled={currentPage === totalPages} onClick={() => setPage((value) => value + 1)}>Next</button></>}</div></footer>
      </>}
    </section>
    {dialog?.kind === 'assign' && <AssignRepresentativeDialog request={dialog.request} representatives={representatives} onClose={() => setDialog(null)} onConfirm={(name, notes) => confirmDialog(() => { serviceRequestRepository.assignRepresentative(dialog.request.id, name, notes); onNotify('Marketing representative updated.') })} />}
    {dialog?.kind === 'submit' && <SubmitOperationsDialog request={dialog.request} customerName={customerName(dialog.request)} contactName={contactName(dialog.request)} onClose={() => setDialog(null)} onConfirm={() => { const error = validateSubmission(dialog.request); if (error) { onNotify(error); setDialog(null); return } confirmDialog(() => { serviceRequestRepository.submitToOperations(dialog.request.id); onNotify('Service Request submitted to Tug Operations.') }) }} />}
    {dialog?.kind === 'respond' && <RespondOperationsDialog request={dialog.request} onClose={() => setDialog(null)} onConfirm={(response) => confirmDialog(() => { serviceRequestRepository.respondToInformationRequest(dialog.request.id, response); onNotify('Additional information submitted to Tug Operations.') })} />}
    {dialog?.kind === 'duplicate' && <DuplicateRequestDialog reference={dialog.request.referenceNumber} onClose={() => setDialog(null)} onConfirm={() => confirmDialog(() => { serviceRequestRepository.duplicate(dialog.request.id); onNotify('Service Request duplicated as draft.') })} />}
    {dialog?.kind === 'cancel' && <CancelRequestDialog onClose={() => setDialog(null)} onConfirm={(reason, explanation) => confirmDialog(() => { serviceRequestRepository.cancel(dialog.request.id, reason, explanation); onNotify('Service Request cancelled.') })} />}
  </div>
}
