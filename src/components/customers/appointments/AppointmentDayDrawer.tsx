import { CalendarPlus, Clock3, MapPin, UserRound, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { customerContactRepository } from '../../../repositories/customerContactRepository'
import type { Appointment } from '../../../types/appointment'
import { formatAppointmentTime } from '../../../utils/appointmentDateTime'
import { AppointmentStatusBadge } from './AppointmentBadges'

interface Props {
  customerId: string
  date: string
  appointments: Appointment[]
  onSchedule: () => void
  onClose: () => void
}

export function AppointmentDayDrawer({ customerId, date, appointments, onSchedule, onClose }: Props) {
  const drawerRef = useRef<HTMLElement>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const contacts = new Map(customerContactRepository.getByCustomer(customerId).map((contact) => [contact.id, contact]))

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    drawerRef.current?.focus()
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }
    document.addEventListener('keydown', escape)
    return () => {
      document.body.style.overflow = overflow
      document.removeEventListener('keydown', escape)
      previous?.focus()
    }
  }, [onClose])

  const formattedDate = new Intl.DateTimeFormat('en-PH', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).format(new Date(`${date}T00:00:00`))

  return <div className="appointment-day-drawer-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
    <aside ref={drawerRef} className="appointment-day-drawer" role="dialog" aria-modal="true" aria-labelledby="appointment-day-drawer-title" tabIndex={-1}>
      <header><div><span>Daily Schedule</span><h2 id="appointment-day-drawer-title">{formattedDate}</h2><p>{appointments.length} appointment{appointments.length === 1 ? '' : 's'}</p></div><button type="button" aria-label="Close daily appointments" onClick={onClose}><X size={18} /></button></header>
      <div className="appointment-day-drawer-body">
        {appointments.length ? <div className="appointment-day-list">{appointments.map((appointment) => {
          const contact = contacts.get(appointment.contactId)
          const expanded = expandedId === appointment.id
          return <article key={appointment.id}>
            <div className="appointment-day-card-heading"><div><h3>{appointment.title}</h3><p>{appointment.type}</p></div><AppointmentStatusBadge status={appointment.status} /></div>
            <dl><div><dt><Clock3 size={12} />Time</dt><dd>{formatAppointmentTime(appointment.startAt)} – {formatAppointmentTime(appointment.endAt)}</dd></div><div><dt><UserRound size={12} />Contact</dt><dd>{contact ? `${contact.firstName} ${contact.lastName}` : 'Contact unavailable'}</dd></div><div><dt><MapPin size={12} />Method</dt><dd>{appointment.meetingMethod}{appointment.location ? ` · ${appointment.location}` : ''}</dd></div></dl>
            {expanded && <div className="appointment-day-expanded"><p><strong>Agenda</strong>{appointment.agenda}</p><p><strong>Assigned To</strong>{appointment.assignedRepresentativeName}</p>{appointment.relatedRecord && <p><strong>Related Record</strong>{appointment.relatedRecord.referenceNumber}</p>}</div>}
            <button className="appointment-day-details-button" type="button" aria-expanded={expanded} onClick={() => setExpandedId(expanded ? null : appointment.id)}>{expanded ? 'Hide Details' : 'View Details'}</button>
          </article>
        })}</div> : <div className="appointment-day-empty"><CalendarPlus size={30} /><h3>No appointments scheduled for this date.</h3><p>Schedule an appointment to coordinate the next customer engagement.</p></div>}
      </div>
      <footer><button className="button button-primary" type="button" onClick={onSchedule}><CalendarPlus size={15} />{appointments.length ? 'Schedule Another Appointment' : 'Schedule Appointment'}</button></footer>
    </aside>
  </div>
}
