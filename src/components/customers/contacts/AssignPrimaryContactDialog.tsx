import { X } from 'lucide-react'
import { useEffect, useRef } from 'react'
import type { CustomerContact } from '../../../types/customerContact'

interface Props { contacts: CustomerContact[]; onClose: () => void; onSelect: (contact: CustomerContact) => void }
export function AssignPrimaryContactDialog({ contacts, onClose, onSelect }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null)
  useEffect(() => { closeRef.current?.focus(); const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }; document.addEventListener('keydown', escape); return () => document.removeEventListener('keydown', escape) }, [onClose])
  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}><section className="assign-primary-dialog" role="dialog" aria-modal="true" aria-labelledby="assign-primary-title"><header><div><h2 id="assign-primary-title">Assign Primary Contact</h2><p>Select an active contact for customer coordination.</p></div><button ref={closeRef} type="button" aria-label="Close primary contact selection" onClick={onClose}><X size={17} /></button></header><div>{contacts.map((contact) => <button key={contact.id} type="button" onClick={() => onSelect(contact)}><span>{contact.firstName[0]}{contact.lastName[0]}</span><div><strong>{contact.firstName} {contact.lastName}</strong><small>{contact.position} · {contact.department || 'Department not provided'}</small></div></button>)}</div></section></div>
}
