interface TodaySchedulePanelProps { onViewCalendar: () => void }

export function TodaySchedulePanel({ onViewCalendar }: TodaySchedulePanelProps) {
  return (
    <section className="panel schedule-panel" aria-labelledby="schedule-heading">
      <header className="panel-header"><h2 id="schedule-heading">Today's Schedule</h2></header>
      <div className="schedule-empty">No appointments scheduled today.</div>
      <footer><button type="button" onClick={onViewCalendar}>View Full Calendar</button></footer>
    </section>
  )
}
