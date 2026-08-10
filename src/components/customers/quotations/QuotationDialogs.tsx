import { AlertTriangle, CheckCircle2, FilePlus2, Search, Send } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { Customer } from '../../../types/customer'
import type { CustomerContact } from '../../../types/customerContact'
import type { Quotation, QuotationCustomerResponse, QuotationResponse } from '../../../types/quotation'
import type { ServiceRequest } from '../../../types/serviceRequest'
import { formatCurrency } from '../../../utils/formatCurrency'
import { ServiceRequestStatusBadge } from '../../service-requests/ServiceRequestBadges'

function DialogFrame({ title, children, onClose, icon }: { title: string; children: ReactNode; onClose: () => void; icon?: ReactNode }) {
  const ref = useRef<HTMLElement>(null)
  useEffect(() => {
    ref.current?.querySelector<HTMLElement>('button, input, select, textarea')?.focus()
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
      if (event.key !== 'Tab' || !ref.current) return
      const controls = [...ref.current.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href]')]
      if (!controls.length) return
      const first = controls[0]; const last = controls[controls.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', keydown); return () => document.removeEventListener('keydown', keydown)
  }, [onClose])
  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}><section ref={ref} className="quotation-dialog" role="dialog" aria-modal="true" aria-labelledby="quotation-dialog-title"><header className="quotation-dialog-header">{icon && <span className="dialog-icon">{icon}</span>}<h2 id="quotation-dialog-title">{title}</h2></header>{children}</section></div>
}

const fullName = (contact: CustomerContact) => `${contact.firstName} ${contact.lastName}`

export function SelectServiceRequestDialog({ requests, customerId, onClose, onContinue }: { requests: ServiceRequest[]; customerId: string; onClose: () => void; onContinue: (id: string) => void }) {
  const [selected, setSelected] = useState('')
  const [search, setSearch] = useState('')
  const normalized = search.trim().toLowerCase()
  const filtered = requests.filter((request) => [request.referenceNumber, request.vessel.name, request.service.type, request.schedule.portOrOperatingArea].join(' ').toLowerCase().includes(normalized))
  return <DialogFrame title="Select Service Request" icon={<FilePlus2 size={20} />} onClose={onClose}>{requests.length ? <><p className="quotation-dialog-intro">Select an eligible reviewed request to prepare a quotation.</p>{requests.length > 4 && <label className="quotation-dialog-search"><Search size={14} /><span className="sr-only">Search eligible requests</span><input value={search} placeholder="Search requests" onChange={(event) => setSearch(event.target.value)} /></label>}<div className="eligible-request-list">{filtered.map((request) => <label key={request.id} className={selected === request.id ? 'selected' : ''}><input type="radio" name="request" value={request.id} checked={selected === request.id} onChange={() => setSelected(request.id)} /><span className="request-radio" aria-hidden="true" /><span className="eligible-request-content"><span className="eligible-request-heading"><strong>{request.referenceNumber}</strong><b>{request.vessel.name}</b></span><span className="eligible-request-meta"><small>{request.service.type}</small><small>{request.schedule.requestedDate || 'Not scheduled'}</small><small>{request.schedule.portOrOperatingArea}</small></span><ServiceRequestStatusBadge status={request.status} /></span></label>)}</div><div className="dialog-actions quotation-dialog-footer"><button className="button button-secondary" type="button" onClick={onClose}>Cancel</button><button className="button button-primary" type="button" disabled={!selected} onClick={() => onContinue(selected)}>Continue</button></div></> : <><p className="quotation-dialog-intro">No eligible service requests are available.<br /><br />A service request must be reviewed before a quotation can be created.</p><div className="dialog-actions quotation-dialog-footer"><button className="button button-secondary" type="button" onClick={onClose}>Cancel</button><Link className="button button-primary" to={`/marketing/service-requests/new?customerId=${encodeURIComponent(customerId)}`}>New Service Request</Link></div></>}</DialogFrame>
}

