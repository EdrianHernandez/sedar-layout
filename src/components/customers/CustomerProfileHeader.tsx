import { CalendarDays, Pencil, Plus, ReceiptText, StickyNote, UserX } from 'lucide-react'
import { useState } from 'react'
import type { Customer } from '../../types/customer'
import { CustomerStatusBadge } from './CustomerStatusBadge'
import { PrototypeActionMenu, type PrototypeMenuAction } from './PrototypeActionMenu'

const actions: PrototypeMenuAction[] = [
  { label: 'Schedule Appointment', message: 'Appointment scheduling will be implemented next.', icon: CalendarDays },
  { label: 'Create Quotation', message: 'Quotation creation will be implemented next.', icon: ReceiptText },
  { label: 'Add Internal Note', message: 'Internal notes will be implemented next.', icon: StickyNote },
  { label: 'Mark as Inactive', message: 'Customer status management will be implemented next.', icon: UserX },
]

interface CustomerProfileHeaderProps { customer: Customer; onNotify: (message: string) => void }

export function CustomerProfileHeader({ customer, onNotify }: CustomerProfileHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  return <section className="profile-header-card">
    <div className="profile-identity"><span className="profile-avatar">{customer.companyInitials}</span><div><h1>{customer.companyName}</h1><p>{customer.id}<span aria-hidden="true"> • </span>{customer.customerType}</p><CustomerStatusBadge status={customer.status} /></div></div>
    <div className="profile-header-actions">
      <button className="button button-primary" type="button" onClick={() => onNotify('Service request creation will be implemented next.')}><Plus size={15} />New Service Request</button>
      <button className="button button-secondary" type="button" onClick={() => onNotify('Customer editing will be implemented next.')}><Pencil size={14} />Edit Customer</button>
      <PrototypeActionMenu label={`More actions for ${customer.companyName}`} actions={actions} open={menuOpen} onOpenChange={setMenuOpen} onNotify={onNotify} />
    </div>
  </section>
}
