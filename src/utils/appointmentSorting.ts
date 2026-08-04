import type { Appointment } from '../types/appointment'

const terminalStatuses = new Set<Appointment['status']>(['Completed', 'Cancelled', 'No Show'])

export const sortAppointments = (appointments: readonly Appointment[], now = new Date()): Appointment[] => {
  const current = now.getTime()
  return [...appointments].sort((a, b) => {
    const aTime = new Date(a.startAt).getTime()
    const bTime = new Date(b.startAt).getTime()
    const aFutureActive = !terminalStatuses.has(a.status) && aTime >= current
    const bFutureActive = !terminalStatuses.has(b.status) && bTime >= current
    if (aFutureActive !== bFutureActive) return aFutureActive ? -1 : 1
    return aFutureActive ? aTime - bTime : bTime - aTime
  })
}

export const sortAppointmentsBySchedule = sortAppointments