export function SubmitQuotationDialog({ quotation, onClose, onConfirm }: { quotation: Quotation; onClose: () => void; onConfirm: () => void }) {
  const complete = Boolean(quotation.serviceRequestId && quotation.contactId && (quotation.lineItemSummaries.length || quotation.totalAmount > 0) && quotation.validUntil && (quotation.termsReference || quotation.termsAndConditions))
  return <DialogFrame title="Submit quotation for internal approval?" icon={<CheckCircle2 size={20} />} onClose={onClose}><p>The quotation will be locked from normal editing while it is under review.</p>{!complete && <div className="quotation-dialog-warning"><AlertTriangle size={15} />Complete the related request, contact, pricing, validity date, and terms before submitting.</div>}<div className="dialog-actions"><button className="button button-secondary" type="button" onClick={onClose}>Keep Editing</button><button className="button button-primary" type="button" disabled={!complete} onClick={onConfirm}>Submit</button></div></DialogFrame>
}

export function SendQuotationDialog({ quotation, customer, contacts, onClose, onConfirm }: { quotation: Quotation; customer: Customer; contacts: CustomerContact[]; onClose: () => void; onConfirm: (contactId: string) => void }) {
  const [contactId, setContactId] = useState(contacts.find((contact) => contact.id === quotation.contactId)?.id ?? contacts[0]?.id ?? '')
  const contact = contacts.find((item) => item.id === contactId)
  return <DialogFrame title="Send quotation to customer?" icon={<Send size={20} />} onClose={onClose}>{contacts.length ? <><dl className="quotation-dialog-summary"><div><dt>Quotation</dt><dd>{quotation.quotationNumber}</dd></div><div><dt>Customer</dt><dd>{customer.companyName}</dd></div><div><dt>Total</dt><dd>{formatCurrency(quotation.totalAmount)}</dd></div><div><dt>Valid Until</dt><dd>{quotation.validUntil ? new Date(quotation.validUntil).toLocaleDateString('en-PH') : 'Not set'}</dd></div></dl><label className="dialog-field"><span>Customer Contact</span><select value={contactId} onChange={(event) => setContactId(event.target.value)}>{contacts.map((item) => <option key={item.id} value={item.id}>{fullName(item)} · {item.email}</option>)}</select></label>{contact && <p className="selected-contact-email">Selected recipient: {contact.email}</p>}<div className="dialog-actions"><button className="button button-secondary" type="button" onClick={onClose}>Cancel</button><button className="button button-primary" type="button" onClick={() => onConfirm(contactId)}>Mark as Sent</button></div></> : <><p>No active quotation approver is available for this customer.<br /><br />Assign quotation approval authorization to a customer contact before sending.</p><div className="dialog-actions"><button className="button button-secondary" type="button" onClick={onClose}>Close</button></div></>}</DialogFrame>
}

