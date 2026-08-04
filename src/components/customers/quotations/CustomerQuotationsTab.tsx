import { BadgeCheck, CalendarClock, Clock3, FilePlus2, ReceiptText, Search } from 'lucide-react'
import { useDeferredValue, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { QUOTATION_STATUSES } from '../../../data/quotationOptions'
import { SERVICE_TYPES } from '../../../data/serviceRequestOptions'
import { customerContactRepository } from '../../../repositories/customerContactRepository'
import { quotationRepository } from '../../../repositories/quotationRepository'
import { serviceRequestRepository } from '../../../repositories/serviceRequestRepository'
import type { Customer } from '../../../types/customer'
import type { EffectiveQuotationStatus, Quotation, QuotationResponse } from '../../../types/quotation'
import { formatCurrency } from '../../../utils/formatCurrency'
import { getEffectiveQuotationStatus } from '../../../utils/quotationStatus'
import { getQuotationValidity } from '../../../utils/quotationValidity'
import { QuotationActionsMenu } from './QuotationActionsMenu'
import { CreateRevisionDialog, RecordCustomerResponseDialog, SelectServiceRequestDialog, SendQuotationDialog, SubmitQuotationDialog } from './QuotationDialogs'
import { QuotationStatusBadge } from './QuotationStatusBadge'

interface Props { customer: Customer; onNotify: (message: string) => void }
type ValidityFilter = '' | 'active' | 'expiring' | 'expired'
type DateFilter = '' | 'month' | '30-days' | 'year'
type DialogState = { type: 'select' } | { type: 'submit' | 'send' | 'response' | 'revision'; quotation: Quotation } | null
const ACTIVE_QUOTATION_STATUSES: EffectiveQuotationStatus[] = ['Draft', 'For Internal Approval', 'Ready to Send', 'Sent', 'Viewed', 'Customer Approved']
const dateFormatter = new Intl.DateTimeFormat('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })
const displayDate = (value?: string) => value ? dateFormatter.format(new Date(value)) : 'Not issued'

const matchesDate = (value: string, filter: DateFilter) => {
  if (!filter) return true
  const date = new Date(value); const now = new Date()
  if (filter === 'month') return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth()
  if (filter === 'year') return date.getFullYear() === now.getFullYear()
  const start = new Date(now); start.setDate(start.getDate() - 30)
  return date >= start && date <= now
}

export function CustomerQuotationsTab({ customer, onNotify }: Props) {
  const navigate = useNavigate()
  const [quotations, setQuotations] = useState(() => quotationRepository.getByCustomerId(customer.id))
  const requests = serviceRequestRepository.getByCustomerId(customer.id)
  const requestMap = new Map(requests.map((request) => [request.id, request]))
  const contacts = customerContactRepository.getByCustomer(customer.id)
  const approvers = contacts.filter((contact) => contact.status === 'Active' && contact.authorizations.canApproveQuotations)
  const [search, setSearch] = useState(''); const deferredSearch = useDeferredValue(search.trim().toLowerCase())
  const [status, setStatus] = useState<'' | EffectiveQuotationStatus>(''); const [service, setService] = useState(''); const [validity, setValidity] = useState<ValidityFilter>(''); const [dateFilter, setDateFilter] = useState<DateFilter>('')
  const [page, setPage] = useState(1); const [rowsPerPage, setRowsPerPage] = useState(10); const [openMenu, setOpenMenu] = useState<string | null>(null); const [dialog, setDialog] = useState<DialogState>(null)
  const refresh = () => setQuotations(quotationRepository.getByCustomerId(customer.id))

  const rows = quotations.map((quotation) => {
    const request = requestMap.get(quotation.serviceRequestId)
    return { quotation, request, effectiveStatus: getEffectiveQuotationStatus(quotation), validity: getQuotationValidity(quotation) }
  })
  const filtered = rows.filter(({ quotation, request, effectiveStatus, validity: validityState }) => {
    const searchable = [quotation.quotationNumber, quotation.revisionNumber, request?.referenceNumber, request?.vessel.name, quotation.vesselName, request?.service.type, quotation.serviceType, request?.service.purchaseOrderReference, quotation.purchaseOrderReference].filter((value) => value !== undefined).join(' ').toLowerCase()
    const validityMatch = !validity || (validity === 'active' ? validityState.classification === 'Valid' : validity === 'expiring' ? validityState.classification === 'Expiring Soon' : validityState.classification === 'Expired')
    return (!deferredSearch || searchable.includes(deferredSearch)) && (!status || effectiveStatus === status) && (!service || (request?.service.type ?? quotation.serviceType) === service) && validityMatch && matchesDate(quotation.createdAt, dateFilter)
  })
  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage)); const currentPage = Math.min(page, totalPages); const start = (currentPage - 1) * rowsPerPage; const visible = filtered.slice(start, start + rowsPerPage)
  const filtersActive = Boolean(search || status || service || validity || dateFilter)
  const clear = () => { setSearch(''); setStatus(''); setService(''); setValidity(''); setDateFilter(''); setPage(1) }
  const expiringSoon = rows.filter(({ effectiveStatus, validity: state }) => ['Sent', 'Viewed'].includes(effectiveStatus) && state.classification === 'Expiring Soon').length
  const activeQuotationRequests = new Set(quotations.filter((quotation) => ACTIVE_QUOTATION_STATUSES.includes(getEffectiveQuotationStatus(quotation))).map((quotation) => quotation.serviceRequestId))
  const eligibleRequests = requests.filter((request) => !['Draft', 'Cancelled', 'Completed'].includes(request.status) && !activeQuotationRequests.has(request.id))

  const submit = (quotation: Quotation) => { if (quotationRepository.submitForInternalApproval(quotation.id)) { refresh(); onNotify('Quotation submitted for internal approval.') } setDialog(null) }
  const send = (quotation: Quotation, contactId: string) => { if (quotationRepository.markAsSent(quotation.id, contactId)) { refresh(); onNotify('Quotation marked as sent to the customer.') } setDialog(null) }
  const respond = (quotation: Quotation, response: QuotationResponse) => {
    if (quotationRepository.recordCustomerResponse(quotation.id, response)) { refresh(); onNotify(response.type === 'Customer Approved' ? 'Customer approval recorded.' : response.type === 'Rejected' ? 'Customer rejection recorded.' : 'A new quotation revision was created.') }
    setDialog(null)
  }
  const revise = (quotation: Quotation, reason: string) => { if (quotationRepository.createRevision(quotation.id, reason)) { refresh(); onNotify('Quotation revision created as draft.') } setDialog(null) }

  return <section className="quotations-tab" aria-labelledby="customer-quotations-title">
    <header className="quotations-tab-header"><h2 id="customer-quotations-title">Quotations</h2><button className="button button-primary" type="button" onClick={() => setDialog({ type: 'select' })}><FilePlus2 size={15} />Create Quotation</button></header>
    <div className="quotation-summary" aria-label="Quotation summary"><div><ReceiptText /><span>Total Quotations</span><strong>{quotations.length}</strong></div><div><Clock3 /><span>Awaiting Response</span><strong>{rows.filter((row) => ['Sent', 'Viewed'].includes(row.effectiveStatus)).length}</strong></div><div><BadgeCheck /><span>Customer Approved</span><strong>{rows.filter((row) => row.effectiveStatus === 'Customer Approved').length}</strong></div><div><CalendarClock /><span>Expiring Soon</span><strong>{expiringSoon}</strong></div></div>
    <div className="quotation-directory">
      <div className="quotation-filters"><label className="customer-search"><Search size={14} /><span className="sr-only">Search quotations</span><input value={search} placeholder="Search by quotation, request, vessel, or service" onChange={(event) => { setSearch(event.target.value); setPage(1) }} /></label><label><span className="sr-only">Status</span><select value={status} onChange={(event) => { setStatus(event.target.value as '' | EffectiveQuotationStatus); setPage(1) }}><option value="">All Statuses</option>{QUOTATION_STATUSES.map((item) => <option key={item}>{item}</option>)}</select></label><label><span className="sr-only">Service type</span><select value={service} onChange={(event) => { setService(event.target.value); setPage(1) }}><option value="">All Services</option>{SERVICE_TYPES.map((item) => <option key={item}>{item}</option>)}</select></label><label><span className="sr-only">Validity</span><select value={validity} onChange={(event) => { setValidity(event.target.value as ValidityFilter); setPage(1) }}><option value="">All Validity</option><option value="active">Active</option><option value="expiring">Expiring Soon</option><option value="expired">Expired</option></select></label><label><span className="sr-only">Prepared date</span><select value={dateFilter} onChange={(event) => { setDateFilter(event.target.value as DateFilter); setPage(1) }}><option value="">All Dates</option><option value="month">This Month</option><option value="30-days">Last 30 Days</option><option value="year">This Year</option></select></label><button className="clear-filters" type="button" disabled={!filtersActive} onClick={clear}>Clear Filters</button></div>
      {!quotations.length ? <div className="quotation-empty"><ReceiptText size={34} /><h3>No quotations have been prepared for this customer.</h3><p>Create a quotation from an eligible service request.</p><button className="button button-primary" type="button" onClick={() => setDialog({ type: 'select' })}><FilePlus2 size={15} />Create Quotation</button></div> : !filtered.length ? <div className="quotation-empty"><Search size={34} /><h3>No quotations match your search or selected filters.</h3><button className="button button-secondary" type="button" onClick={clear}>Clear Filters</button></div> : <><div className="quotation-table-scroll"><table className="quotation-table"><thead><tr><th scope="col">Quotation</th><th scope="col">Related Request</th><th scope="col">Service</th><th scope="col">Date Issued</th><th scope="col">Valid Until</th><th scope="col" className="amount-column">Amount</th><th scope="col">Status</th><th scope="col">Prepared By</th><th scope="col"><span className="sr-only">Actions</span></th></tr></thead><tbody>{visible.map(({ quotation, request, effectiveStatus, validity: validityState }) => <tr key={quotation.id}><td><Link className="quotation-reference" to={`/marketing/quotations/${quotation.id}`} aria-label={`View quotation ${quotation.quotationNumber}`}>{quotation.quotationNumber}</Link>{quotation.revisionNumber > 1 && <span>Revision {quotation.revisionNumber}</span>}</td><td>{request ? <Link to={`/marketing/service-requests/${request.id}`}>{request.referenceNumber}</Link> : '—'}</td><td><strong>{request?.service.type ?? quotation.serviceType ?? '—'}</strong><span>{request?.vessel.name ?? quotation.vesselName ?? '—'}</span></td><td>{displayDate(quotation.issuedAt ?? quotation.sentAt)}</td><td><strong>{quotation.validUntil ? displayDate(quotation.validUntil) : 'Not set'}</strong><span className={`quotation-validity validity-${validityState.classification.toLowerCase().replaceAll(' ', '-')}`}>{validityState.label}</span></td><td className="amount-column">{formatCurrency(quotation.totalAmount)}</td><td><QuotationStatusBadge status={effectiveStatus} /></td><td>{quotation.preparedBy}</td><td><QuotationActionsMenu quotation={quotation} status={effectiveStatus} open={openMenu === quotation.id} onOpenChange={(open) => setOpenMenu(open ? quotation.id : null)} onView={() => navigate(`/marketing/quotations/${quotation.id}`)} onEdit={() => onNotify('Quotation editing will be implemented next.')} onSubmit={() => setDialog({ type: 'submit', quotation })} onSend={() => setDialog({ type: 'send', quotation })} onResponse={() => setDialog({ type: 'response', quotation })} onRevision={() => setDialog({ type: 'revision', quotation })} onDownload={() => onNotify('Quotation PDF generation will be implemented later.')} onContract={() => onNotify('Contract creation will be implemented next.')} /></td></tr>)}</tbody></table></div><footer className="quotation-pagination"><span>Showing {start + 1}–{Math.min(start + rowsPerPage, filtered.length)} of {filtered.length} quotations</span><div><label>Rows per page <select value={rowsPerPage} onChange={(event) => { setRowsPerPage(Number(event.target.value)); setPage(1) }}><option>10</option><option>25</option><option>50</option></select></label>{totalPages > 1 && <><button type="button" disabled={currentPage === 1} onClick={() => setPage((value) => value - 1)}>Previous</button><span>Page {currentPage} of {totalPages}</span><button type="button" disabled={currentPage === totalPages} onClick={() => setPage((value) => value + 1)}>Next</button></>}</div></footer></>}
    </div>
    {dialog?.type === 'select' && <SelectServiceRequestDialog requests={eligibleRequests} customerId={customer.id} onClose={() => setDialog(null)} onContinue={(requestId) => navigate(`/marketing/quotations/new?customerId=${encodeURIComponent(customer.id)}&serviceRequestId=${encodeURIComponent(requestId)}`)} />}
    {dialog?.type === 'submit' && <SubmitQuotationDialog quotation={dialog.quotation} onClose={() => setDialog(null)} onConfirm={() => submit(dialog.quotation)} />}
    {dialog?.type === 'send' && <SendQuotationDialog quotation={dialog.quotation} customer={customer} contacts={approvers} onClose={() => setDialog(null)} onConfirm={(contactId) => send(dialog.quotation, contactId)} />}
    {dialog?.type === 'response' && <RecordCustomerResponseDialog contacts={approvers} onClose={() => setDialog(null)} onConfirm={(response) => respond(dialog.quotation, response)} />}
    {dialog?.type === 'revision' && <CreateRevisionDialog onClose={() => setDialog(null)} onConfirm={(reason) => revise(dialog.quotation, reason)} />}
  </section>
}
