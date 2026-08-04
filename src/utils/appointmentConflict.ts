import type { Appointment } from '../types/appointment'

const excludedStatuses = new Set<Appointment['status']>(['Cancelled', 'No Show'])

export const findAppointmentConflict = (
  appointments: readonly Appointment[],
  representativeId: string,
  startAt: string,
  endAt: string,
  excludedAppointmentId?: string,
): Appointment | undefined => {
  const start = new Date(startAt).getTime()
  const end = new Date(endAt).getTime()
  if (!Number.isFinite(start) || !Number.isFinite(end) || start >= end) return undefined

  return appointments.find((appointment) =>
    appointment.id !== excludedAppointmentId &&
    appointment.assignedRepresentativeId === representativeId &&
    !excludedStatuses.has(appointment.status) &&
    start < new Date(appointment.endAt).getTime() &&
    end > new Date(appointment.startAt).getTime(),
  )
}

export const getConflictingAppointment = findAppointmentConflict
