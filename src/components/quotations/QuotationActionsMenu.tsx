import { CalendarPlus, ClipboardCheck, Copy, Download, Eye, FilePenLine, FilePlus2, MoreHorizontal, Printer, RefreshCw, Send, Stamp, Trash2, Undo2 } from 'lucide-react'
import type { Quotation } from '../../types/quotation'
import { getAvailableQuotationActions, type QuotationAction } from '../../utils/quotationWorkflow'

const labels: Record<QuotationAction, string> = { view: 'View', edit: 'Edit', submit: 'Submit for Approval', duplicate: 'Duplicate', delete: 'Delete Draft', withdraw: 'Withdraw Approval Request', send: 'Send to Customer', download: 'Download PDF', print: 'Print', resend: 'Resend', response: 'Record Customer Response', feedback: 'View Customer Feedback', revision: 'Create Revision', request: 'View Related Request', contract: 'Request Contract Preparation', appointment: 'Schedule Appointment', extend: 'Extend Validity' }
const icons: Record<QuotationAction, typeof Eye> = { view: Eye, edit: FilePenLine, submit: ClipboardCheck, duplicate: Copy, delete: Trash2, withdraw: Undo2, send: Send, download: Download, print: Printer, resend: RefreshCw, response: ClipboardCheck, feedback: Eye, revision: FilePlus2, request: Eye, contract: Stamp, appointment: CalendarPlus, extend: CalendarPlus }

export function QuotationActionsMenu({ quotation, onAction }: { quotation: Quotation; onAction: (action: QuotationAction, quotation: Quotation) => void }) {
  return <details className="global-quotation-actions"><summary aria-label={`Actions for ${quotation.quotationNumber}`}><MoreHorizontal size={17} /></summary><div role="menu">{getAvailableQuotationActions(quotation).map((action) => { const Icon = icons[action]; return <button key={action} className={action === 'delete' ? 'danger' : ''} role="menuitem" type="button" onClick={(event) => { onAction(action, quotation); event.currentTarget.closest('details')?.removeAttribute('open') }}><Icon size={14} />{labels[action]}</button> })}</div></details>
}
