import { AlertTriangle, Copy, Send, UserRoundCog } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { SERVICE_REQUEST_CANCELLATION_REASONS } from '../../data/serviceRequestOptions'
import type { ServiceRequest } from '../../types/serviceRequest'

function DialogFrame({ title, icon, children, onClose }: { title: string; icon: ReactNode; children: ReactNode; onClose: () => void }) {
  const ref = useRef<HTMLElement>(null)
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    ref.current?.querySelector<HTMLElement>('select, textarea, input, button')?.focus()
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
      if (event.key !== 'Tab' || !ref.current) return
      const controls = [...ref.current.querySelectorAll<HTMLElement>('button, select, textarea, input, a[href]')].filter((item) => !item.hasAttribute('disabled'))
      const first = controls[0]; const last = controls.at(-1)
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
    }
    document.addEventListener('keydown', keydown)
    return () => { document.removeEventListener('keydown', keydown); document.body.style.overflow = overflow; previous?.focus() }
  }, [onClose])
  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}><section ref={ref} className="service-request-dialog global-request-dialog" role="dialog" aria-modal="true" aria-labelledby="global-request-dialog-title"><span className="dialog-icon">{icon}</span><h2 id="global-request-dialog-title">{title}</h2>{children}</section></div>
}

export function AssignRepresentativeDialog({ request, representatives, onClose, onConfirm }: { request: ServiceRequest; representatives: string[]; onClose: () => void; onConfirm: (representative: string, notes?: string) => void }) {
  const [representative, setRepresentative] = useState(request.assignedMarketingRepresentative)
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')
  return <DialogFrame title="Assign Marketing representative" icon={<UserRoundCog size={20} />} onClose={onClose}><dl className="request-dialog-summary"><div><dt>Request</dt><dd>{request.referenceNumber}</dd></div><div><dt>Current representative</dt><dd>{request.assignedMarketingRepresentative || 'Unassigned'}</dd></div></dl><label className="dialog-field"><span>New representative <em>*</em></span><select value={representative} aria-invalid={Boolean(error)} onChange={(event) => { setRepresentative(event.target.value); setError('') }}><option value="">Unassigned</option>{representatives.map((name) => <option key={name}>{name}</option>)}</select></label><label className="dialog-field"><span>Assignment notes</span><textarea rows={3} value={notes} onChange={(event) => setNotes(event.target.value)} /></label>{error && <small className="dialog-error" role="alert">{error}</small>}<div className="dialog-actions"><button className="button button-secondary" onClick={onClose}>Cancel</button><button className="button button-primary" onClick={() => { if (!representative) { setError('Select a representative.'); return } onConfirm(representative, notes.trim() || undefined) }}>Update Assignment</button></div></DialogFrame>
}

export function SubmitOperationsDialog({ request, customerName, contactName, attachmentsCount = 0, onClose, onConfirm }: { request: ServiceRequest; customerName: string; contactName: string; attachmentsCount?: number; onClose: () => void; onConfirm: () => void }) {
  return <DialogFrame title="Submit request to Tug Operations?" icon={<Send size={20} />} onClose={onClose}><p>Operations will review feasibility, tug availability, operational conditions, and service requirements.</p><dl className="request-dialog-summary"><div><dt>Customer</dt><dd>{customerName}</dd></div><div><dt>Contact</dt><dd>{contactName}</dd></div><div><dt>Vessel</dt><dd>{request.vessel.name}</dd></div><div><dt>Service</dt><dd>{request.service.type}</dd></div><div><dt>Schedule</dt><dd>{request.schedule.requestedDate} {request.schedule.requestedTime}</dd></div><div><dt>Location</dt><dd>{request.schedule.portOrOperatingArea}</dd></div><div><dt>Priority</dt><dd>{request.priority}</dd></div><div><dt>Attachments</dt><dd>{attachmentsCount}</dd></div></dl><div className="dialog-actions"><button className="button button-secondary" onClick={onClose}>Keep Reviewing</button><button className="button button-primary" onClick={onConfirm}>Submit to Operations</button></div></DialogFrame>
}

