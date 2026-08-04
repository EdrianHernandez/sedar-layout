import { AlertTriangle, Copy } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { SERVICE_REQUEST_CANCELLATION_REASONS } from '../../../data/serviceRequestOptions'

function DialogFrame({ title, icon, children, onClose }: { title: string; icon: ReactNode; children: ReactNode; onClose: () => void }) {
  const dialogRef = useRef<HTMLElement>(null)
  useEffect(() => {
    dialogRef.current?.querySelector<HTMLElement>('button, select, textarea')?.focus()
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }
    const trap = (event: KeyboardEvent) => {
      if (event.key !== 'Tab' || !dialogRef.current) return
      const controls = [...dialogRef.current.querySelectorAll<HTMLElement>('button, select, textarea')].filter((item) => !item.hasAttribute('disabled'))
      if (!controls.length) return
      const first = controls[0]; const last = controls[controls.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', escape); document.addEventListener('keydown', trap)
    return () => { document.removeEventListener('keydown', escape); document.removeEventListener('keydown', trap) }
  }, [onClose])
  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}><section ref={dialogRef} className="service-request-dialog" role="alertdialog" aria-modal="true" aria-labelledby="service-request-dialog-title"><span className="dialog-icon">{icon}</span><h2 id="service-request-dialog-title">{title}</h2>{children}</section></div>
}

export function DuplicateServiceRequestDialog({ reference, onClose, onConfirm }: { reference: string; onClose: () => void; onConfirm: () => void }) {
  return <DialogFrame title="Duplicate service request?" icon={<Copy size={20} />} onClose={onClose}><p>A new draft will be created using the customer, contact, vessel, service, and location information from {reference}.</p><div className="dialog-actions"><button className="button button-secondary" type="button" onClick={onClose}>Cancel</button><button className="button button-primary" type="button" onClick={onConfirm}>Create Draft</button></div></DialogFrame>
}

export function CancelServiceRequestDialog({ onClose, onConfirm }: { onClose: () => void; onConfirm: (reason: string, explanation?: string) => void }) {
  const [reason, setReason] = useState('')
  const [explanation, setExplanation] = useState('')
  const [error, setError] = useState('')
  const submit = () => {
    if (!reason) { setError('Select a cancellation reason.'); return }
    if (reason === 'Other' && !explanation.trim()) { setError('Explain the cancellation reason.'); return }
    onConfirm(reason, explanation.trim() || undefined)
  }
  return <DialogFrame title="Cancel service request?" icon={<AlertTriangle size={20} />} onClose={onClose}><p>This request will remain in the customer’s history but will no longer continue through the service workflow.</p><label className="dialog-field"><span>Reason <em aria-hidden="true">*</em></span><select value={reason} required aria-invalid={Boolean(error)} aria-describedby={error ? 'cancel-request-error' : undefined} onChange={(event) => { setReason(event.target.value); setError('') }}><option value="">Select a reason</option>{SERVICE_REQUEST_CANCELLATION_REASONS.map((item) => <option key={item}>{item}</option>)}</select></label>{reason === 'Other' && <label className="dialog-field"><span>Explanation <em aria-hidden="true">*</em></span><textarea rows={3} value={explanation} required aria-invalid={Boolean(error)} aria-describedby={error ? 'cancel-request-error' : undefined} onChange={(event) => { setExplanation(event.target.value); setError('') }} /></label>}{error && <small id="cancel-request-error" className="dialog-error" role="alert">{error}</small>}<div className="dialog-actions"><button className="button button-secondary" type="button" onClick={onClose}>Keep Request</button><button className="button discard-button" type="button" onClick={submit}>Cancel Request</button></div></DialogFrame>
}
