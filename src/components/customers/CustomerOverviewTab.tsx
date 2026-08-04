import { Activity, Building2, CalendarDays, CalendarClock, FileText, Handshake, Mail, MapPin, MessageSquareText, Ship, StickyNote, UserRound } from 'lucide-react'
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

function CardHeading({ icon: Icon, title, eyebrow }: { icon: typeof Building2; title: string; eyebrow: string }) {
  return <div className="overview-card-heading"><span><Icon size={16} aria-hidden="true" /></span><div><p>{eyebrow}</p><h2>{title}</h2></div></div>
}

export function CustomerOverviewTab({ customer, appointment, activities, notes, onNotify }: CustomerOverviewTabProps) {
  const profile = customer.profileDetails
  return <div className="overview-grid">
    <section className="profile-card overview-company"><header><CardHeading icon={Building2} title="Company Information" eyebrow="Account details" /></header><DetailList details={[
      ['Company Name', customer.companyName], ['Customer ID', customer.id], ['Customer Type', customer.customerType], ['Account Status', <CustomerStatusBadge status={customer.status} />],
      ['Tax Identification Number', profile?.taxIdentificationNumber], ['Business Address', profile?.businessAddress], ['City/Province', profile?.cityProvince], ['Country', profile?.country],
      ['Company Email', profile?.companyEmail], ['Company Phone', profile?.companyPhone], ['Website', profile?.website], ['Date Added', formatDate(profile?.dateAdded)],
    ]} /></section>

    <section className="profile-card overview-contact"><header><CardHeading icon={UserRound} title="Primary Contact" eyebrow="Main point of contact" /></header><div className="contact-identity"><span>{customer.primaryContact.name.split(/\s+/).map((name) => name[0]).slice(0, 2).join('')}</span><div><strong>{customer.primaryContact.name}</strong><p>{customer.primaryContact.position || 'Primary contact'}</p></div></div><DetailList details={[
      ['Email', customer.primaryContact.email], ['Phone', customer.primaryContact.phone], ['Contact Type', 'Primary Contact'],
    ]} /><div className="profile-card-actions"><button className="button button-secondary" type="button" onClick={() => onNotify('Email integration will be implemented later.')}><Mail size={14} />Send Email</button><button className="button button-secondary" type="button" onClick={() => onNotify('Appointment scheduling will be implemented next.')}><CalendarDays size={14} />Schedule Appointment</button></div></section>

    <section className="profile-card overview-relationship"><header><CardHeading icon={Handshake} title="Marketing Relationship" eyebrow="Account ownership" /></header><div className="representative-highlight"><span>{customer.assignedRepresentative.split(/\s+/).map((name) => name[0]).slice(0, 2).join('')}</span><div><small>Assigned representative</small><strong>{customer.assignedRepresentative}</strong></div></div><DetailList details={[
      ['Lead Source', profile?.leadSource], ['Customer Since', formatDate(profile?.customerSince)], ['Last Interaction', formatDate(customer.lastInteraction)], ['Next Follow-up Date', formatDate(profile?.nextFollowUpDate)],
      ['Relationship Status', profile?.relationshipStatus ? <span className={`relationship-badge relationship-${profile.relationshipStatus.toLowerCase().replace(' ', '-')}`}>{profile.relationshipStatus}</span> : undefined],
    ]} /></section>

    <section className="profile-card overview-appointment"><header><CardHeading icon={CalendarClock} title="Upcoming Appointment" eyebrow="Next engagement" /></header>{appointment ? <div className="appointment-content"><div className="appointment-hero"><div className="appointment-date"><strong>{new Intl.DateTimeFormat('en-PH', { day: '2-digit' }).format(new Date(`${appointment.date}T00:00:00`))}</strong><span>{new Intl.DateTimeFormat('en-PH', { month: 'short' }).format(new Date(`${appointment.date}T00:00:00`))}</span></div><div><span className="appointment-status">{appointment.status}</span><h3>{appointment.type}</h3><p><CalendarClock size={13} />{appointment.time}</p><p><MapPin size={13} />{appointment.location}</p></div></div><DetailList details={[[ 'Contact Person', appointment.contactPerson ], [ 'Assigned Representative', appointment.assignedRepresentative ], [ 'Date', formatDate(appointment.date) ], [ 'Status', appointment.status ]]} /></div> : <div className="compact-empty"><CalendarDays size={24} /><p>No upcoming appointments.</p><button className="button button-secondary" type="button" onClick={() => onNotify('Appointment scheduling will be implemented next.')}>Schedule Appointment</button></div>}</section>

    <section className="profile-card overview-activity"><header><CardHeading icon={Activity} title="Recent Activity" eyebrow="Latest relationship events" /></header>{activities.length ? <ol className="activity-timeline">{activities.slice(0, 5).map((activity) => <li key={activity.id}><span className={`timeline-icon timeline-${activity.kind}`}>{activity.kind === 'appointment' ? <CalendarDays size={14} /> : activity.kind === 'note' ? <StickyNote size={14} /> : activity.kind === 'request' ? <Ship size={14} /> : <FileText size={14} />}</span><div><strong>{activity.description}</strong>{activity.reference && <span className="activity-reference">{activity.reference}</span>}<p>{activity.employee} · {formatDateTime(activity.occurredAt)}</p></div></li>)}</ol> : <div className="compact-empty"><MessageSquareText size={24} /><p>No recent activity is recorded.</p></div>}</section>

    <section className="profile-card overview-notes"><header><CardHeading icon={StickyNote} title="Internal Notes" eyebrow="Marketing only" /><button type="button" onClick={() => onNotify('Internal notes will be implemented next.')}>+ Add Note</button></header><div className="internal-visibility"><StickyNote size={13} />Internal – Not visible to the customer</div>{notes.length ? <div className="internal-notes">{notes.map((note) => <article key={note.id}><div><strong>{note.author}</strong><time dateTime={note.date}>{formatDate(note.date)}</time></div><p>{note.content}</p></article>)}</div> : <div className="compact-empty"><StickyNote size={24} /><p>No internal notes have been added.</p></div>}</section>
  </div>
}
