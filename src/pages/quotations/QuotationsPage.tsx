import { CalendarClock, CheckCircle2, CircleDollarSign, Clock3, Download, FilePenLine, FilePlus2, Filter, ReceiptText, Search, Send, X } from 'lucide-react'
import { useDeferredValue, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { NewQuotationModal } from '../../components/quotations/NewQuotationModal'
import { EditQuotationModal } from '../../components/quotations/EditQuotationModal'
import { ApprovalStatusBadge, QuotationStatusBadge } from '../../components/quotations/QuotationBadges'
import { QuotationActionsMenu } from '../../components/quotations/QuotationActionsMenu'
import { RecordCustomerResponseDialog } from '../../components/customers/quotations/QuotationDialogs'
import { initialCustomers } from '../../data/customerMockData'
import { customerContactRepository } from '../../repositories/customerContactRepository'
import { quotationRepository } from '../../repositories/quotationRepository'
import { serviceRequestRepository } from '../../repositories/serviceRequestRepository'
import type { Quotation, QuotationResponse } from '../../types/quotation'
import { formatCurrency } from '../../utils/formatCurrency'
import { getQuotationValidity } from '../../utils/quotationValidity'
import { getInternalApprovalStatus, getQuotationDisplayStatus, isQuotationEligibleRequest, type QuotationAction, type QuotationDisplayStatus } from '../../utils/quotationWorkflow'

const dateFormatter = new Intl.DateTimeFormat('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
const formatDate = (value?: string) => value ? dateFormatter.format(new Date(value)) : 'Not set'
const customerName = (id: string) => initialCustomers.find((customer) => customer.id === id)?.companyName ?? id
const tabs: ('All' | QuotationDisplayStatus)[] = ['All', 'Draft', 'For Approval', 'Approved', 'Sent', 'Viewed', 'Changes Requested', 'Accepted', 'Rejected', 'Expired']
type ConfirmState = { quotation: Quotation; action: 'delete' | 'withdraw' | 'resend' | 'extend' } | null

export function QuotationsPage({ onNotify }: { onNotify: (message: string) => void }) {
  const navigate = useNavigate()
  const [quotations, setQuotations] = useState(() => quotationRepository.getAll())
  const [error, setError] = useState('')
  const [tab, setTab] = useState<(typeof tabs)[number]>('All')
  const [search, setSearch] = useState(''); const deferredSearch = useDeferredValue(search.trim().toLowerCase())
  const [status, setStatus] = useState(''); const [customer, setCustomer] = useState(''); const [service, setService] = useState(''); const [representative, setRepresentative] = useState(''); const [createdDate, setCreatedDate] = useState(''); const [validityDate, setValidityDate] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false); const [newOpen, setNewOpen] = useState(false); const [confirm, setConfirm] = useState<ConfirmState>(null); const [responseQuotation, setResponseQuotation] = useState<Quotation | null>(null); const [editQuotation, setEditQuotation] = useState<Quotation | null>(null)
  const requests = serviceRequestRepository.getAll(); const requestMap = new Map(requests.map((request) => [request.id, request]))
  const rows = quotations.map((quotation) => ({ quotation, request: requestMap.get(quotation.serviceRequestId), status: getQuotationDisplayStatus(quotation) }))
  const services = [...new Set(rows.map(({ quotation, request }) => request?.service.type ?? quotation.serviceType).filter((value): value is string => Boolean(value)))].sort()
  const representatives = [...new Set(quotations.map((quotation) => quotation.assignedRepresentativeId ?? quotation.preparedBy).filter(Boolean))].sort()
  const eligibleRequests = requests.filter((request) => isQuotationEligibleRequest(request, quotations))
  const filtersActive = Boolean(search || status || customer || service || representative || createdDate || validityDate || tab !== 'All')
  const filtered = rows.filter(({ quotation, request, status: displayStatus }) => {
    const customerLabel = customerName(quotation.customerId)
    const searchable = [quotation.quotationNumber, customerLabel, request?.vessel.name, quotation.vesselName, request?.referenceNumber, request?.service.type, quotation.serviceType].filter(Boolean).join(' ').toLowerCase()
    return (!deferredSearch || searchable.includes(deferredSearch)) && (tab === 'All' || displayStatus === tab) && (!status || displayStatus === status) && (!customer || quotation.customerId === customer) && (!service || (request?.service.type ?? quotation.serviceType) === service) && (!representative || (quotation.assignedRepresentativeId ?? quotation.preparedBy) === representative) && (!createdDate || quotation.createdAt.slice(0, 10) === createdDate) && (!validityDate || quotation.validUntil?.slice(0, 10) === validityDate)
  })
  const counts = new Map(tabs.map((item) => [item, item === 'All' ? rows.length : rows.filter((row) => row.status === item).length]))
  const expiring = rows.filter(({ quotation, status: item }) => ['Sent', 'Viewed'].includes(item) && getQuotationValidity(quotation).classification === 'Expiring Soon').length
  const summary = [
    { label: 'Total Quotations', value: quotations.length, icon: ReceiptText },
    { label: 'Drafts', value: counts.get('Draft') ?? 0, icon: FilePenLine },
    { label: 'Awaiting Internal Approval', value: counts.get('For Approval') ?? 0, icon: Clock3 },
    { label: 'Awaiting Customer Response', value: (counts.get('Sent') ?? 0) + (counts.get('Viewed') ?? 0), icon: Send },
    { label: 'Accepted', value: counts.get('Accepted') ?? 0, icon: CheckCircle2 },
    { label: 'Expiring Soon', value: expiring, icon: CalendarClock },
    { label: 'Total Quoted Value', value: formatCurrency(quotations.reduce((total, quotation) => total + quotation.totalAmount, 0)), icon: CircleDollarSign },
  ]
  const refresh = () => { try { setQuotations(quotationRepository.getAll()); setError('') } catch { setError('Quotation records could not be loaded.') } }
  const clear = () => { setSearch(''); setStatus(''); setCustomer(''); setService(''); setRepresentative(''); setCreatedDate(''); setValidityDate(''); setTab('All') }
  const download = (quotation: Quotation) => { const request = requestMap.get(quotation.serviceRequestId); const content = `${quotation.quotationNumber}\n${customerName(quotation.customerId)}\n${request?.service.type ?? quotation.serviceType ?? ''}\n${formatCurrency(quotation.totalAmount, quotation.currency)}`; const url = URL.createObjectURL(new Blob([content], { type: 'text/plain' })); const anchor = document.createElement('a'); anchor.href = url; anchor.download = `${quotation.quotationNumber}.txt`; anchor.click(); URL.revokeObjectURL(url) }
  const perform = (action: QuotationAction, quotation: Quotation) => {
    if (action === 'view' || action === 'feedback') navigate(`/marketing/quotations/${quotation.id}`)
    else if (action === 'edit') setEditQuotation(quotation)
    else if (action === 'request') navigate(`/marketing/service-requests/${quotation.serviceRequestId}`)
    else if (action === 'submit') { const updated = quotationRepository.submitForInternalApproval(quotation.id); refresh(); onNotify(updated ? 'Quotation submitted for Finance approval.' : 'Complete pricing, validity, descriptions, and terms before submission.') }
    else if (action === 'send') { const updated = quotationRepository.markAsSent(quotation.id); refresh(); onNotify(updated ? 'Quotation sent to the customer.' : 'Only internally approved quotations can be sent.') }
    else if (action === 'response') setResponseQuotation(quotation)
    else if (action === 'revision') { const revision = quotationRepository.createRevision(quotation.id, 'Revision prepared by Marketing.'); refresh(); if (revision) navigate(`/marketing/quotations/${revision.id}`) }
    else if (action === 'duplicate') { const copy = quotationRepository.duplicate(quotation.id); refresh(); if (copy) onNotify(`${copy.quotationNumber} created as a draft.`) }
    else if (action === 'download') download(quotation)
    else if (action === 'print') window.print()
    else if (['delete', 'withdraw', 'resend', 'extend'].includes(action)) setConfirm({ quotation, action: action as 'delete' | 'withdraw' | 'resend' | 'extend' })
    else if (action === 'contract') onNotify(quotationRepository.requestContractPreparation(quotation.id) ? 'Contract preparation request recorded for handoff.' : 'Contract preparation requires an accepted quotation.')
    else if (action === 'appointment') navigate('/marketing/appointments')
  }
  const confirmAction = () => { if (!confirm) return; const { quotation, action } = confirm; if (action === 'delete') quotationRepository.deleteDraft(quotation.id); if (action === 'withdraw') quotationRepository.withdrawApprovalRequest(quotation.id); if (action === 'resend') quotationRepository.update(quotation.id, { sentAt: new Date().toISOString() }); if (action === 'extend') { const next = new Date(); next.setDate(next.getDate() + 30); quotationRepository.extendValidity(quotation.id, next.toISOString().slice(0, 10)) } setConfirm(null); refresh(); onNotify(action === 'delete' ? 'Draft deleted.' : action === 'withdraw' ? 'Approval request withdrawn.' : action === 'resend' ? 'Quotation resent to the customer.' : 'Quotation validity extended by 30 days.') }
  const createDraft = (requestId: string) => { const quotation = quotationRepository.createFromServiceRequest(requestId); if (!quotation) { setError('This request is no longer eligible for quotation.'); setNewOpen(false); return } refresh(); setNewOpen(false); navigate(`/marketing/quotations/${quotation.id}`); onNotify(`${quotation.quotationNumber} created as a draft.`) }
  const exportCsv = () => { const csv = [['Quotation', 'Customer', 'Service Request', 'Status', 'Amount', 'Valid Until'], ...filtered.map(({ quotation, request, status: item }) => [quotation.quotationNumber, customerName(quotation.customerId), request?.referenceNumber ?? quotation.serviceRequestId, item, String(quotation.totalAmount), quotation.validUntil ?? ''])].map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(',')).join('\n'); const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'sedar-quotations.csv'; anchor.click(); URL.revokeObjectURL(url) }
  const filterFields = <><label><span>Status</span><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="">All statuses</option>{tabs.slice(1).map((item) => <option key={item}>{item}</option>)}</select></label><label><span>Customer</span><select value={customer} onChange={(event) => setCustomer(event.target.value)}><option value="">All customers</option>{initialCustomers.map((item) => <option key={item.id} value={item.id}>{item.companyName}</option>)}</select></label><label><span>Service type</span><select value={service} onChange={(event) => setService(event.target.value)}><option value="">All services</option>{services.map((item) => <option key={item}>{item}</option>)}</select></label><label><span>Representative</span><select value={representative} onChange={(event) => setRepresentative(event.target.value)}><option value="">All representatives</option>{representatives.map((item) => <option key={item}>{item}</option>)}</select></label><label><span>Created date</span><input type="date" value={createdDate} onChange={(event) => setCreatedDate(event.target.value)} /></label><label><span>Valid until</span><input type="date" value={validityDate} onChange={(event) => setValidityDate(event.target.value)} /></label></>
  return <main className="global-quotations-page"><header className="global-quotations-header"><div><h1>Quotations</h1><p>Prepare, send, and track commercial quotations for customer service requests.</p></div><div><button className="button button-secondary" type="button" onClick={exportCsv}><Download size={15} />Export</button><button className="button button-primary" type="button" onClick={() => setNewOpen(true)}><FilePlus2 size={15} />New Quotation</button></div></header>
    <section className="global-quotation-summary" aria-label="Quotation summary">{summary.map(({ label, value, icon: Icon }) => <article key={label}><Icon size={18} /><span>{label}</span><strong>{value}</strong></article>)}</section>
    <nav className="global-quotation-tabs" aria-label="Quotation statuses">{tabs.map((item) => <button key={item} type="button" className={tab === item ? 'active' : ''} aria-pressed={tab === item} onClick={() => setTab(item)}>{item}<span>{counts.get(item)}</span></button>)}</nav>
    <section className="global-quotation-directory"><div className="global-quotation-toolbar"><label className="global-quotation-search"><Search size={15} /><span className="sr-only">Search quotations</span><input value={search} placeholder="Search quotation, customer, vessel, request, or service" onChange={(event) => setSearch(event.target.value)} /></label><button className="button button-secondary mobile-quotation-filter" type="button" aria-expanded={filtersOpen} onClick={() => setFiltersOpen(!filtersOpen)}><Filter size={15} />Filters</button><div className={`global-quotation-filters ${filtersOpen ? 'open' : ''}`}>{filterFields}<button className="clear-filters" type="button" disabled={!filtersActive} onClick={clear}>Clear Filters</button></div></div><div className="quotation-result-count"><strong>{filtered.length}</strong> of {quotations.length} quotations</div>
      {error ? <div className="global-quotation-state"><X size={30} /><h2>Unable to load quotations</h2><p>{error}</p><button className="button button-secondary" type="button" onClick={refresh}>Retry</button></div> : !quotations.length ? <div className="global-quotation-state"><ReceiptText size={32} /><h2>No quotations have been created</h2><p>Create a quotation from an operationally feasible service request.</p><button className="button button-primary" type="button" onClick={() => setNewOpen(true)}>Create Quotation</button></div> : !filtered.length ? <div className="global-quotation-state"><Search size={32} /><h2>No quotations match your filters</h2><p>Try adjusting or clearing the selected filters.</p><button className="button button-secondary" type="button" onClick={clear}>Clear Filters</button></div> : <div className="global-quotation-table-scroll"><table className="global-quotation-table"><thead><tr><th>Quotation Number</th><th>Customer</th><th>Related Service Request</th><th>Vessel</th><th>Service Type</th><th className="amount">Total Amount</th><th>Valid Until</th><th>Internal Approval</th><th>Customer Status</th><th>Assigned Representative</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{filtered.map(({ quotation, request, status: item }) => <tr key={quotation.id}><td><Link to={`/marketing/quotations/${quotation.id}`}>{quotation.quotationNumber}</Link>{quotation.revisionNumber > 0 && <span>Revision {quotation.revisionNumber}</span>}</td><td><Link to={`/marketing/customers/${quotation.customerId}`}>{customerName(quotation.customerId)}</Link></td><td><Link to={`/marketing/service-requests/${quotation.serviceRequestId}`}>{request?.referenceNumber ?? quotation.serviceRequestId}</Link></td><td>{request?.vessel.name ?? quotation.vesselName ?? 'Not provided'}</td><td>{request?.service.type ?? quotation.serviceType ?? 'Not provided'}</td><td className="amount"><strong>{formatCurrency(quotation.totalAmount, quotation.currency)}</strong></td><td>{formatDate(quotation.validUntil)}</td><td><ApprovalStatusBadge status={getInternalApprovalStatus(quotation)} /></td><td><QuotationStatusBadge status={item} /></td><td>{quotation.assignedRepresentativeId ?? quotation.preparedBy}</td><td><QuotationActionsMenu quotation={quotation} onAction={perform} /></td></tr>)}</tbody></table></div>}
    </section>
    {newOpen && <NewQuotationModal requests={eligibleRequests} onClose={() => setNewOpen(false)} onCreate={createDraft} />}
    {editQuotation && <EditQuotationModal quotation={editQuotation} request={requestMap.get(editQuotation.serviceRequestId)} onClose={() => setEditQuotation(null)} onSave={(changes) => { quotationRepository.update(editQuotation.id, changes); setEditQuotation(null); refresh(); onNotify('Quotation draft updated.') }} />}
    {confirm && <div className="modal-backdrop"><section className="quotation-confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="quotation-confirm-title"><h2 id="quotation-confirm-title">Confirm {confirm.action}</h2><p>This action will update {confirm.quotation.quotationNumber}. Continue?</p><div><button className="button button-secondary" type="button" onClick={() => setConfirm(null)}>Cancel</button><button className="button button-primary" type="button" onClick={confirmAction}>Confirm</button></div></section></div>}
    {responseQuotation && <RecordCustomerResponseDialog contacts={customerContactRepository.getByCustomer(responseQuotation.customerId).filter((contact) => contact.status === 'Active' && contact.authorizations.canApproveQuotations)} onClose={() => setResponseQuotation(null)} onConfirm={(response: QuotationResponse) => { quotationRepository.recordCustomerResponse(responseQuotation.id, response); setResponseQuotation(null); refresh(); onNotify('Customer response recorded.') }} />}
  </main>
}
