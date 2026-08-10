import { CalendarPlus, Copy, Eye, FilePenLine, FilePlus2, Info, MoreHorizontal, Send, UserRoundCog, XCircle } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { ServiceRequest } from '../../types/serviceRequest'

interface Props {
  request: ServiceRequest
  hasActiveQuotation: boolean
  open: boolean
  onOpenChange: (open: boolean) => void
  onAction: (action: 'view' | 'edit' | 'assign' | 'submit' | 'respond' | 'quotation' | 'appointment' | 'duplicate' | 'cancel') => void
}

export function GlobalServiceRequestActionsMenu({ request, hasActiveQuotation, open, onOpenChange, onAction }: Props) {
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState({ top: 0, right: 8 })
  const review = request.operationsReview?.status ?? 'Not Submitted'
  const actions = [
    { key: 'view' as const, label: 'View Request', icon: Eye, show: true },
    { key: 'edit' as const, label: 'Edit Request', icon: FilePenLine, show: ['Draft', 'Under Review'].includes(request.status) || review === 'More Information Required' },
    { key: 'assign' as const, label: 'Assign Representative', icon: UserRoundCog, show: true },
    { key: 'submit' as const, label: 'Submit to Operations', icon: Send, show: request.status === 'Under Review' && review === 'Not Submitted' },
    { key: 'respond' as const, label: 'Respond to Information Request', icon: Info, show: review === 'More Information Required' },
    { key: 'quotation' as const, label: 'Create Quotation', icon: FilePlus2, show: ['Feasible', 'Feasible with Conditions'].includes(review) && !['Cancelled', 'Completed'].includes(request.status) && !hasActiveQuotation },
    { key: 'appointment' as const, label: 'Schedule Appointment', icon: CalendarPlus, show: !['Completed', 'Cancelled'].includes(request.status) },
    { key: 'duplicate' as const, label: 'Duplicate Request', icon: Copy, show: true },
    { key: 'cancel' as const, label: 'Cancel Request', icon: XCircle, show: !['Completed', 'Cancelled'].includes(request.status), danger: true },
  ].filter((action) => action.show)

  useEffect(() => {
    if (!open) return
    const outside = (event: PointerEvent) => { const target = event.target as Node; if (!triggerRef.current?.contains(target) && !menuRef.current?.contains(target)) onOpenChange(false) }
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { onOpenChange(false); triggerRef.current?.focus(); return }
      if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return
      const buttons = [...(menuRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]') ?? [])]
      if (!buttons.length) return
      event.preventDefault()
      const current = buttons.indexOf(document.activeElement as HTMLButtonElement)
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : event.key === 'ArrowDown' ? (current + 1) % buttons.length : (current - 1 + buttons.length) % buttons.length
      buttons[next].focus()
    }
    document.addEventListener('pointerdown', outside)
    document.addEventListener('keydown', keydown)
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', keydown) }
  }, [open, onOpenChange])

  const toggle = () => {
    if (!open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      const height = Math.min(actions.length * 38 + 12, 360)
      setPosition({ top: rect.bottom + height > window.innerHeight ? Math.max(8, rect.top - height - 4) : rect.bottom + 4, right: Math.max(8, window.innerWidth - rect.right) })
    }
    onOpenChange(!open)
  }

  return <>
    <button ref={triggerRef} className="customer-menu-trigger" type="button" aria-label={`Actions for ${request.referenceNumber}`} aria-haspopup="menu" aria-expanded={open} onClick={toggle}><MoreHorizontal size={18} /></button>
    {open && createPortal(<div ref={menuRef} className="customer-action-menu profile-action-menu global-request-menu" role="menu" style={position}>
      {actions.map(({ key, label, icon: Icon, danger }) => <button key={key} className={danger ? 'menu-danger' : undefined} role="menuitem" type="button" onClick={() => { onOpenChange(false); onAction(key) }}><Icon size={14} />{label}</button>)}
    </div>, document.body)}
  </>
}
