import { useEffect, useState } from 'react'
import { appointmentRepository } from '../../../repositories/appointmentRepository'
import { isAppointmentOnDate } from '../../../utils/appointmentDateTime'
import { AppointmentDayDrawer } from './AppointmentDayDrawer'

export function AppointmentCalendarInteractions({ customerId }: { customerId: string }) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const appointments = appointmentRepository.getByCustomerId(customerId)
  useEffect(() => {
    const grid = document.querySelector<HTMLElement>('.appointment-calendar-grid')
    if (!grid) return
    const parsedMonth = new Date(`${document.querySelector('.appointment-calendar h3')?.textContent ?? ''} 1`)
    if (Number.isNaN(parsedMonth.getTime())) return
    const cleanups: Array<() => void> = []
    grid.querySelectorAll<HTMLElement>(':scope > div').forEach((cell) => {
      const day = Number(cell.querySelector('strong')?.textContent)
      if (!day) return
      const date = `${parsedMonth.getFullYear()}-${String(parsedMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      const items = appointments.filter((item) => isAppointmentOnDate(item.startAt, date))
      const countLabel = cell.querySelector<HTMLElement>('span')
      if (items.length) {
        const label = countLabel ?? document.createElement('span')
        label.textContent = `${items.length} appointment${items.length === 1 ? '' : 's'}`
        if (!countLabel) cell.append(label)
      } else countLabel?.remove()
      cell.tabIndex = 0
      cell.setAttribute('role', 'button')
      cell.setAttribute('aria-label', items.length ? `${items.length} appointments on ${date}` : `Schedule appointment on ${date}`)
      const activate = () => {
        setSelectedDate(date)
      }
      const click = () => activate()
      const keydown = (event: KeyboardEvent) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); activate() } }
      cell.addEventListener('click', click); cell.addEventListener('keydown', keydown)
      cleanups.push(() => { cell.removeEventListener('click', click); cell.removeEventListener('keydown', keydown) })
    })
    return () => { cleanups.forEach((cleanup) => cleanup()) }
  }, [appointments, customerId])

  const selectedAppointments = selectedDate ? appointments.filter((item) => isAppointmentOnDate(item.startAt, selectedDate)) : []
  return selectedDate ? <AppointmentDayDrawer customerId={customerId} date={selectedDate} appointments={selectedAppointments} onClose={() => setSelectedDate(null)} onSchedule={() => { sessionStorage.setItem('sedar-appointment-selected-date', selectedDate); setSelectedDate(null); window.setTimeout(() => document.querySelector<HTMLButtonElement>('.appointments-tab-header .button-primary')?.click(), 0) }} /> : null
}
