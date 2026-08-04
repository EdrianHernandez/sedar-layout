interface TodaySchedulePanelProps { onViewCalendar: () => void }

export function TodaySchedulePanel({ onViewCalendar }: TodaySchedulePanelProps) {
  const today = new Date().toISOString().slice(0, 10)
  const appointments = appointmentRepository.getForDate(today).filter((appointment) => appointment.status !== 'Cancelled')
  return (
    <section className="panel schedule-panel" aria-labelledby="schedule-heading">
      <header className="panel-header"><h2 id="schedule-heading">Today's Schedule</h2></header>
      <div className="schedule-empty">{appointments.length ? `${appointments.length} appointment${appointments.length === 1 ? '' : 's'} scheduled today.` : 'No appointments scheduled today.'}</div>
      <footer><button type="button" onClick={onViewCalendar}>View Full Calendar</button></footer>
    </section>
  )
}
import { appointmentRepository } from '../../repositories/appointmentRepository'