export function RespondOperationsDialog({ request, onClose, onConfirm }: { request: ServiceRequest; onClose: () => void; onConfirm: (response: { customerResponse: string; additionalDetails?: string; internalNote?: string }) => void }) {
  const [customerResponse, setCustomerResponse] = useState('')
  const [additionalDetails, setAdditionalDetails] = useState('')
  const [internalNote, setInternalNote] = useState('')
  const [error, setError] = useState('')
  return <DialogFrame title="Respond to Operations" icon={<Send size={20} />} onClose={onClose}><div className="operations-information-request"><strong>Operations information request</strong><p>{request.operationsReview?.informationRequest || 'Additional customer information is required.'}</p></div><label className="dialog-field"><span>Customer response <em>*</em></span><textarea rows={3} value={customerResponse} aria-invalid={Boolean(error)} onChange={(event) => { setCustomerResponse(event.target.value); setError('') }} /></label><label className="dialog-field"><span>Additional service details</span><textarea rows={3} value={additionalDetails} onChange={(event) => setAdditionalDetails(event.target.value)} /></label><label className="dialog-field"><span>Internal response note</span><textarea rows={2} value={internalNote} onChange={(event) => setInternalNote(event.target.value)} /></label><a className="dialog-document-link" href={`/marketing/customers/${request.customerId}?tab=documents`}>Open related Documents section</a>{error && <small className="dialog-error" role="alert">{error}</small>}<div className="dialog-actions"><button className="button button-secondary" onClick={onClose}>Cancel</button><button className="button button-primary" onClick={() => { if (!customerResponse.trim()) { setError('Customer response is required.'); return } onConfirm({ customerResponse: customerResponse.trim(), additionalDetails: additionalDetails.trim() || undefined, internalNote: internalNote.trim() || undefined }) }}>Submit Information</button></div></DialogFrame>
}

export function DuplicateRequestDialog({ reference, onClose, onConfirm }: { reference: string; onClose: () => void; onConfirm: () => void }) {
  return <DialogFrame title="Duplicate Service Request?" icon={<Copy size={20} />} onClose={onClose}><p>A new Draft will copy the customer, contact, vessel, service, location, and Marketing assignment from {reference}. Schedule and workflow history will not be copied.</p><div className="dialog-actions"><button className="button button-secondary" onClick={onClose}>Cancel</button><button className="button button-primary" onClick={onConfirm}>Create Draft</button></div></DialogFrame>
}

export function CancelRequestDialog({ onClose, onConfirm }: { onClose: () => void; onConfirm: (reason: string, explanation?: string) => void }) {
  const [reason, setReason] = useState('')
  const [explanation, setExplanation] = useState('')
  const [error, setError] = useState('')
  return <DialogFrame title="Cancel Service Request?" icon={<AlertTriangle size={20} />} onClose={onClose}><p>The request will remain in customer history but will no longer continue through the service workflow.</p><label className="dialog-field"><span>Reason <em>*</em></span><select value={reason} aria-invalid={Boolean(error)} onChange={(event) => { setReason(event.target.value); setError('') }}><option value="">Select a reason</option>{SERVICE_REQUEST_CANCELLATION_REASONS.map((item) => <option key={item}>{item}</option>)}</select></label>{reason === 'Other' && <label className="dialog-field"><span>Explanation <em>*</em></span><textarea rows={3} value={explanation} aria-invalid={Boolean(error)} onChange={(event) => { setExplanation(event.target.value); setError('') }} /></label>}{error && <small className="dialog-error" role="alert">{error}</small>}<div className="dialog-actions"><button className="button button-secondary" onClick={onClose}>Keep Request</button><button className="button discard-button" onClick={() => { if (!reason) { setError('Select a cancellation reason.'); return } if (reason === 'Other' && !explanation.trim()) { setError('Explain the cancellation reason.'); return } onConfirm(reason, explanation.trim() || undefined) }}>Cancel Request</button></div></DialogFrame>
}
