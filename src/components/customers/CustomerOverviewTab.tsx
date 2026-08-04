import { CalendarDays, FileText, Mail, MessageSquareText, Ship, StickyNote } from 'lucide-react'
import type { Customer, CustomerActivity, CustomerAppointment, CustomerInternalNote } from '../../types/customer'
import { CustomerStatusBadge } from './CustomerStatusBadge'

interface CustomerOverviewTabProps {
  customer: Customer
  appointment?: CustomerAppointment
  activities: CustomerActivity[]
  notes: CustomerInternalNote[]
  onNotify: (message: string) => void
}

const formatDate = (date?: string) => date ? new Intl.DateTimeFormat('en-PH', { month: 'long', day: 'numeric', year: 'numeric' }).format(new Date(`${date}T00:00:00`)) : 'Not provided'
const formatDateTime = (date: string) => new Intl.DateTimeFormat('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(date))

function DetailList({ details }: { details: Array<[string, string | undefined | null | React.ReactNode]> }) {
  return <dl className="profile-details">{details.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value || 'Not provided'}</dd></div>)}</dl>
}

export function CustomerOverviewTab({ customer, appointment, activities, notes, onNotify }: CustomerOverviewTabProps) {
  const profile = customer.profileDetails
  return <div className="overview-grid">
    <section className="profile-card"><header><h2>Company Information</h2></header><DetailList details={[
      ['Company Name', customer.companyName], ['Customer ID', customer.id], ['Customer Type', customer.customerType], ['Account Status', <CustomerStatusBadge status={customer.status} />],
      ['Tax Identification Number', profile?.taxIdentificationNumber], ['Business Address', profile?.businessAddress], ['City/Province', profile?.cityProvince], ['Country', profile?.country],
      ['Company Email', profile?.companyEmail], ['Company Phone', profile?.companyPhone], ['Website', profile?.website], ['Date Added', formatDate(profile?.dateAdded)],
    ]} /></section>

    <section className="profile-card"><header><h2>Primary Contact</h2></header><DetailList details={[
      ['Full Name', customer.primaryContact.name], ['Position', customer.primaryContact.position], ['Email', customer.primaryContact.email], ['Phone', customer.primaryContact.phone], ['Contact Type', 'Primary Contact'],
    ]} /><div className="profile-card-actions"><button className="button button-secondary" type="button" onClick={() => onNotify('Email integration will be implemented later.')}><Mail size={14} />Send Email</button><button className="button button-secondary" type="button" onClick={() => onNotify('Appointment scheduling will be implemented next.')}><CalendarDays size={14} />Schedule Appointment</button></div></section>

    <section className="profile-card"><header><h2>Marketing Relationship</h2></header><DetailList details={[
      ['Assigned Marketing Representative', customer.assignedRepresentative], ['Lead Source', profile?.leadSource], ['Customer Since', formatDate(profile?.customerSince)], ['Last Interaction', formatDate(customer.lastInteraction)], ['Next Follow-up Date', formatDate(profile?.nextFollowUpDate)],
      ['Relationship Status', profile?.relationshipStatus ? <span className={`relationship-badge relationship-${profile.relationshipStatus.toLowerCase().replace(' ', '-')}`}>{profile.relationshipStatus}</span> : undefined],
    ]} /></section>

    <section className="profile-card"><header><h2>Upcoming Appointment</h2></header>{appointment ? <div className="appointment-content"><div className="appointment-icon"><CalendarDays size={20} /></div><h3>{appointment.type}</h3><DetailList details={[[ 'Date', formatDate(appointment.date) ], [ 'Time', appointment.time ], [ 'Contact Person', appointment.contactPerson ], [ 'Location', appointment.location ], [ 'Assigned Representative', appointment.assignedRepresentative ], [ 'Status', appointment.status ]]} /></div> : <div className="compact-empty"><CalendarDays size={24} /><p>No upcoming appointments.</p><button className="button button-secondary" type="button" onClick={() => onNotify('Appointment scheduling will be implemented next.')}>Schedule Appointment</button></div>}</section>

    <section className="profile-card profile-card-wide"><header><h2>Recent Activity</h2></header>{activities.length ? <ol className="activity-timeline">{activities.slice(0, 5).map((activity) => <li key={activity.id}><span className="timeline-icon">{activity.kind === 'appointment' ? <CalendarDays size={14} /> : activity.kind === 'note' ? <StickyNote size={14} /> : activity.kind === 'request' ? <Ship size={14} /> : <FileText size={14} />}</span><div><strong>{activity.description}</strong>{activity.reference && <span>{activity.reference}</span>}<p>{activity.employee} · {formatDateTime(activity.occurredAt)}</p></div></li>)}</ol> : <div className="compact-empty"><MessageSquareText size={24} /><p>No recent activity is recorded.</p></div>}</section>

    <section className="profile-card profile-card-wide"><header><div><h2>Internal Notes</h2><p>Internal – Not visible to the customer</p></div><button type="button" onClick={() => onNotify('Internal notes will be implemented next.')}>+ Add Internal Note</button></header>{notes.length ? <div className="internal-notes">{notes.map((note) => <article key={note.id}><div><strong>{note.author}</strong><time dateTime={note.date}>{formatDate(note.date)}</time></div><p>{note.content}</p></article>)}</div> : <div className="compact-empty"><StickyNote size={24} /><p>No internal notes have been added.</p></div>}</section>
  </div>
}