export function RecordCustomerResponseDialog({ contacts, onClose, onConfirm }: { contacts: CustomerContact[]; onClose: () => void; onConfirm: (response: QuotationResponse) => void }) {
  const [contactId, setContactId] = useState(contacts[0]?.id ?? '')
  const [type, setType] = useState<QuotationCustomerResponse>('Customer Approved')
  const [responseDate, setResponseDate] = useState(new Date().toISOString().slice(0, 10)); const [responseMethod, setResponseMethod] = useState<NonNullable<QuotationResponse['responseMethod']>>('Email'); const [followUpDate, setFollowUpDate] = useState(''); const [supportingDocumentName, setSupportingDocumentName] = useState('')
  const [customerNotes, setCustomerNotes] = useState(''); const [internalNotes, setInternalNotes] = useState(''); const [reason, setReason] = useState(''); const [error, setError] = useState('')
  const submit = () => {
    if (!contactId || !responseDate) { setError('Responding contact and response date are required.'); return }
    if (['Rejected', 'Requested Revision'].includes(type) && !reason.trim()) { setError(type === 'Rejected' ? 'Provide a rejection reason.' : 'Provide revision notes.'); return }
    onConfirm({ type, contactId, responseDate, responseMethod, followUpDate: followUpDate || undefined, supportingDocumentName: supportingDocumentName || undefined, customerNotes: customerNotes.trim() || undefined, internalNotes: type === 'Requested Revision' ? reason.trim() : internalNotes.trim() || undefined, rejectionReason: type === 'Rejected' ? reason.trim() : undefined })
  }
  return <DialogFrame title="Record customer response" icon={<CheckCircle2 size={20} />} onClose={onClose}>{contacts.length ? <><div className="quotation-dialog-fields"><label className="dialog-field"><span>Responding Contact *</span><select value={contactId} onChange={(event) => setContactId(event.target.value)}>{contacts.map((contact) => <option key={contact.id} value={contact.id}>{fullName(contact)}</option>)}</select></label><label className="dialog-field"><span>Response *</span><select value={type} onChange={(event) => { setType(event.target.value as QuotationCustomerResponse); setError('') }}><option value="Customer Approved">Accepted</option><option value="Requested Revision">Changes Requested</option><option>Rejected</option><option>Pending Decision</option></select></label><label className="dialog-field"><span>Response Date *</span><input type="date" value={responseDate} onChange={(event) => setResponseDate(event.target.value)} /></label><label className="dialog-field"><span>Response Method</span><select value={responseMethod} onChange={(event) => setResponseMethod(event.target.value as NonNullable<QuotationResponse['responseMethod']>)}><option>Email</option><option>Phone</option><option>Meeting</option><option>Customer Portal</option></select></label><label className="dialog-field"><span>Follow-up Date</span><input type="date" value={followUpDate} onChange={(event) => setFollowUpDate(event.target.value)} /></label><label className="dialog-field"><span>Supporting Document</span><input type="file" onChange={(event) => setSupportingDocumentName(event.target.files?.[0]?.name ?? '')} /></label><label className="dialog-field"><span>Customer Comments</span><textarea rows={2} value={customerNotes} onChange={(event) => setCustomerNotes(event.target.value)} /></label><label className="dialog-field"><span>Internal Notes</span><textarea rows={2} value={internalNotes} onChange={(event) => setInternalNotes(event.target.value)} /></label>{['Rejected', 'Requested Revision'].includes(type) && <label className="dialog-field"><span>{type === 'Rejected' ? 'Rejection Reason' : 'Requested Changes'} *</span><textarea rows={2} value={reason} aria-invalid={Boolean(error)} onChange={(event) => { setReason(event.target.value); setError('') }} /></label>}</div>{error && <small className="dialog-error" role="alert">{error}</small>}<div className="dialog-actions"><button className="button button-secondary" type="button" onClick={onClose}>Cancel</button><button className="button button-primary" type="button" onClick={submit}>Record Response</button></div></> : <><p>No active quotation approver is available for this customer.</p><div className="dialog-actions"><button className="button button-secondary" type="button" onClick={onClose}>Close</button></div></>}</DialogFrame>
}

export function CreateRevisionDialog({ onClose, onConfirm }: { onClose: () => void; onConfirm: (reason: string) => void }) {
  const [reason, setReason] = useState(''); const [error, setError] = useState('')
  return <DialogFrame title="Create quotation revision?" icon={<FilePlus2 size={20} />} onClose={onClose}><p>A new draft will be created using the existing service, pricing, and terms. The current version will remain in the quotation history.</p><label className="dialog-field"><span>Reason for revision *</span><textarea rows={3} value={reason} aria-invalid={Boolean(error)} onChange={(event) => { setReason(event.target.value); setError('') }} /></label>{error && <small className="dialog-error" role="alert">{error}</small>}<div className="dialog-actions"><button className="button button-secondary" type="button" onClick={onClose}>Cancel</button><button className="button button-primary" type="button" onClick={() => reason.trim() ? onConfirm(reason.trim()) : setError('A revision reason is required.')}>Create Draft</button></div></DialogFrame>
}
