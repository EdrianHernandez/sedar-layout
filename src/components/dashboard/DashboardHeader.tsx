import { CalendarDays, Plus } from 'lucide-react'

interface DashboardHeaderProps { onNewRequest: () => void; onSchedule: () => void }

export function DashboardHeader({ onNewRequest, onSchedule }: DashboardHeaderProps) {
  return (
    <header className="dashboard-header">
      <div><h1>Dashboard</h1><p>Overview of marketing and service operations.</p></div>
      <div className="header-actions">
        <button className="button button-primary" type="button" onClick={onNewRequest}><Plus size={15} />New Service Request</button>
        <button className="button button-secondary" type="button" onClick={onSchedule}><CalendarDays size={15} />Schedule Appointment</button>
      </div>
    </header>
  )
}
