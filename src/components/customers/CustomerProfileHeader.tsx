import { CalendarDays, Clock3, Handshake, Pencil, Plus, ReceiptText, StickyNote, UserRound, UserX } from 'lucide-react'
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
  const profile = customer.profileDetails
  const lastInteraction = new Intl.DateTimeFormat('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(`${customer.lastInteraction}T00:00:00`))
  return <section className="profile-header-card">
    <div className="profile-header-main">
      <div className="profile-identity"><span className="profile-avatar">{customer.companyInitials}</span><div className="profile-identity-copy"><span className="profile-overline">Customer Account</span><h1>{customer.companyName}</h1><div className="profile-meta"><span>{customer.id}</span><span>{customer.customerType}</span><CustomerStatusBadge status={customer.status} /></div></div></div>
      <div className="profile-header-actions">
        <button className="button button-primary" type="button" onClick={() => onNotify('Service request creation will be implemented next.')}><Plus size={15} />New Service Request</button>
        <button className="button button-secondary" type="button" onClick={() => onNotify('Customer editing will be implemented next.')}><Pencil size={14} />Edit Customer</button>
        <PrototypeActionMenu label={`More actions for ${customer.companyName}`} actions={actions} open={menuOpen} onOpenChange={setMenuOpen} onNotify={onNotify} />
      </div>
    </div>
    <div className="profile-relationship-strip">
      <div><span className="relationship-strip-icon"><UserRound size={14} /></span><p>Assigned Representative<strong>{customer.assignedRepresentative}</strong></p></div>
      <div><span className="relationship-strip-icon"><Clock3 size={14} /></span><p>Last Interaction<strong>{lastInteraction}</strong></p></div>
      <div><span className="relationship-strip-icon"><Handshake size={14} /></span><p>Relationship<strong>{profile?.relationshipStatus ?? 'Not provided'}</strong></p></div>
    </div>
  </section>
}
