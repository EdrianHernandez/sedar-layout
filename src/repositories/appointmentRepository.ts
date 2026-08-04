import { initialAppointments } from '../data/appointmentMockData'
import type { Appointment, AppointmentInput, AppointmentStatus, AppointmentStatusEvent, CancelAppointmentInput, CompleteAppointmentInput, ConfirmAppointmentInput, MarkNoShowAppointmentInput, RescheduleAppointmentInput } from '../types/appointment'
import { isAppointmentOnDate } from '../utils/appointmentDateTime'
import { customerActivityRepository } from './customerActivityRepository'
import { PROTOTYPE_ACTIVITY_ACTOR } from '../types/customerActivity'
import type { ActivityChangeInput } from '../types/customerActivity'

const STORAGE_KEY = 'sedar-marketing-appointments'
const statuses = new Set<AppointmentStatus>(['Pending Confirmation', 'Scheduled', 'Confirmed', 'Rescheduled', 'Completed', 'Cancelled', 'No Show'])

const isAppointment = (value: unknown): value is Appointment => {
  if (!value || typeof value !== 'object') return false
  const item = value as Partial<Appointment>
  return typeof item.id === 'string' && typeof item.customerId === 'string' && typeof item.contactId === 'string' && typeof item.startAt === 'string' && typeof item.endAt === 'string' && typeof item.status === 'string' && statuses.has(item.status as AppointmentStatus) && Array.isArray(item.statusHistory)
}

const load = (): Appointment[] => {
  if (typeof localStorage === 'undefined') return [...initialAppointments]
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
    if (!Array.isArray(parsed) || !parsed.every(isAppointment)) return [...initialAppointments]
    const storedIds = new Set(parsed.map(({ id }) => id))
    return [...parsed, ...initialAppointments.filter(({ id }) => !storedIds.has(id))]
  } catch {
    return [...initialAppointments]
  }
}

const save = (appointments: Appointment[]): void => {
  // Prototype browser storage only. Replace this repository with the production backend API.
  if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, JSON.stringify(appointments))
}

const eventId = (): string => globalThis.crypto?.randomUUID?.() ?? `APT-EVT-${Date.now()}-${Math.random().toString(36).slice(2)}`
const appointmentId = (): string => globalThis.crypto?.randomUUID?.() ?? `APT-${Date.now()}-${Math.random().toString(36).slice(2)}`

const transition = (id: string, status: AppointmentStatus, details: { changedBy?: string; reason?: string; notes?: string; previousStartAt?: string; previousEndAt?: string }, changes: Partial<Appointment>): Appointment | undefined => {
  const current = appointmentRepository.getById(id)
  if (!current) return undefined
  const now = new Date().toISOString()
  const historyEvent: AppointmentStatusEvent = { id: eventId(), fromStatus: current.status, toStatus: status, occurredAt: now, ...details }
  return appointmentRepository.update(id, { ...changes, status, statusHistory: [...current.statusHistory, historyEvent], updatedAt: now })
}

