import { CheckCheck, ClipboardPen, Download, Eye, FilePenLine, FilePlus2, MoreHorizontal, Send, Stamp } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { EffectiveQuotationStatus, Quotation } from '../../../types/quotation'

interface Props {
  quotation: Quotation
  status: EffectiveQuotationStatus
  open: boolean
  onOpenChange: (open: boolean) => void
  onView: () => void
  onEdit: () => void
  onSubmit: () => void
  onSend: () => void
  onResponse: () => void
  onRevision: () => void
  onDownload: () => void
  onContract: () => void
}

export function QuotationActionsMenu({ quotation, status, open, onOpenChange, onView, onEdit, onSubmit, onSend, onResponse, onRevision, onDownload, onContract }: Props) {
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState({ top: 0, right: 8 })
  useEffect(() => {
    if (!open) return
    const outside = (event: PointerEvent) => { const target = event.target as Node; if (!triggerRef.current?.contains(target) && !menuRef.current?.contains(target)) onOpenChange(false) }
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') { onOpenChange(false); triggerRef.current?.focus() } }
    document.addEventListener('pointerdown', outside); document.addEventListener('keydown', escape)
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape) }
  }, [open, onOpenChange])
  const toggle = () => {
    if (!open && triggerRef.current) { const rect = triggerRef.current.getBoundingClientRect(); const height = 300; setPosition({ top: rect.bottom + height > innerHeight ? Math.max(8, rect.top - height - 4) : rect.bottom + 4, right: Math.max(8, innerWidth - rect.right) }) }
    onOpenChange(!open)
  }
  const action = (callback: () => void) => () => { onOpenChange(false); callback() }
  return <><button ref={triggerRef} className="customer-menu-trigger" type="button" aria-label={`Actions for ${quotation.quotationNumber}`} aria-haspopup="menu" aria-expanded={open} onClick={toggle}><MoreHorizontal size={18} /></button>{open && createPortal(<div ref={menuRef} className="customer-action-menu quotation-action-menu" role="menu" style={position}>
    <button role="menuitem" type="button" onClick={action(onView)}><Eye size={14} />View Quotation</button>
    {status === 'Draft' && <><button role="menuitem" type="button" onClick={action(onEdit)}><FilePenLine size={14} />Edit Quotation</button><button role="menuitem" type="button" onClick={action(onSubmit)}><ClipboardPen size={14} />Submit for Internal Approval</button></>}
    {status === 'Ready to Send' && <button role="menuitem" type="button" onClick={action(onSend)}><Send size={14} />Send to Customer</button>}
    {['Sent', 'Viewed'].includes(status) && <button role="menuitem" type="button" onClick={action(onResponse)}><CheckCheck size={14} />Record Customer Response</button>}
    {['Sent', 'Viewed', 'Rejected', 'Expired'].includes(status) && <button role="menuitem" type="button" onClick={action(onRevision)}><FilePlus2 size={14} />Create Revision</button>}
    <button role="menuitem" type="button" onClick={action(onDownload)}><Download size={14} />Download PDF</button>
    {status === 'Customer Approved' && <button role="menuitem" type="button" onClick={action(onContract)}><Stamp size={14} />Create Contract</button>}
  </div>, document.body)}</>
}
