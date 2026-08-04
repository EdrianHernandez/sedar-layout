import { CalendarPlus, Copy, Eye, FilePenLine, FilePlus2, MoreHorizontal, XCircle } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { ServiceRequest } from '../../../types/serviceRequest'

interface Props {
  request: ServiceRequest
  open: boolean
  onOpenChange: (open: boolean) => void
  onView: () => void
  onEdit: () => void
  onQuotation: () => void
  onAppointment: () => void
  onDuplicate: () => void
  onCancel: () => void
}

export function ServiceRequestActionsMenu({ request, open, onOpenChange, onView, onEdit, onQuotation, onAppointment, onDuplicate, onCancel }: Props) {
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState({ top: 0, right: 8 })
  const canEdit = request.status === 'Draft' || request.status === 'Under Review'
  const canQuote = !['Draft', 'Cancelled', 'Completed'].includes(request.status)
  const canCancel = !['Completed', 'Cancelled'].includes(request.status)

  useEffect(() => {
    if (!open) return
    const outside = (event: PointerEvent) => { const target = event.target as Node; if (!triggerRef.current?.contains(target) && !menuRef.current?.contains(target)) onOpenChange(false) }
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') { onOpenChange(false); triggerRef.current?.focus() } }
    document.addEventListener('pointerdown', outside)
    document.addEventListener('keydown', escape)
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape) }
  }, [open, onOpenChange])

  const toggle = () => {
    if (!open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      const height = 226
      setPosition({ top: rect.bottom + height > window.innerHeight ? Math.max(8, rect.top - height - 4) : rect.bottom + 4, right: Math.max(8, window.innerWidth - rect.right) })
    }
    onOpenChange(!open)
  }
  const action = (callback: () => void) => () => { onOpenChange(false); callback() }

  return <>
    <button ref={triggerRef} className="customer-menu-trigger" type="button" aria-label={`Actions for ${request.referenceNumber}`} aria-haspopup="menu" aria-expanded={open} onClick={toggle}><MoreHorizontal size={18} /></button>
    {open && createPortal(<div ref={menuRef} className="customer-action-menu profile-action-menu service-request-menu" role="menu" style={position}>
      <button role="menuitem" type="button" onClick={action(onView)}><Eye size={14} />View Request</button>
      {canEdit && <button role="menuitem" type="button" onClick={action(onEdit)}><FilePenLine size={14} />Edit Request</button>}
      {canQuote && <button role="menuitem" type="button" onClick={action(onQuotation)}><FilePlus2 size={14} />Create Quotation</button>}
      {!['Completed', 'Cancelled'].includes(request.status) && <button role="menuitem" type="button" onClick={action(onAppointment)}><CalendarPlus size={14} />Schedule Appointment</button>}
      <button role="menuitem" type="button" onClick={action(onDuplicate)}><Copy size={14} />Duplicate Request</button>
      {canCancel && <button className="menu-danger" role="menuitem" type="button" onClick={action(onCancel)}><XCircle size={14} />Cancel Request</button>}
    </div>, document.body)}
  </>
}