export const appointmentRepository = {
  getAll(): Appointment[] {
    return load()
  },
  getById(id: string): Appointment | undefined {
    return load().find((appointment) => appointment.id === id)
  },
  getByCustomerId(customerId: string): Appointment[] {
    return load().filter((appointment) => appointment.customerId === customerId)
  },
  getByRepresentativeId(representativeId: string): Appointment[] {
    return load().filter((appointment) => appointment.assignedRepresentativeId === representativeId)
  },
  getForDate(date: string): Appointment[] {
    return load().filter((appointment) => isAppointmentOnDate(appointment.startAt, date))
  },
  create(input: AppointmentInput): Appointment {
    const now = new Date().toISOString()
    const status = input.status ?? 'Scheduled'
    const created: Appointment = { ...input, id: appointmentId(), status, statusHistory: [{ id: eventId(), toStatus: status, occurredAt: now }], createdAt: now, updatedAt: now }
    save([created, ...load()])
    customerActivityRepository.appendOnce({ customerId: created.customerId, module: 'Appointments', action: 'Created', description: 'Appointment created.', actor: PROTOTYPE_ACTIVITY_ACTOR, relatedRecord: { type: 'Appointment', id: created.id, referenceNumber: created.id }, visibility: 'Internal', sourceEventKey: `appointment:${created.id}:created`, systemGenerated: true, eventSource: 'appointmentRepository' })
    return created
  },
  update(id: string, changes: Partial<Appointment>): Appointment | undefined {
    const appointments = load()
    const index = appointments.findIndex((appointment) => appointment.id === id)
    if (index < 0) return undefined
    const current = appointments[index]
    const updated: Appointment = { ...current, ...changes, id: current.id, updatedAt: changes.updatedAt ?? new Date().toISOString() }
    appointments[index] = updated
    save(appointments)
    const base = { customerId: updated.customerId, module: 'Appointments' as const, actor: PROTOTYPE_ACTIVITY_ACTOR, relatedRecord: { type: 'Appointment', id: updated.id, referenceNumber: updated.id }, visibility: 'Internal' as const, systemGenerated: true, eventSource: 'appointmentRepository' }
    if (current.status !== updated.status) {
      const action = updated.status === 'Cancelled' ? 'Cancelled' : 'Status Changed'
      const descriptions: Partial<Record<AppointmentStatus, string>> = { Confirmed: 'Appointment confirmed.', Rescheduled: 'Appointment rescheduled.', Completed: 'Appointment completed.', Cancelled: 'Appointment cancelled.', 'No Show': 'Appointment marked as no show.' }
      const safeChanges: ActivityChangeInput[] = [{ field: 'status', previousValue: current.status, newValue: updated.status }]
      if (updated.status === 'Rescheduled') safeChanges.push({ field: 'schedule', previousValue: current.startAt, newValue: updated.startAt })
      customerActivityRepository.appendOnce({ ...base, action, description: descriptions[updated.status] ?? `Appointment status changed to ${updated.status}.`, changes: safeChanges, metadata: updated.status === 'Completed' ? { followUpRequired: Boolean(updated.followUp?.required) } : undefined, sourceEventKey: `appointment:${id}:status:${updated.status}:${updated.statusHistory.at(-1)?.id ?? updated.updatedAt}` })
    }
    return updated
  },
  confirm(id: string, input: ConfirmAppointmentInput = {}): Appointment | undefined {
    return transition(id, 'Confirmed', input, { confirmedAt: new Date().toISOString() })
  },
  reschedule(id: string, input: RescheduleAppointmentInput): Appointment | undefined {
    const current = this.getById(id)
    if (!current) return undefined
    return transition(id, 'Rescheduled', { ...input, previousStartAt: current.startAt, previousEndAt: current.endAt }, { startAt: input.startAt, endAt: input.endAt, rescheduledAt: new Date().toISOString() })
  },
  complete(id: string, input: CompleteAppointmentInput): Appointment | undefined {
    const updated = transition(id, 'Completed', input, { followUp: { required: input.followUpRequired, dueDate: input.followUpDate, completed: false }, completion: { outcome: input.outcome, customerResponse: input.customerResponse, nextAction: input.nextAction, customerVisibleNotes: input.customerVisibleNotes, internalNotes: input.internalNotes, completedBy: input.changedBy }, completedAt: new Date().toISOString() })
    if (updated && input.followUpRequired) customerActivityRepository.appendOnce({ customerId: updated.customerId, module: 'Appointments', action: 'Follow-up Created', description: 'Customer follow-up created.', actor: PROTOTYPE_ACTIVITY_ACTOR, relatedRecord: { type: 'Appointment', id: updated.id, referenceNumber: updated.id }, visibility: 'Internal', metadata: { dueDate: input.followUpDate ?? 'Not provided' }, sourceEventKey: `appointment:${id}:follow-up:${updated.updatedAt}`, systemGenerated: true, eventSource: 'appointmentRepository' })
    return updated
  },
  markNoShow(id: string, input: MarkNoShowAppointmentInput): Appointment | undefined {
    return transition(id, 'No Show', input, { noShow: { party: input.party, notes: input.notes ?? '', followUpAction: input.followUpAction }, noShowAt: new Date().toISOString() })
  },
  cancel(id: string, input: CancelAppointmentInput): Appointment | undefined {
    const cancelledAt = new Date().toISOString()
    return transition(id, 'Cancelled', input, { cancellation: { reason: input.reason, explanation: input.explanation, cancelledAt, cancelledBy: input.changedBy ?? 'SEDAR Marketing' }, cancelledAt })
  },
}
